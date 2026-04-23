import { Router } from 'express';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  moveTaskStatus,
} from '../controllers/tasks.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  createTaskSchema,
  listTasksSchema,
  taskParamsSchema,
  updateTaskSchema,
  moveTaskStatusSchema,
} from '../schemas/task.schema.js';

const router = Router();

router.use(authenticate);

router.post('/boards/:boardId/tasks', validate(createTaskSchema), createTask);
router.get('/boards/:boardId/tasks', validate(listTasksSchema), listTasks);
router.get('/tasks/:taskId', validate(taskParamsSchema), getTask);
router.put('/tasks/:taskId', validate(updateTaskSchema), updateTask);
router.delete('/tasks/:taskId', validate(taskParamsSchema), deleteTask);
router.patch('/tasks/:taskId/status', validate(moveTaskStatusSchema), moveTaskStatus);

export default router;
