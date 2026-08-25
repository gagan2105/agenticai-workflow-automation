/**
 * Planner Agent
 * Decides the node execution ordering and emits a confidence score.
 * Pure module — no HTTP knowledge, no Mongoose calls.
 */

const planWorkflow = ({ nodes = [], edges = [] }) => {
  // Topological sort (BFS from trigger nodes)
  const inDegree = {};
  const adj = {};

  for (const node of nodes) {
    inDegree[node.id] = 0;
    adj[node.id] = [];
  }

  for (const edge of edges) {
    adj[edge.source] = adj[edge.source] || [];
    adj[edge.source].push(edge.target);
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  }

  const queue = Object.keys(inDegree).filter((id) => inDegree[id] === 0);
  const order = [];

  while (queue.length) {
    const nodeId = queue.shift();
    order.push(nodeId);
    for (const neighbor of adj[nodeId] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  // Confidence score: higher when graph is well-formed
  const hasCycle = order.length < nodes.length;
  const confidence = hasCycle ? 0.4 : nodes.length > 0 ? 0.92 : 0.5;

  return {
    nodeOrder: order,
    confidence,
    warnings: hasCycle ? ['Cycle detected in workflow graph — execution may be incomplete'] : [],
  };
};

module.exports = { planWorkflow };
