import { Router } from 'express';
import {
  createBoard,
  listBoards,
  getBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/boards.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  createBoardSchema,
  updateBoardSchema,
  boardParamsSchema,
  listBoardsSchema,
} from '../schemas/board.schema.js';

const router = Router();

router.use(authenticate);

router.post('/boards', validate(createBoardSchema), createBoard);
router.get('/boards', validate(listBoardsSchema), listBoards);
router.get('/boards/:boardId', validate(boardParamsSchema), getBoard);
router.put('/boards/:boardId', validate(updateBoardSchema), updateBoard);
router.delete('/boards/:boardId', validate(boardParamsSchema), deleteBoard);

export default router;
