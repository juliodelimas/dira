import Comment from '../models/comment.model.js';
import Task from '../models/task.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getBoardOrFail } from '../utils/boardGuard.js';
import { AppError } from '../utils/AppError.js';

const formatComment = (c) => ({
  id: c._id.toString(),
  taskId: c.taskId.toString(),
  authorId: c.authorId._id ? c.authorId._id.toString() : c.authorId.toString(),
  authorName: c.authorId.name ?? null,
  text: c.text,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const getTaskOrFail = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  await getBoardOrFail(task.boardId, userId);
  return task;
};

export const createComment = asyncHandler(async (req, res) => {
  const task = await getTaskOrFail(req.params.taskId, req.user.id);
  const comment = await Comment.create({ ...req.body, taskId: task._id, authorId: req.user.id });
  await comment.populate('authorId', 'name');
  res.status(201).json(formatComment(comment));
});

export const listComments = asyncHandler(async (req, res) => {
  const task = await getTaskOrFail(req.params.taskId, req.user.id);
  const items = await Comment.find({ taskId: task._id })
    .populate('authorId', 'name')
    .sort({ createdAt: 1 });
  res.json({ items: items.map(formatComment) });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const task = await getTaskOrFail(req.params.taskId, req.user.id);
  const comment = await Comment.findOne({ _id: req.params.commentId, taskId: task._id });
  if (!comment) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  if (comment.authorId.toString() !== req.user.id) {
    throw new AppError(403, 'FORBIDDEN', 'You can only delete your own comments');
  }
  await comment.deleteOne();
  res.status(204).send();
});
