import mongoose from 'mongoose';
import Task from '../models/task.model.js';
import Status from '../models/status.model.js';
import Subtask from '../models/subtask.model.js';
import Comment from '../models/comment.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBoardOrFail } from '../utils/boardGuard.js';
import { AppError } from '../utils/AppError.js';

const formatTask = (t) => ({
  id: (t._id ?? t.id).toString(),
  boardId: t.boardId.toString(),
  statusId: t.statusId.toString(),
  title: t.title,
  description: t.description ?? null,
  priority: t.priority,
  assigneeId: t.assigneeId ? t.assigneeId.toString() : null,
  dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : null,
  subtaskCount: t.subtaskCount ?? 0,
  completedSubtaskCount: t.completedSubtaskCount ?? 0,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

export const createTask = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  const status = await Status.findOne({ _id: req.body.statusId, boardId: board._id });
  if (!status) throw new AppError(422, 'VALIDATION_ERROR', 'statusId does not belong to this board');
  const task = await Task.create({ ...req.body, boardId: board._id });
  res.status(201).json(formatTask({ ...task.toObject(), subtaskCount: 0, completedSubtaskCount: 0 }));
});

export const listTasks = asyncHandler(async (req, res) => {
  const board = await getBoardOrFail(req.params.boardId, req.user.id);
  const { statusId, assigneeId, priority, page = 1, pageSize = 50 } = req.query;
  const match = { boardId: board._id };
  if (statusId) match.statusId = new mongoose.Types.ObjectId(statusId);
  if (assigneeId) match.assigneeId = new mongoose.Types.ObjectId(assigneeId);
  if (priority) match.priority = priority;

  const skip = (Number(page) - 1) * Number(pageSize);
  const [tasks, total] = await Promise.all([
    Task.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(pageSize) },
      { $lookup: { from: 'subtasks', localField: '_id', foreignField: 'taskId', as: 'subtasks' } },
      {
        $addFields: {
          subtaskCount: { $size: '$subtasks' },
          completedSubtaskCount: {
            $size: { $filter: { input: '$subtasks', cond: { $eq: ['$$this.completed', true] } } },
          },
        },
      },
      { $project: { subtasks: 0 } },
    ]),
    Task.countDocuments(match),
  ]);
  res.json({ items: tasks.map(formatTask), total });
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  await getBoardOrFail(task.boardId, req.user.id);
  const [subtaskCount, completedSubtaskCount] = await Promise.all([
    Subtask.countDocuments({ taskId: task._id }),
    Subtask.countDocuments({ taskId: task._id, completed: true }),
  ]);
  res.json(formatTask({ ...task.toObject(), subtaskCount, completedSubtaskCount }));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  await getBoardOrFail(task.boardId, req.user.id);
  Object.assign(task, req.body);
  await task.save();
  const [subtaskCount, completedSubtaskCount] = await Promise.all([
    Subtask.countDocuments({ taskId: task._id }),
    Subtask.countDocuments({ taskId: task._id, completed: true }),
  ]);
  res.json(formatTask({ ...task.toObject(), subtaskCount, completedSubtaskCount }));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  await getBoardOrFail(task.boardId, req.user.id);
  await Subtask.deleteMany({ taskId: task._id });
  await Comment.deleteMany({ taskId: task._id });
  await task.deleteOne();
  res.status(204).send();
});

export const moveTaskStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  await getBoardOrFail(task.boardId, req.user.id);
  const status = await Status.findOne({ _id: req.body.statusId, boardId: task.boardId });
  if (!status) throw new AppError(422, 'VALIDATION_ERROR', 'statusId does not belong to this board');
  task.statusId = req.body.statusId;
  await task.save();
  const [subtaskCount, completedSubtaskCount] = await Promise.all([
    Subtask.countDocuments({ taskId: task._id }),
    Subtask.countDocuments({ taskId: task._id, completed: true }),
  ]);
  res.json(formatTask({ ...task.toObject(), subtaskCount, completedSubtaskCount }));
});
