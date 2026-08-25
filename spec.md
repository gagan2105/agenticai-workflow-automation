# Agentflow_AI — Complete Specification

## Project Overview

Build a full-stack AI Operations Automation Platform called **Agentic AI Automation Platform (Agentflow_AI)** that lets operators describe an automation in natural language and turn it into an executable visual workflow. The platform must generate workflow graphs from prompts, render those graphs on a drag-and-drop canvas, execute them through a chain of cooperating AI agents, integrate with real third-party tools (Gmail, Slack, Discord, Google Sheets) over OAuth, queue and retry background jobs, stream live execution events to the browser, and persist a full timeline of every step for auditing.

---

## Tech Stack

**Frontend:** Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, React Flow (@xyflow/react), Socket.IO client, lucide-react icons.

**Backend:** Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, BullMQ on Redis (via ioredis), Socket.IO, helmet, morgan, compression, express-validator, bcryptjs.

**AI:** OpenRouter API (primary), Google Generative AI SDK / Gemini (fallback), LangChain / LangGraph (orchestration substrate).

**OAuth integrations:** Gmail, Slack, Discord, Google Sheets.

Sensitive credentials are encrypted at rest with an application-level key (`CREDENTIAL_ENCRYPTION_KEY`).

---

## Core Features

### Authentication
- Registration and login
- JWT-based session handling
- Protected routes
- `/auth/me` profile endpoint
- Role separation: `admin` | `operator`
- Password hashing with bcrypt at cost 12
- Persistent login state on client via Zustand

### Workflow Management
- Create workflows manually or from a natural-language prompt
- List and search workflows
- Open any workflow on a React Flow canvas
- Drag nodes from a palette
- Configure each node through a side panel
- Save, duplicate, version, and delete workflows
- Trigger executions on demand
- Every workflow stores: nodes, edges, trigger config, tags, version number

### Agentic Orchestration
Fixed agent chain per execution:
1. **Planner Agent** — decides node ordering, emits confidence score
2. **Execution Agent** — runs each node against the correct integration or AI provider
3. **Validation Agent** — verifies required output fields
4. **Recovery Agent** — classifies failures (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and decides between `retry_with_backoff` and `escalate`
5. **Monitoring Agent** — emits timeline events

LangGraph must be importable as the orchestration substrate. The orchestrator must report `langGraph: 'available' | 'not-installed'` with each run.

### Third-Party Integrations
- **Gmail** — send and read mail
- **Slack** — post messages and subscribe to events
- **Discord** — post bot messages
- **Google Sheets** — append rows and read ranges

Each provider must support:
- OAuth start endpoint
- OAuth callback endpoint
- Connected/disconnected status

Access and refresh tokens must be encrypted at rest. Missing or expired credentials must surface as `INTEGRATION_NOT_CONNECTED` or `AUTH_EXPIRED` errors — never silent 500s.

### Execution Engine
- Persist every run as an `Execution` document
- Status enum: `PENDING | RUNNING | COMPLETED | FAILED | RETRYING | PAUSED | CANCELLED`
- Record workflow snapshot at run time
- Capture: input, output, error, duration, retry count
- Write one `ExecutionLog` row per agent event
- Users can pause, resume, and cancel a running execution
- BullMQ on Redis handles background scheduling and retry backoff
- In-memory fallback when Redis is not configured

### AI Workflow Generation
- User submits a prompt → system returns a complete workflow (named nodes, positions, edges, per-node config)
- Provider priority: OpenRouter → Gemini → deterministic rule-based builder
- Deterministic builder must handle: send email, invoice routing, Slack/Discord notification, sheet append
- Node catalog groups: triggers, actions, AI nodes, logic nodes

### Real-Time Layer
- Socket.IO broadcasts agent events per execution to subscribed clients
- Client renders events as a live timeline
- Notifications persist and appear in a notifications drawer

---

## Frontend Pages (Next.js Pages Router)

- **`/`** — Landing page with platform intro, AI workflow automation overview, multi-agent orchestration explanation, workflow generation showcase, CTA buttons, feature sections, responsive layout, auth-aware redirects, dark theme support.
- **`/login`** — Login form with email/password, JWT auth flow, Zustand persistence, form validation, loading states, redirect after login.
- **`/register`** — Registration form with account creation, password validation, JWT auth flow, Zustand persistence, loading states.
- **`/dashboard`** — Operator console: workflow metrics, active workflow statistics, recent execution summaries, success rate indicators, recent workflow lists, AI reasoning activity feeds, real-time execution events, responsive metric cards. Must include `MetricGrid`, `AppShell`, workflow summary cards, AI activity panel.
- **`/workflows/builder`** — AI-powered prompt-to-workflow page: automation prompt input, AI graph generation, React Flow canvas rendering, workflow preview, graph editing, validation, save, execution trigger, multi-agent visualization. Required components: `WorkflowCanvas`, `PromptInputPanel`, `GraphPreviewPanel`, `WorkflowToolbar`.
- **`/workflows/[id]`** — Full workflow editor: node palette (left), React Flow canvas (center), node config panel (right). Node editing, workflow connections, execution controls, execution logs, workflow metadata, validation, retry execution, real-time monitoring.
- **`/executions`** — List all workflow executions: status, duration, timeline links, logs, success/failure indicators, retry support, filtering, sorting, pagination, live updates via Socket.IO.
- **`/integrations`** — Supported providers (Gmail, Slack, Discord, Google Sheets): connection status, OAuth connection flow, reconnect, integration testing, provider config management, enable/disable toggling.
- **`/settings`** — User profile management, role info, API key status, encryption key health checks, credential management, notification preferences, theme settings, security controls, logout.

---

## Backend Architecture

- **Routes layer** — HTTP routing, request validation (express-validator), middleware composition.
- **Controllers layer** — Request parsing and response shaping only. Never talks to Mongo directly.
- **Services layer** — Business logic: workflow CRUD, execution lifecycle, integration token management, retry classification, notification creation, AI generation, log aggregation.
- **Agents layer** — planner, execution, validation, recovery, monitoring, orchestrator modules. Agents are pure — no HTTP knowledge.
- **Integrations layer** — Each third-party SDK wrapped behind a common interface defined in `baseIntegration.js`.
- **Queues layer** — BullMQ and Redis wrapper.
- **Config layer** — Environment loading, Mongo connection (with in-memory fallback), Socket.IO bootstrapping.

---

## Database Collections

### Users
- name, email, hashed password (select: false), role (admin | operator), lastLogin, createdAt, updatedAt

### Workflows
- name, description, owner (ref: User), status (draft | active | paused | archived), triggerConfig, nodes (React Flow), edges (React Flow), version, tags, lastExecutedAt, createdAt, updatedAt

### Executions
- workflowId (ref: Workflow), workflowSnapshot (immutable), status (PENDING | RUNNING | COMPLETED | FAILED | RETRYING | PAUSED | CANCELLED), currentNode, startedAt, completedAt, duration, input, output, error, retryCount

### ExecutionLogs
- executionId (ref: Execution), workflowId (ref: Workflow), nodeId, agent (planner | execution | validation | recovery | monitoring), level (info | warning | error | success), eventType, message, metadata, createdAt

### Integrations
- owner (ref: User), provider (gmail | slack | google-sheets | discord | openrouter | gemini), status (connected | disconnected), scopes, accessToken (encrypted), refreshToken (encrypted), tokenExpiresAt, error

### Notifications
- owner (ref: User), workflowId, executionId, type, title, message, read (bool), createdAt

### AgentMemory
- workflowId (ref: Workflow), executionId (ref: Execution), agent, key, value, confidence, createdAt

---

## API Endpoints

### Health & Auth
- `GET  /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/auth/me`

### Workflows
- `GET  /api/workflows/dashboard`
- `GET  /api/workflows`
- `POST /api/workflows`
- `POST /api/workflows/generate`
- `GET  /api/workflows/:id`
- `PUT  /api/workflows/:id`
- `POST /api/workflows/:id/duplicate`
- `POST /api/workflows/:id/execute`
- `DELETE /api/workflows/:id`

### Executions
- `GET  /api/executions`
- `GET  /api/executions/:id`
- `GET  /api/executions/:id/timeline`
- `POST /api/executions/:id/pause`
- `POST /api/executions/:id/resume`
- `POST /api/executions/:id/cancel`

### Integrations
- `GET  /api/integrations`
- `GET  /api/integrations/status`
- `GET  /api/integrations/oauth/:provider/start`
- `GET  /api/integrations/oauth/:provider/callback`
- `GET  /api/integrations/oauth/error`
- `POST /api/integrations`

### Notifications
- `GET  /api/notifications`

---

## Folder Structure

### Frontend (`client/`)
```
client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── MetricGrid/
    │   ├── NodePalette/
    │   ├── NodeConfigPanel/
    │   ├── WorkflowCanvas/
    │   └── ProtectedRoute/
    ├── pages/
    │   ├── index.js
    │   ├── login.js
    │   ├── register.js
    │   ├── dashboard.js
    │   ├── executions.js
    │   ├── integrations.js
    │   ├── settings.js
    │   └── workflows/
    │       ├── builder.js
    │       └── [id].js
    ├── store/
    │   ├── authStore.js
    │   └── workflowStore.js
    ├── lib/
    │   └── axios.js
    └── styles/
        └── globals.css
```

### Backend (`server/`)
```
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── socket.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── workflowRoutes.js
    │   ├── executionRoutes.js
    │   ├── integrationRoutes.js
    │   └── notificationRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── workflowController.js
    │   ├── executionController.js
    │   ├── integrationController.js
    │   └── notificationController.js
    ├── services/
    │   ├── authService.js
    │   ├── workflowService.js
    │   ├── executionService.js
    │   ├── integrationService.js
    │   ├── notificationService.js
    │   ├── aiGenerationService.js
    │   └── logService.js
    ├── agents/
    │   ├── plannerAgent.js
    │   ├── executionAgent.js
    │   ├── validationAgent.js
    │   ├── recoveryAgent.js
    │   ├── monitoringAgent.js
    │   └── orchestrator.js
    ├── integrations/
    │   ├── baseIntegration.js
    │   ├── gmailIntegration.js
    │   ├── slackIntegration.js
    │   ├── discordIntegration.js
    │   └── googleSheetsIntegration.js
    ├── models/
    │   ├── User.js
    │   ├── Workflow.js
    │   ├── Execution.js
    │   ├── ExecutionLog.js
    │   ├── Integration.js
    │   ├── Notification.js
    │   └── AgentMemory.js
    ├── queues/
    │   ├── executionQueue.js
    │   └── redisClient.js
    ├── middleware/
    │   ├── auth.js
    │   ├── validate.js
    │   └── errorHandler.js
    └── index.js
```

---

## Development Phases

- **Phase 1** — Project init (Next.js + Express), MongoDB with in-memory fallback, JWT auth, protected routes, Zustand auth persistence, AppShell layout, ProtectedRoute.
- **Phase 2** — Workflow CRUD, dashboard metrics, React Flow canvas, node palette, node config panel, workflow persistence.
- **Phase 3** — AI workflow generator (OpenRouter → Gemini → deterministic fallback), builder page integration.
- **Phase 4** — Multi-agent orchestration (planner, execution, validation, recovery, monitoring), execution lifecycle (pause/resume/cancel), ExecutionLog persistence.
- **Phase 5** — Gmail, Slack, Discord, Google Sheets integrations with OAuth, encrypted credential storage, token lifecycle.
- **Phase 6** — BullMQ + Redis, Socket.IO real-time event streaming, live timeline, notifications drawer.

---

## UI & UX Requirements

- Clean operator-console aesthetic with Tailwind CSS
- Fully responsive
- Loading states and skeleton loaders
- React Flow animated edges
- Drag-from-palette node creation
- Right-hand configuration panel for selected nodes
- Live execution timeline with color-coded agent badges: planner / execution / validation / recovery / monitoring
- Notifications drawer accessible from AppShell

---

## Security Requirements

- bcrypt at cost 12
- JWT signed with `JWT_SECRET`
- OAuth tokens encrypted at rest with `CREDENTIAL_ENCRYPTION_KEY`
- HTTP security headers via helmet
- CORS limited to `CLIENT_URL`
- Rate-limit auth endpoints via express-rate-limit
- Validate every request body with express-validator
- Never log decrypted tokens
- Missing/expired credentials → explicit `INTEGRATION_NOT_CONNECTED` / `AUTH_EXPIRED` error, not a generic 500

---

## Final Expected Outcome

An operator can describe an automation in plain English, watch it materialize as a graph on the canvas, save it, execute it through the agent chain, see each agent event stream in real time, recover or escalate failures automatically, and receive notifications — all backed by real OAuth integrations and a full audit trail in MongoDB. The final application feels like a modern operations console, close in spirit to n8n or Zapier, but with an explicit agentic execution layer on top.

---

## Codex Implementation Rules

- Treat `spec.md` as the single source of truth.
- Build phase by phase.
- Keep controllers thin — push all logic into services.
- Keep agents pure — no HTTP knowledge.
- Wrap every integration behind `baseIntegration.js`.
- Never call Mongo from a controller.
- Never call an integration from an agent without going through the integration service.
- Treat every secret as `process.env.*`.
- Use in-memory store fallback when Mongo or Redis is unavailable.
- Emit a Socket.IO event for every agent step.
- Write one `ExecutionLog` per agent event.
- Report all files created or changed at the end of every phase.
