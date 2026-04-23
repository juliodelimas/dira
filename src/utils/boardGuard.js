import Board from '../models/board.model.js';
import { AppError } from './AppError.js';

export const getBoardOrFail = async (boardId, userId) => {
  let board;
  try {
    board = await Board.findById(boardId);
  } catch {
    throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  }
  if (!board) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  if (board.ownerId.toString() !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource');
  }
  return board;
};
