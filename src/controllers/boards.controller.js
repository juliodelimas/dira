import Board from '../models/board.model.js';
import Status from '../models/status.model.js';
import Task from '../models/task.model.js';
import Subtask from '../models/subtask.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBoardOrFail } from '../utils/boardGuard.js';

const formatBoard = (board) => ({
  id: board._id.toString(),
  name: board.name,
  description: board.description ?? null,
  ownerId: board.ownerId.toString(),
  createdAt: board.createdAt,
  updatedAt: board.updatedAt,
});

export const createBoard = asyncHandler(async (req, res) => {
  const board = await Board.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(formatBoard(board));
});

export const listBoards = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const [items, total] = await Promise.all([
    Board.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize)),
    Board.countDocuments({ ownerId: req.user.id }),
  ]);
  res.json({ items: items.map(formatBoard), total });
});

export const getBoard = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  res.json(formatBoard(board));
});

export const updateBoard = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  Object.assign(board, req.body);
  await board.save();
  res.json(formatBoard(board));
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  const tasks = await Task.find({ boardId: board._id }, '_id');
  const taskIds = tasks.map((t) => t._id);
  await Promise.all([
    Subtask.deleteMany({ taskId: { $in: taskIds } }),
    Task.deleteMany({ boardId: board._id }),
    Status.deleteMany({ boardId: board._id }),
  ]);
  await board.deleteOne();
  res.status(204).send();
});
