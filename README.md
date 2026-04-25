# Dira — Project Management API

A RESTful API for a Jira-like project management application. Supports boards, workflow statuses (columns), tasks, subtasks, comments, JWT-based authentication, and invite-code board sharing.

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

Dira ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes all 27 API endpoints as tools, letting AI assistants like Claude interact with your boards, tasks, subtasks, and comments directly in the chat.

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
| `join_board` | Join an existing board using its invite code |
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
| `create_comment` | Add a comment to a task |
| `list_comments` | List all comments on a task |
| `delete_comment` | Delete a comment (author only) |

> **Authentication:** all tools except `register` and `login` require a `token` parameter. Use the token returned by either of those tools.

### Example conversation with Claude

> *"Log me in with email jane@example.com and password S3cr3t!pass, then show me all my boards."*

Claude will call `login` first, capture the token, then call `list_boards` automatically.

## Web UI

Dira ships a browser-based Kanban interface built as a vanilla JS SPA served by a lightweight Express BFF (Backend-for-Frontend) that proxies requests to the REST API.

### Features

- **Login / Register** — tab-based auth form with automatic redirect on valid token
- **Boards list** — grid of your project boards with create and delete actions; each board shows its invite code on hover (click to copy); members see a "member" badge instead of the delete button
- **Join a board** — "Join Board" button opens a modal where you enter an invite code to gain full access to that board (except deleting it)
- **Kanban board** — multi-column view with drag-and-drop tasks between status columns, color-coded columns, and task detail modals (title, description, priority, due date, subtasks, comments); the invite code is shown in the navbar for easy sharing

### Starting the UI

The REST API must be running first (port 3000).

```bash
# Terminal 1 — REST API (if not already running)
npm start

# Terminal 2 — UI / BFF server
cd ui
npm install
npm start        # production
npm run dev      # development (restarts on file changes)
```

The UI is available at `http://localhost:3001`.

### UI environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the BFF server listens on | `3001` |
| `API_URL` | Base URL of the Dira REST API | `http://localhost:3000` |

### UI structure

```
ui/
├── package.json
├── server.js          # Express BFF — serves static files and proxies API requests
└── public/
    ├── index.html     # Login / Register page
    ├── boards.html    # Boards list page
    ├── board.html     # Kanban board page
    └── js/
        ├── auth.js    # Auth API calls and JWT helpers
        ├── boards.js  # Board CRUD functions
        └── board.js   # Board rendering, drag-and-drop, task management
```

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
| Board sharing | `POST /v1/boards/join` | Join a board via invite code |
| Statuses | `/v1/boards/:boardId/statuses` | Workflow columns |
| Tasks | `/v1/boards/:boardId/tasks` | Board tasks |
| Subtasks | `/v1/tasks/:taskId/subtasks` | Task subtasks |
| Comments | `/v1/tasks/:taskId/comments` | Task comments |

### Board sharing

Every board has a unique 8-character invite code (e.g. `A1B2C3D4`). Share it with anyone who has a Dira account — they join by posting the code:

```bash
curl -X POST http://localhost:3000/v1/boards/join \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"inviteCode":"A1B2C3D4"}'
```

Members have full access (create/edit/delete tasks, subtasks, comments, manage columns) except they cannot delete the board itself. The owner can always see and share the invite code from the board header in the UI.

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
├── ui/                       # Web UI (BFF + SPA)
│   ├── server.js             # Express BFF — static files + API proxy (port 3001)
│   └── public/               # Vanilla JS SPA
│       ├── index.html        # Login / Register page
│       ├── boards.html       # Boards list page
│       ├── board.html        # Kanban board page
│       └── js/               # Client-side JS modules
└── src/
    ├── server.js             # Entry point — connects to MongoDB and starts Express
    ├── app.js                # Express app setup, routes, Swagger UI
    ├── mcp-server.js         # MCP server (SSE transport, 27 tools)
    ├── models/               # Mongoose schemas
    │   ├── user.model.js
    │   ├── board.model.js
    │   ├── status.model.js
    │   ├── task.model.js
    │   ├── subtask.model.js
    │   └── comment.model.js
    ├── controllers/          # Request handlers and business logic
    │   ├── auth.controller.js
    │   ├── users.controller.js
    │   ├── boards.controller.js
    │   ├── statuses.controller.js
    │   ├── tasks.controller.js
    │   ├── subtasks.controller.js
    │   └── comments.controller.js
    ├── routes/               # Express routers
    │   ├── auth.routes.js
    │   ├── users.routes.js
    │   ├── boards.routes.js
    │   ├── statuses.routes.js
    │   ├── tasks.routes.js
    │   ├── subtasks.routes.js
    │   └── comments.routes.js
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
    │   ├── subtask.schema.js
    │   └── comment.schema.js
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
| [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) | API proxy in the BFF server |
| [Tailwind CSS](https://tailwindcss.com/) (CDN) | UI styling |
| [Sortable.js](https://sortablejs.github.io/Sortable/) (CDN) | Drag-and-drop for tasks and columns |
