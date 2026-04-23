import { z } from 'zod';
import { objectId } from './shared.js';

export const createSubtaskSchema = z.object({
  params: z.object({ taskId: objectId }),
  body: z.object({
    title: z.string().min(1).max(255),
  }),
});

export const listSubtasksSchema = z.object({
  params: z.object({ taskId: objectId }),
});

export const updateSubtaskSchema = z.object({
  params: z.object({ taskId: objectId, subtaskId: objectId }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    completed: z.boolean().optional(),
  }),
});

export const subtaskParamsSchema = z.object({
  params: z.object({ taskId: objectId, subtaskId: objectId }),
});
