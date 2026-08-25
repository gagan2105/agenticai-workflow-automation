/**
 * Orchestrator
 * Coordinates all five agents for a single workflow execution.
 * Reports langGraph: 'available' | 'not-installed' with each run.
 */

const planner = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoring = require('./monitoringAgent');
const { updateExecution } = require('../services/executionService');
const { createNotification } = require('../services/notificationService');

// Check LangGraph availability
let langGraphStatus = 'not-installed';
try {
  require('@langchain/langgraph');
  langGraphStatus = 'available';
} catch {
  langGraphStatus = 'not-installed';
}

const MAX_RETRIES = 3;

const runOrchestration = async ({ execution, workflow, ownerId, integrationContext = {} }) => {
  const execId = execution.id || execution._id?.toString();
  const wfId = workflow.id || workflow._id?.toString();

  // 1. Update status to RUNNING
  await updateExecution(execId, { status: 'RUNNING', startedAt: new Date() });

  await monitoring.emit({
    executionId: execId, workflowId: wfId, agent: 'orchestrator',
    eventType: 'ORCHESTRATION_START', level: 'info',
    message: `Starting orchestration (langGraph: ${langGraphStatus})`,
    metadata: { langGraph: langGraphStatus },
  });

  // 2. Planner
  const plan = planner.planWorkflow({ nodes: workflow.nodes, edges: workflow.edges });
  await monitoring.emit({
    executionId: execId, workflowId: wfId, agent: 'planner',
    eventType: 'PLAN_READY', level: 'info',
    message: `Plan ready — ${plan.nodeOrder.length} nodes, confidence ${plan.confidence}`,
    metadata: plan,
  });

  let lastOutput = execution.input || {};
  const nodeMap = {};
  for (const n of (workflow.nodes || [])) nodeMap[n.id] = n;

  // 3. Execute each node in planned order
  for (const nodeId of plan.nodeOrder) {
    const node = nodeMap[nodeId];
    if (!node) continue;

    // Check for pause/cancel
    const freshExec = await updateExecution(execId, {}); // read current status
    if (freshExec && (freshExec.status === 'PAUSED' || freshExec.status === 'CANCELLED')) {
      await monitoring.emit({ executionId: execId, workflowId: wfId, agent: 'monitoring', eventType: 'EXECUTION_STOPPED', level: 'warning', message: `Execution ${freshExec.status}`, metadata: {} });
      return;
    }

    await updateExecution(execId, { currentNode: nodeId });
    await monitoring.emit({ executionId: execId, workflowId: wfId, nodeId, agent: 'execution', eventType: 'NODE_START', level: 'info', message: `Executing node: ${node.data?.label || nodeId}`, metadata: {} });

    let output;
    let retries = 0;

    while (retries <= MAX_RETRIES) {
      try {
        output = await executionAgent.executeNode(node, { integrationContext, input: lastOutput });

        // Validation
        const validation = validationAgent.validateNode(node, output);
        await monitoring.emit({ executionId: execId, workflowId: wfId, nodeId, agent: 'validation', eventType: 'NODE_VALIDATED', level: validation.valid ? 'success' : 'warning', message: validation.valid ? 'Validation passed' : validation.issues.join('; '), metadata: validation });

        if (!validation.valid) {
          const { action } = recoveryAgent.classifyError(validation.issues.join('; '));
          if (action === 'escalate') throw Object.assign(new Error(validation.issues[0]), { escalate: true });
        }

        break; // success
      } catch (err) {
        const { classification, action } = recoveryAgent.classifyError(err.message);
        await monitoring.emit({ executionId: execId, workflowId: wfId, nodeId, agent: 'recovery', eventType: 'NODE_ERROR', level: 'error', message: `${classification}: ${err.message}`, metadata: { classification, action, retry: retries } });

        if (action === 'escalate' || err.escalate || retries >= MAX_RETRIES) {
          await updateExecution(execId, { status: 'FAILED', error: err.message, completedAt: new Date() });
          await monitoring.emit({ executionId: execId, workflowId: wfId, agent: 'monitoring', eventType: 'EXECUTION_FAILED', level: 'error', message: `Execution failed at node ${nodeId}: ${err.message}`, metadata: {} });
          await createNotification({ owner: ownerId, workflowId: wfId, executionId: execId, type: 'failure', title: 'Workflow Failed', message: err.message });
          return;
        }

        retries++;
        await updateExecution(execId, { status: 'RETRYING', retryCount: retries });
        const delay = recoveryAgent.getBackoffDelay(retries);
        await monitoring.emit({ executionId: execId, workflowId: wfId, nodeId, agent: 'recovery', eventType: 'RETRY_SCHEDULED', level: 'warning', message: `Retrying in ${delay}ms (attempt ${retries})`, metadata: { delay } });
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (output) lastOutput = { ...lastOutput, ...output };
    await monitoring.emit({ executionId: execId, workflowId: wfId, nodeId, agent: 'execution', eventType: 'NODE_COMPLETE', level: 'success', message: `Node ${node.data?.label || nodeId} completed`, metadata: { output } });
  }

  // 4. Finalize
  await updateExecution(execId, { status: 'COMPLETED', output: lastOutput, completedAt: new Date(), duration: Date.now() - new Date(execution.startedAt).getTime() });
  await monitoring.emit({ executionId: execId, workflowId: wfId, agent: 'monitoring', eventType: 'EXECUTION_COMPLETE', level: 'success', message: 'Workflow execution completed successfully', metadata: { output: lastOutput } });
  await createNotification({ owner: ownerId, workflowId: wfId, executionId: execId, type: 'success', title: 'Workflow Completed', message: `${workflow.name} finished successfully` });
};

module.exports = { runOrchestration, langGraphStatus };
