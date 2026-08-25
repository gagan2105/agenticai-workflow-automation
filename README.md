<div align="center">

<img src="https://img.shields.io/badge/Agentflow%20AI-Multi--Agent%20Automation-6366f1?style=for-the-badge&logo=lightning&logoColor=white" alt="Agentflow AI" />

# ⚡ Agentflow AI

### _AI-Powered Workflow Automation Platform_

**Build. Visualize. Execute. Observe.**  
Describe your automation in plain English — watch five cooperating AI agents bring it to life.

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![React Flow](https://img.shields.io/badge/React%20Flow-12-ff6b6b?style=flat-square)](https://reactflow.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Optional-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Multi-Agent Orchestration](#-multi-agent-orchestration)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Specification (SDD)](#-specification-sdd)
- [Development Phases](#-development-phases)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Agentflow AI** is a full-stack, spec-driven agentic AI automation platform that lets users:

- 🗣️ **Describe workflows in plain English** — AI generates a visual node graph instantly
- 🎨 **Drag-and-drop visual builder** — powered by React Flow with custom node types
- 🤖 **Five-agent orchestration chain** — Planner → Executor → Validator → Recovery → Monitor
- 📡 **Live execution streaming** — every agent event streamed to the browser via Socket.IO
- 🔐 **Secure integration management** — AES-256 encrypted OAuth credentials for Gmail, Slack, Discord, Google Sheets

Built using **Spec Driven Development (SDD)** — every component is traced back to `spec.md`, the single source of truth.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth    │  │   Workflow   │  │   Executions Live    │  │
│  │ Login /  │  │   Builder   │  │   Timeline (Socket)  │  │
│  │ Register │  │ React Flow   │  │   Agent Event Feed   │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + Socket.IO
┌────────────────────────▼────────────────────────────────────┐
│                  BACKEND (Express + Node.js)                 │
│                                                             │
│  Routes → Controllers → Services → Models                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              ORCHESTRATION ENGINE                     │  │
│  │                                                       │  │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐          │  │
│  │  │ Planner │→ │Execution │→ │ Validation │          │  │
│  │  │  Agent  │  │  Agent   │  │   Agent    │          │  │
│  │  └─────────┘  └──────────┘  └─────┬──────┘          │  │
│  │                                   │                  │  │
│  │                          ┌────────▼──────┐           │  │
│  │                          │   Recovery    │           │  │
│  │                          │    Agent      │           │  │
│  │                          └────────┬──────┘           │  │
│  │                                   │                  │  │
│  │                          ┌────────▼──────┐           │  │
│  │                          │  Monitoring   │→ Socket   │  │
│  │                          │    Agent      │           │  │
│  │                          └───────────────┘           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  MongoDB / In-Memory Store (fallback)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 Multi-Agent Orchestration

Agentflow AI coordinates five purpose-built agents for every workflow execution:

| Agent | Role | Key Behaviour |
|---|---|---|
| 🧠 **Planner** | Workflow analysis & ordering | Topological sort of node DAG, confidence scoring |
| ⚡ **Execution** | Node dispatch | Routes each node to correct integration or AI provider |
| ✅ **Validation** | Output verification | Enforces schema rules, flags missing required fields |
| 🔄 **Recovery** | Fault handling | Error classification, exponential backoff, escalation guard |
| 📡 **Monitoring** | Observability | Real-time Socket.IO event broadcast + structured log persistence |

### Execution Flow

```
USER: "Execute Workflow"
         │
         ▼
  Orchestrator starts
         │
    ┌────▼────┐
    │ Planner │  ← Topological sort → ordered node plan
    └────┬────┘
         │ (for each node in plan)
    ┌────▼────┐
    │Executor │  ← Call integration/AI provider
    └────┬────┘
         │
    ┌────▼────┐
    │Validator│  ← Check output schema
    └────┬────┘
         │ (on failure)
    ┌────▼────┐
    │Recovery │  ← Classify error → retry / escalate
    └────┬────┘
         │ (always)
    ┌────▼────┐
    │Monitor  │  ← Emit Socket.IO event → Frontend Timeline
    └─────────┘
```

### Error Classification & Recovery

```
Error Type          → Action
─────────────────────────────────────────────
CREDENTIAL_ERROR    → Escalate immediately (no retries)
RATE_LIMIT          → Retry with exponential backoff
NETWORK_ERROR       → Retry up to 3 times
VALIDATION_ERROR    → Escalate (config issue)
UNKNOWN             → Retry → then escalate
```

---

## 🛠️ Tech Stack

### Backend (`server/`)
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **MongoDB + Mongoose** | Primary database with in-memory fallback |
| **Socket.IO 4** | Real-time bidirectional event streaming |
| **BullMQ + IORedis** | Background job queuing (optional) |
| **bcryptjs** | Password hashing (cost factor 12) |
| **jsonwebtoken** | JWT-based stateless authentication |
| **AES-256-CBC** | Credential encryption at rest |
| **OpenRouter / Gemini** | AI workflow generation |
| **express-validator** | Input validation & sanitization |
| **express-rate-limit** | Auth rate limiting |
| **Helmet + CORS** | Security headers |

### Frontend (`client/`)
| Technology | Purpose |
|---|---|
| **Next.js 16 (Pages Router)** | Full-stack React framework |
| **React Flow (@xyflow/react)** | Visual workflow canvas |
| **Zustand + Persist** | Global state management |
| **Axios** | HTTP API client with JWT interceptors |
| **Socket.IO Client** | Live execution event streaming |
| **Lucide React** | Icon system |
| **Vanilla CSS** | Custom design system (dark theme, glassmorphism) |

---

## ✨ Features

### 🎨 Visual Workflow Builder
- Drag-and-drop React Flow canvas with custom node types
- Node palette with Triggers, Actions, AI Nodes, and Logic categories
- Per-node configuration panel with dynamic field schemas
- Animated edges with `smoothstep` routing
- Minimap and zoom controls

### 🤖 AI Workflow Generation
- Natural language → structured workflow graph
- Multi-provider fallback: **OpenRouter** → **Google Gemini** → **Deterministic Rule-Based Builder**
- Automatic node positioning and edge generation

### ⚡ Real-Time Execution Monitoring
- Live Socket.IO event stream to `/executions` page
- Per-agent timeline with colored badges
- Pause, Resume, and Cancel execution controls

### 🔗 Integration Hub
- **Gmail** — Send emails
- **Slack** — Post channel messages
- **Discord** — Post bot messages
- **Google Sheets** — Append rows
- Sandbox mock fallback for local development
- AES-256 encrypted credential storage

### 🔒 Security
- JWT authentication with in-memory user fallback
- Role-based access control (RBAC)
- AES-256-CBC token encryption at rest
- Rate limiting on auth endpoints
- HTTP security headers via Helmet

### 📊 Operator Dashboard
- Real-time metrics (Total Workflows, Success Rate, Active Executions)
- Recent workflows and execution history
- AI agent activity feed
- Notification system with unread badge

---

## 📁 Project Structure

```
agentflow-ai/
├── spec.md                          # 📋 Single source of truth (SDD)
├── .gitignore
├── README.md
│
├── server/                          # Backend (Express + Node.js)
│   ├── src/
│   │   ├── index.js                 # Server entry point
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB + in-memory fallback
│   │   │   ├── env.js               # Environment config loader
│   │   │   └── socket.js            # Socket.IO initialization
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Workflow.js
│   │   │   ├── Execution.js
│   │   │   ├── ExecutionLog.js
│   │   │   ├── Integration.js       # AES-256 encrypted credentials
│   │   │   ├── Notification.js
│   │   │   └── AgentMemory.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── workflowRoutes.js
│   │   │   ├── executionRoutes.js
│   │   │   ├── integrationRoutes.js
│   │   │   └── notificationRoutes.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── workflowController.js
│   │   │   ├── executionController.js
│   │   │   ├── integrationController.js
│   │   │   └── notificationController.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── workflowService.js
│   │   │   ├── executionService.js
│   │   │   ├── aiGenerationService.js
│   │   │   ├── integrationService.js
│   │   │   └── notificationService.js
│   │   ├── agents/                  # 🤖 Multi-agent engine
│   │   │   ├── orchestrator.js      # Coordination layer
│   │   │   ├── plannerAgent.js      # DAG topological sort
│   │   │   ├── executionAgent.js    # Node dispatch
│   │   │   ├── validationAgent.js   # Output verification
│   │   │   ├── recoveryAgent.js     # Fault classification + retry
│   │   │   └── monitoringAgent.js   # Socket.IO broadcaster
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification
│   │   │   ├── validate.js          # express-validator handler
│   │   │   └── errorHandler.js      # Global error handler
│   │   ├── integrations/
│   │   │   └── baseIntegration.js
│   │   └── queues/
│   │       ├── redisClient.js
│   │       └── executionQueue.js
│   └── package.json
│
└── client/                          # Frontend (Next.js 16)
    ├── pages/
    │   ├── _app.js
    │   ├── index.js                 # Landing page
    │   ├── login.js
    │   ├── register.js
    │   ├── dashboard.js
    │   ├── executions.js            # Live agent timeline
    │   ├── integrations.js
    │   ├── settings.js
    │   └── workflows/
    │       ├── builder.js           # AI prompt → workflow
    │       └── [id].js              # React Flow canvas editor
    ├── components/
    │   ├── AppShell/                # Sidebar layout
    │   ├── MetricGrid/              # Dashboard KPI cards
    │   ├── NodePalette/             # Draggable node types
    │   ├── NodeConfigPanel/         # Per-node config editor
    │   ├── WorkflowCanvas/          # React Flow wrapper
    │   └── ProtectedRoute/          # Auth guard
    ├── store/
    │   ├── authStore.js             # Zustand auth (persisted)
    │   └── workflowStore.js         # Workflow state
    ├── lib/
    │   └── axios.js                 # API client + JWT interceptor
    ├── styles/
    │   └── globals.css              # Design system
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org))
- **Git**
- **MongoDB** (optional — in-memory fallback works out of the box)
- **Redis** (optional — required only for BullMQ queuing)

### 1. Clone the Repository

```bash
git clone https://github.com/gagan2105/agenticai-workflow-automation.git
cd agenticai-workflow-automation
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env   # or create .env manually
```

> See [Environment Variables](#-environment-variables) below for all options.  
> **The app runs fully without MongoDB or Redis** using built-in in-memory fallback — no external services required for local development.

### 4. Start the Backend

```bash
npm run dev
```

> API server starts at **http://localhost:5000**  
> Health check: `GET http://localhost:5000/api/health`

### 5. Install Frontend Dependencies

```bash
cd ../client
npm install
```

### 6. Start the Frontend

```bash
npm run dev
```

> Next.js app starts at **http://localhost:3000**

### 7. Open the App

Navigate to [http://localhost:3000](http://localhost:3000), register a new account, and start building workflows!

---

## 🔧 Environment Variables

### `server/.env`

```env
# ─── Server ────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# ─── Auth ──────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# ─── Database (Optional — in-memory fallback if blank) ─────
MONGO_URI=

# ─── Encryption ────────────────────────────────────────────
# 32 hex bytes = 64 characters
CREDENTIAL_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000001

# ─── AI Providers (Optional — deterministic fallback if blank)
OPENROUTER_API_KEY=
GEMINI_API_KEY=

# ─── Redis (Optional — mock fallback if blank) ─────────────
REDIS_URL=

# ─── OAuth Integrations (Optional) ────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

### `client/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

> **Note:** `.env` files are excluded from the repository. Never commit secrets.

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user |

### Workflows

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/workflows/dashboard` | ✅ | Dashboard metrics |
| `GET` | `/api/workflows` | ✅ | List all workflows |
| `POST` | `/api/workflows` | ✅ | Create new workflow |
| `POST` | `/api/workflows/generate` | ✅ | AI generate from prompt |
| `GET` | `/api/workflows/:id` | ✅ | Get workflow by ID |
| `PUT` | `/api/workflows/:id` | ✅ | Update workflow |
| `POST` | `/api/workflows/:id/execute` | ✅ | Trigger execution |
| `POST` | `/api/workflows/:id/duplicate` | ✅ | Duplicate workflow |
| `DELETE` | `/api/workflows/:id` | ✅ | Delete workflow |

### Executions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/executions` | ✅ | List executions |
| `GET` | `/api/executions/:id` | ✅ | Get execution details |
| `GET` | `/api/executions/:id/timeline` | ✅ | Get agent event timeline |
| `POST` | `/api/executions/:id/pause` | ✅ | Pause execution |
| `POST` | `/api/executions/:id/resume` | ✅ | Resume execution |
| `POST` | `/api/executions/:id/cancel` | ✅ | Cancel execution |

### Integrations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/integrations/status` | ✅ | Get connection status |
| `GET` | `/api/integrations/oauth/:provider/start` | ✅ | Begin OAuth flow |
| `GET` | `/api/integrations` | ✅ | List all integrations |
| `POST` | `/api/integrations` | ✅ | Upsert integration |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✅ | Get notifications |
| `PATCH` | `/api/notifications/:id/read` | ✅ | Mark as read |

### Socket.IO Events

| Event | Direction | Payload |
|---|---|---|
| `subscribe:execution` | Client → Server | `executionId` |
| `agent:event` | Server → Client | `{ executionId, agent, eventType, data, timestamp }` |

---

## 📋 Specification (SDD)

This project was built using **Spec Driven Development (SDD)**. The complete specification lives in [`spec.md`](./spec.md) and covers:

- Project overview and goals
- Tech stack decisions with rationale
- Complete database schema (7 collections)
- All API endpoint signatures
- Agent behaviour contracts
- Folder structure and naming conventions
- UI/UX requirements
- Security requirements
- Development phase plan

Every file in this codebase traces back to a requirement in `spec.md`.

---

## 🗺️ Development Phases

| Phase | Status | Description |
|---|---|---|
| **Phase 1** | ✅ Complete | Backend scaffold, auth, DB models, middleware |
| **Phase 2** | ✅ Complete | Workflow CRUD, React Flow canvas, node palette |
| **Phase 3** | ✅ Complete | AI generation service (OpenRouter/Gemini/Deterministic) |
| **Phase 4** | ✅ Complete | Multi-agent orchestration engine |
| **Phase 5** | ✅ Complete | Real-time Socket.IO monitoring & execution timeline |
| **Phase 6** | 🚧 In Progress | Production OAuth integration (Gmail, Slack, Discord, Sheets) |
| **Phase 7** | 📅 Planned | Redis-backed BullMQ job queuing |
| **Phase 8** | 📅 Planned | LangGraph orchestration integration |

---

## 🧪 Running Without External Services

Agentflow AI is designed for **zero-configuration local development**:

| Service | Status Without Config |
|---|---|
| MongoDB | ✅ In-memory store fallback |
| Redis | ✅ Mock queue fallback |
| OpenRouter API | ✅ Deterministic workflow builder |
| Gemini API | ✅ Deterministic workflow builder |
| Gmail / Slack / Discord / Google Sheets | ✅ Sandbox mock clients |

---

## 🤝 Contributing

Contributions are welcome! Please follow this workflow:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Read `spec.md` to understand architectural constraints
4. Make your changes following the tiered architecture pattern
5. Commit: `git commit -m "feat: add your feature"`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Architecture Rules

- **Routes** → only wiring HTTP to controllers
- **Controllers** → only delegate to services, no business logic
- **Services** → all business logic, no direct HTTP knowledge
- **Agents** → pure functions, no Mongo/HTTP access
- **Models** → schema definitions + field-level hooks only

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ using Spec Driven Development (SDD)

**[Live Demo](https://github.com/gagan2105/agenticai-workflow-automation)** · **[Report Bug](https://github.com/gagan2105/agenticai-workflow-automation/issues)** · **[Request Feature](https://github.com/gagan2105/agenticai-workflow-automation/issues)**

</div>
