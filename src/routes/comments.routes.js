import { Router } from 'express';
import { createComment, listComments, deleteComment } from '../controllers/comments.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  createCommentSchema,
  listCommentsSchema,
  commentParamsSchema,
} from '../schemas/comment.schema.js';

const router = Router();

router.use(authenticate);

router.post('/tasks/:taskId/comments', validate(createCommentSchema), createComment);
router.get('/tasks/:taskId/comments', validate(listCommentsSchema), listComments);
router.delete('/tasks/:taskId/comments/:commentId', validate(commentParamsSchema), deleteComment);

export default router;
