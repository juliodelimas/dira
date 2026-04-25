import Board from '../models/board.model.js';
import Status from '../models/status.model.js';
import Task from '../models/task.model.js';
import Subtask from '../models/subtask.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBoardOrFail } from '../utils/boardGuard.js';
import { AppError } from '../utils/AppError.js';


const formatBoard = (board, userId) => ({
  id: board._id.toString(),
  name: board.name,
  description: board.description ?? null,
  ownerId: board.ownerId.toString(),
  inviteCode: board.inviteCode,
  isOwner: userId ? board.ownerId.toString() === userId : undefined,
  createdAt: board.createdAt,
  updatedAt: board.updatedAt,
});

export const createBoard = asyncHandler(async (req, res) => {
  const board = await Board.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json(formatBoard(board, req.user.id));
});

export const listBoards = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const query = { $or: [{ ownerId: req.user.id }, { members: req.user.id }] };
  const [items, total] = await Promise.all([
    Board.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)),
    Board.countDocuments(query),
  ]);
  res.json({ items: items.map((b) => formatBoard(b, req.user.id)), total });
});

export const getBoard = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  res.json(formatBoard(board, req.user.id));
});

export const updateBoard = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  Object.assign(board, req.body);
  await board.save();
  res.json(formatBoard(board, req.user.id));
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id, { ownerOnly: true });
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

export const joinBoard = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  const board = await Board.findOne({ inviteCode });
  if (!board) throw new AppError(404, 'NOT_FOUND', 'Invalid invite code');

  const userId = req.user.id;
  const isOwner = board.ownerId.toString() === userId;
  const isMember = board.members.some((m) => m.toString() === userId);

  if (!isOwner && !isMember) {
    board.members.push(userId);
    await board.save();
  }

  res.json(formatBoard(board, userId));
});
