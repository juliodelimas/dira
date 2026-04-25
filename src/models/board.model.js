import { Schema, model } from 'mongoose';
import crypto from 'crypto';

const boardSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      default: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
    },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default model('Board', boardSchema);
