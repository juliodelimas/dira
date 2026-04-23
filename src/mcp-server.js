import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';

const API_BASE = process.env.DIRA_API_URL ?? 'http://localhost:3000';
const MCP_PORT = Number(process.env.MCP_PORT ?? 4000);

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const call = async (method, path, { token, body, params } = {}) => {
  const url = new URL(`${API_BASE}/v1${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
};

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({ name: 'dira', version: '0.1.0' });

// --- Auth ---

server.tool(
  'register',
  'Create a new Dira account and receive a JWT token.',
  {
    name: z.string().describe('Full name'),
    email: z.string().email(),
    password: z.string().min(8),
  },
  ({ name, email, password }) =>
    call('POST', '/auth/register', { body: { name, email, password } }),
);

server.tool(
  'login',
  'Login to Dira and receive a JWT token.',
  {
    email: z.string().email(),
    password: z.string(),
  },
  ({ email, password }) =>
    call('POST', '/auth/login', { body: { email, password } }),
);

// --- Users ---

server.tool(
  'get_current_user',
  'Get the authenticated user profile.',
  { token: z.string().describe('JWT token from login or register') },
  ({ token }) => call('GET', '/users/me', { token }),
);

// --- Boards ---

server.tool(
  'create_board',
  'Create a new project board.',
  {
    token: z.string().describe('JWT token'),
    name: z.string(),
    description: z.string().optional(),
  },
  ({ token, name, description }) =>
    call('POST', '/boards', { token, body: { name, description } }),
);

server.tool(
  'list_boards',
  'List all boards owned by the authenticated user.',
  {
    token: z.string().describe('JWT token'),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
  },
  ({ token, page, pageSize }) =>
    call('GET', '/boards', { token, params: { page, pageSize } }),
);

server.tool(
  'get_board',
  'Get details of a specific board.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
  },
  ({ token, boardId }) => call('GET', `/boards/${boardId}`, { token }),
);

server.tool(
  'update_board',
  'Update a board name or description.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
  },
  ({ token, boardId, name, description }) =>
    call('PUT', `/boards/${boardId}`, { token, body: { name, description } }),
);

server.tool(
  'delete_board',
  'Delete a board and all its statuses, tasks, and subtasks.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
  },
  ({ token, boardId }) => call('DELETE', `/boards/${boardId}`, { token }),
);

// --- Statuses ---

server.tool(
  'create_status',
  'Create a new status column on a board.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
    name: z.string(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Hex color, e.g. #3b82f6'),
  },
  ({ token, boardId, name, color }) =>
    call('POST', `/boards/${boardId}/statuses`, { token, body: { name, color } }),
);

server.tool(
  'list_statuses',
  'List all status columns for a board, ordered by position.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
  },
  ({ token, boardId }) => call('GET', `/boards/${boardId}/statuses`, { token }),
);

server.tool(
  'reorder_statuses',
  'Reorder status columns by providing the full ordered list of status IDs.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
    statusIds: z.array(z.string()).describe('All status IDs in the desired order'),
  },
  ({ token, boardId, statusIds }) =>
    call('PATCH', `/boards/${boardId}/statuses/reorder`, { token, body: { statusIds } }),
);

server.tool(
  'update_status',
  'Update a status column name or color.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
    statusId: z.string(),
    name: z.string().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  },
  ({ token, boardId, statusId, name, color }) =>
    call('PUT', `/boards/${boardId}/statuses/${statusId}`, { token, body: { name, color } }),
);

server.tool(
  'delete_status',
  'Delete a status column (only allowed if it has no tasks).',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
    statusId: z.string(),
  },
  ({ token, boardId, statusId }) =>
    call('DELETE', `/boards/${boardId}/statuses/${statusId}`, { token }),
);

// --- Tasks ---

server.tool(
  'create_task',
  'Create a new task on a board.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
    statusId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional().describe('ISO date string, e.g. 2025-12-31'),
  },
  ({ token, boardId, statusId, title, description, priority, assigneeId, dueDate }) =>
    call('POST', `/boards/${boardId}/tasks`, {
      token,
      body: { statusId, title, description, priority, assigneeId, dueDate },
    }),
);

server.tool(
  'list_tasks',
  'List tasks on a board with optional filters.',
  {
    token: z.string().describe('JWT token'),
    boardId: z.string(),
    statusId: z.string().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
  },
  ({ token, boardId, statusId, assigneeId, priority, page, pageSize }) =>
    call('GET', `/boards/${boardId}/tasks`, {
      token,
      params: { statusId, assigneeId, priority, page, pageSize },
    }),
);

server.tool(
  'get_task',
  'Get details of a specific task.',
  {
    token: z.string().describe('JWT token'),
    taskId: z.string(),
  },
  ({ token, taskId }) => call('GET', `/tasks/${taskId}`, { token }),
);

server.tool(
  'update_task',
  'Update task fields (title, description, priority, assignee, due date).',
  {
    token: z.string().describe('JWT token'),
    taskId: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional().describe('ISO date string, e.g. 2025-12-31'),
  },
  ({ token, taskId, title, description, priority, assigneeId, dueDate }) =>
    call('PUT', `/tasks/${taskId}`, {
      token,
      body: { title, description, priority, assigneeId, dueDate },
    }),
);

server.tool(
  'delete_task',
  'Delete a task and all its subtasks.',
  {
    token: z.string().describe('JWT token'),
    taskId: z.string(),
  },
  ({ token, taskId }) => call('DELETE', `/tasks/${taskId}`, { token }),
);

server.tool(
  'move_task_status',
  'Move a task to a different status column.',
  {
    token: z.string().describe('JWT token'),
    taskId: z.string(),
    statusId: z.string().describe('Target status ID'),
  },
  ({ token, taskId, statusId }) =>
    call('PATCH', `/tasks/${taskId}/status`, { token, body: { statusId } }),
);

// --- Subtasks ---

server.tool(
  'create_subtask',
  'Create a subtask under a task.',
  {
    token: z.string().describe('JWT token'),
    taskId: z.string(),
    title: z.string(),
  },
  ({ token, taskId, title }) =>
    call('POST', `/tasks/${taskId}/subtasks`, { token, body: { title } }),
);

server.tool(
  'list_subtasks',
  'List all subtasks for a task.',
  {
    token: z.string().describe('JWT token'),
    taskId: z.string(),
  },
  ({ token, taskId }) => call('GET', `/tasks/${taskId}/subtasks`, { token }),
);

server.tool(
  'update_subtask',
  'Update a subtask title or completion status.',
  {
    token: z.string().describe('JWT token'),
    taskId: z.string(),
    subtaskId: z.string(),
    title: z.string().optional(),
    completed: z.boolean().optional(),
  },
  ({ token, taskId, subtaskId, title, completed }) =>
    call('PUT', `/tasks/${taskId}/subtasks/${subtaskId}`, {
      token,
      body: { title, completed },
    }),
);

server.tool(
  'delete_subtask',
  'Delete a subtask.',
  {
    token: z.string().describe('JWT token'),
    taskId: z.string(),
    subtaskId: z.string(),
  },
  ({ token, taskId, subtaskId }) =>
    call('DELETE', `/tasks/${taskId}/subtasks/${subtaskId}`, { token }),
);

// ---------------------------------------------------------------------------
// SSE HTTP server
// ---------------------------------------------------------------------------

const app = express();
const transports = new Map();

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  transports.set(transport.sessionId, transport);
  res.on('close', () => transports.delete(transport.sessionId));
  await server.connect(transport);
});

app.post('/messages', express.json(), async (req, res) => {
  const { sessionId } = req.query;
  const transport = transports.get(sessionId);
  if (!transport) return res.status(404).json({ error: 'Session not found' });
  await transport.handlePostMessage(req, res, req.body);
});

app.listen(MCP_PORT, () => {
  console.log(`Dira MCP server running on http://0.0.0.0:${MCP_PORT}`);
  console.log(`  SSE endpoint : http://0.0.0.0:${MCP_PORT}/sse`);
  console.log(`  Targeting API: ${API_BASE}`);
});
