import { Router } from 'express';
import {
  createSubtask,
  listSubtasks,
  updateSubtask,
  deleteSubtask,
} from '../controllers/subtasks.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  createSubtaskSchema,
  listSubtasksSchema,
  updateSubtaskSchema,
  subtaskParamsSchema,
} from '../schemas/subtask.schema.js';

const router = Router();

router.use(authenticate);

router.post('/tasks/:taskId/subtasks', validate(createSubtaskSchema), createSubtask);
router.get('/tasks/:taskId/subtasks', validate(listSubtasksSchema), listSubtasks);
router.put('/tasks/:taskId/subtasks/:subtaskId', validate(updateSubtaskSchema), updateSubtask);
router.delete('/tasks/:taskId/subtasks/:subtaskId', validate(subtaskParamsSchema), deleteSubtask);

export default router;
