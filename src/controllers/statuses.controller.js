import mongoose from 'mongoose';
import Status from '../models/status.model.js';
import Task from '../models/task.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBoardOrFail } from '../utils/boardGuard.js';
import { AppError } from '../utils/AppError.js';

const formatStatus = (s) => ({
  id: s._id.toString(),
  boardId: s.boardId.toString(),
  name: s.name,
  color: s.color,
  position: s.position,
});

export const createStatus = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  const last = await Status.findOne({ boardId: board._id }).sort({ position: -1 });
  const position = last ? last.position + 1 : 0;
  const status = await Status.create({ ...req.body, boardId: board._id, position });
  res.status(201).json(formatStatus(status));
});

export const listStatuses = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  const items = await Status.find({ boardId: board._id }).sort('position');
  res.json({ items: items.map(formatStatus) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  const status = await Status.findOne({ _id: req.params.statusId, boardId: board._id });
  if (!status) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  Object.assign(status, req.body);
  await status.save();
  res.json(formatStatus(status));
});

export const deleteStatus = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  const status = await Status.findOne({ _id: req.params.statusId, boardId: board._id });
  if (!status) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  const taskCount = await Task.countDocuments({ statusId: status._id });
  if (taskCount > 0) {
    throw new AppError(409, 'CONFLICT', 'Cannot delete a status that still contains tasks');
  }
  await status.deleteOne();
  res.status(204).send();
});

export const reorderStatuses = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  const { orderedIds } = req.body;
  const ids = orderedIds.map((id) => new mongoose.Types.ObjectId(id));
  const found = await Status.find({ boardId: board._id, _id: { $in: ids } });
  if (found.length !== orderedIds.length) {
    throw new AppError(422, 'VALIDATION_ERROR', 'One or more status IDs do not belong to this board');
  }
  await Promise.all(orderedIds.map((id, index) => Status.findByIdAndUpdate(id, { position: index })));
  const updated = await Status.find({ boardId: board._id }).sort('position');
  res.json({ items: updated.map(formatStatus) });
});
