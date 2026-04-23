import { z } from 'zod';
import { objectId } from './shared.js';

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color');

export const createStatusSchema = z.object({
  params: z.object({ boardId: objectId }),
  body: z.object({
    name: z.string().min(1).max(100),
    color: hexColor.optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ boardId: objectId, statusId: objectId }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    color: hexColor.optional(),
  }),
});

export const statusParamsSchema = z.object({
  params: z.object({ boardId: objectId, statusId: objectId }),
});

export const reorderStatusesSchema = z.object({
  params: z.object({ boardId: objectId }),
  body: z.object({
    orderedIds: z.array(objectId).min(1),
  }),
});

export const listStatusesSchema = z.object({
  params: z.object({ boardId: objectId }),
});
