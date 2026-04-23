import { z } from 'zod';
import { objectId } from './shared.js';

const priority = z.enum(['low', 'medium', 'high', 'critical']);

export const createTaskSchema = z.object({
  params: z.object({ boardId: objectId }),
  body: z.object({
    title: z.string().min(1).max(255),
    statusId: objectId,
    description: z.string().max(10000).optional(),
    priority: priority.optional(),
    assigneeId: objectId.nullable().optional(),
    dueDate: z.string().date().nullable().optional(),
  }),
});

export const listTasksSchema = z.object({
  params: z.object({ boardId: objectId }),
  query: z.object({
    statusId: objectId.optional(),
    assigneeId: objectId.optional(),
    priority: priority.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const taskParamsSchema = z.object({
  params: z.object({ taskId: objectId }),
});

export const updateTaskSchema = z.object({
  params: z.object({ taskId: objectId }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(10000).optional(),
    priority: priority.optional(),
    assigneeId: objectId.nullable().optional(),
    dueDate: z.string().date().nullable().optional(),
  }),
});

export const moveTaskStatusSchema = z.object({
  params: z.object({ taskId: objectId }),
  body: z.object({ statusId: objectId }),
});
