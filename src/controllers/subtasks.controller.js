import Subtask from '../models/subtask.model.js';
import Task from '../models/task.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBoardOrFail } from '../utils/boardGuard.js';
import { AppError } from '../utils/AppError.js';

const formatSubtask = (s) => ({
  id: s._id.toString(),
  taskId: s.taskId.toString(),
  title: s.title,
  completed: s.completed,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

const getTaskOrFail = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  await getBoardOrFail(task.boardId, userId);
  return task;
};

export const createSubtask = asyncHandler(async (req, res) => {
  const task = await getTaskOrFail(req.params.taskId, req.user.id);
  const subtask = await Subtask.create({ ...req.body, taskId: task._id });
  res.status(201).json(formatSubtask(subtask));
});

export const listSubtasks = asyncHandler(async (req, res) => {
  const task = await getTaskOrFail(req.params.taskId, req.user.id);
  const items = await Subtask.find({ taskId: task._id }).sort({ createdAt: 1 });
  res.json({ items: items.map(formatSubtask) });
});

export const updateSubtask = asyncHandler(async (req, res) => {
  const task = await getTaskOrFail(req.params.taskId, req.user.id);
  const subtask = await Subtask.findOne({ _id: req.params.subtaskId, taskId: task._id });
  if (!subtask) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  Object.assign(subtask, req.body);
  await subtask.save();
  res.json(formatSubtask(subtask));
});

export const deleteSubtask = asyncHandler(async (req, res) => {
  const task = await getTaskOrFail(req.params.taskId, req.user.id);
  const subtask = await Subtask.findOne({ _id: req.params.subtaskId, taskId: task._id });
  if (!subtask) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  await subtask.deleteOne();
  res.status(204).send();
});
