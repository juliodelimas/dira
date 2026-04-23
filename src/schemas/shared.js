import { z } from 'zod';
import { Types } from 'mongoose';

export const objectId = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), { message: 'Invalid ID format' });
