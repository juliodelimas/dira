import User from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'The requested resource does not exist');
  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
});
