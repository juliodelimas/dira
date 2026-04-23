import { Router } from 'express';
import {
  createStatus,
  listStatuses,
  updateStatus,
  deleteStatus,
  reorderStatuses,
} from '../controllers/statuses.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  createStatusSchema,
  updateStatusSchema,
  statusParamsSchema,
  reorderStatusesSchema,
  listStatusesSchema,
} from '../schemas/status.schema.js';

const router = Router();

router.use(authenticate);

router.post('/boards/:boardId/statuses', validate(createStatusSchema), createStatus);
router.get('/boards/:boardId/statuses', validate(listStatusesSchema), listStatuses);
router.patch('/boards/:boardId/statuses/reorder', validate(reorderStatusesSchema), reorderStatuses);
router.put('/boards/:boardId/statuses/:statusId', validate(updateStatusSchema), updateStatus);
router.delete('/boards/:boardId/statuses/:statusId', validate(statusParamsSchema), deleteStatus);

export default router;
