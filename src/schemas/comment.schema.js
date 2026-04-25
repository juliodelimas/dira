import { z } from 'zod';
import { objectId } from './shared.js';

export const createCommentSchema = z.object({
  params: z.object({ taskId: objectId }),
  body: z.object({
    text: z.string().min(1).max(5000),
  }),
});

export const listCommentsSchema = z.object({
  params: z.object({ taskId: objectId }),
});

export const commentParamsSchema = z.object({
  params: z.object({ taskId: objectId, commentId: objectId }),
});
