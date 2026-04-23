# Dira — Project Management API

A RESTful API for a Jira-like project management application. Supports boards, workflow statuses (columns), tasks, subtasks, and JWT-based authentication.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) v6 or higher running locally (or a remote URI)

> MongoDB must be running before starting the server. By default the app connects to `mongodb://localhost:27017/dira`.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your values:

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port the server listens on | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/dira` |
| `JWT_SECRET` | Secret used to sign JWT tokens — **change this** | — |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`, `24h`) | `7d` |

### 3. Start the server

```bash
# Development (restarts on file changes)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000/v1`.

## MCP Server

Dira ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes all 23 API endpoints as tools, letting AI assistants like Claude interact with your boards, tasks, and subtasks directly in the chat.

### Starting the MCP server

The REST API must be running before the MCP server starts.

```bash
# Terminal 1 — REST API (port 3000)
npm start

# Terminal 2 — MCP server (port 4000)
npm run mcp

# Development mode (restarts on file changes)
npm run mcp:dev
```

The MCP server listens on `http://0.0.0.0:4000` and exposes two endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /sse` | Opens the SSE stream (clients connect here) |
| `POST /messages?sessionId=…` | Receives tool calls from the client |

#### MCP environment variables

| Variable | Description | Default |
|---|---|---|
| `MCP_PORT` | Port the MCP server listens on | `4000` |
| `DIRA_API_URL` | Base URL of the Dira REST API | `http://localhost:3000` |

### Connecting from Claude Code

**For yourself (local):**

```bash
claude mcp add dira --transport sse http://localhost:4000/sse
```

**For teammates on the same network** — replace the IP with your machine's local IP (e.g. from `ifconfig` / `ipconfig`):

```bash
claude mcp add dira --transport sse http://192.168.1.x:4000/sse
```

Verify the server was added:

```bash
claude mcp list
```

### Connecting from Claude Desktop

Add the following to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "dira": {
      "transport": "sse",
      "url": "http://localhost:4000/sse"
    }
  }
}
```

Restart Claude Desktop after saving.

### Available tools

| Tool | Description |
|---|---|
| `register` | Create a new account and receive a JWT token |
| `login` | Login and receive a JWT token |
| `get_current_user` | Get the authenticated user profile |
| `create_board` | Create a new project board |
| `list_boards` | List all your boards |
| `get_board` | Get details of a board |
| `update_board` | Rename or update a board |
| `delete_board` | Delete a board and all its data |
| `create_status` | Add a status column to a board |
| `list_statuses` | List status columns on a board |
| `reorder_statuses` | Drag-and-drop reorder status columns |
| `update_status` | Rename or recolor a status column |
| `delete_status` | Delete an empty status column |
| `create_task` | Create a task on a board |
| `list_tasks` | List tasks with optional filters |
| `get_task` | Get task details |
| `update_task` | Update task fields |
| `delete_task` | Delete a task and its subtasks |
| `move_task_status` | Move a task to a different status column |
| `create_subtask` | Add a subtask to a task |
| `list_subtasks` | List subtasks for a task |
| `update_subtask` | Update subtask title or mark it complete |
| `delete_subtask` | Delete a subtask |

> **Authentication:** all tools except `register` and `login` require a `token` parameter. Use the token returned by either of those tools.

### Example conversation with Claude

> *"Log me in with email jane@example.com and password S3cr3t!pass, then show me all my boards."*

Claude will call `login` first, capture the token, then call `list_boards` automatically.

## API Documentation

Interactive Swagger UI is served at:

```
http://localhost:3000/docs
```

The spec source is [`swagger.yaml`](./swagger.yaml).

## API Overview

| Group | Base path | Description |
|---|---|---|
| Auth | `/v1/auth` | Register and login |
| Users | `/v1/users` | Current user profile |
| Boards | `/v1/boards` | Project boards |
| Statuses | `/v1/boards/:boardId/statuses` | Workflow columns |
| Tasks | `/v1/boards/:boardId/tasks` | Board tasks |
| Subtasks | `/v1/tasks/:taskId/subtasks` | Task subtasks |

All protected endpoints require an `Authorization: Bearer <token>` header obtained from `POST /v1/auth/login`.

### Quick example

```bash
# Register
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"S3cr3t!pass"}'

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"S3cr3t!pass"}'

# Create a board (use the token from login)
curl -X POST http://localhost:3000/v1/boards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My First Board"}'
```

## Project Structure

```
dira/
├── swagger.yaml              # OpenAPI 3.0 specification
├── .env.example              # Environment variable template
└── src/
    ├── server.js             # Entry point — connects to MongoDB and starts Express
    ├── app.js                # Express app setup, routes, Swagger UI
    ├── mcp-server.js         # MCP server (SSE transport, 23 tools)
    ├── models/               # Mongoose schemas
    │   ├── user.model.js
    │   ├── board.model.js
    │   ├── status.model.js
    │   ├── task.model.js
    │   └── subtask.model.js
    ├── controllers/          # Request handlers and business logic
    │   ├── auth.controller.js
    │   ├── users.controller.js
    │   ├── boards.controller.js
    │   ├── statuses.controller.js
    │   ├── tasks.controller.js
    │   └── subtasks.controller.js
    ├── routes/               # Express routers
    │   ├── auth.routes.js
    │   ├── users.routes.js
    │   ├── boards.routes.js
    │   ├── statuses.routes.js
    │   ├── tasks.routes.js
    │   └── subtasks.routes.js
    ├── middlewares/
    │   ├── authenticate.js   # JWT guard
    │   ├── validate.js       # Zod request validation
    │   └── errorHandler.js   # Global error handler
    ├── schemas/              # Zod validation schemas (mirror swagger models)
    │   ├── shared.js
    │   ├── auth.schema.js
    │   ├── board.schema.js
    │   ├── status.schema.js
    │   ├── task.schema.js
    │   └── subtask.schema.js
    └── utils/
        ├── AppError.js       # Typed HTTP error class
        ├── asyncHandler.js   # Wraps async controllers for Express error forwarding
        └── boardGuard.js     # Checks board existence and ownership
```

## Tech Stack

| Package | Purpose |
|---|---|
| [Express](https://expressjs.com/) | HTTP framework |
| [Mongoose](https://mongoosejs.com/) | MongoDB ODM |
| [Zod](https://zod.dev/) | Request validation |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | JWT signing and verification |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | Password hashing |
| [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) | Swagger UI serving |
| [js-yaml](https://github.com/nodeca/js-yaml) | YAML parsing for the spec file |
| [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) | MCP server (SSE transport) |
