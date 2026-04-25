import Board from '../models/board.model.js';
import { AppError } from './AppError.js';

export const getBoardOrFail = async (boardId, userId, { ownerOnly = false } = {}) => {
  let board;
  try {
    board = await Board.findById(boardId);
  } catch {
    throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  }
  if (!board) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');

  const isOwner = board.ownerId.toString() === userId;
  const isMember = board.members.some((m) => m.toString() === userId);

  if (ownerOnly && !isOwner) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource');
  }
  if (!ownerOnly && !isOwner && !isMember) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource');
  }
  return board;
};
