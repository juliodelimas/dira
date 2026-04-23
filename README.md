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
