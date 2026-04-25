import { z } from 'zod';
import { objectId } from './shared.js';

export const createBoardSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150),
    description: z.string().max(1000).optional(),
  }),
});

export const updateBoardSchema = z.object({
  params: z.object({ boardId: objectId }),
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    description: z.string().max(1000).optional(),
  }),
});

export const boardParamsSchema = z.object({
  params: z.object({ boardId: objectId }),
});

export const listBoardsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const joinBoardSchema = z.object({
  body: z.object({
    inviteCode: z.string().min(1),
  }),
});
