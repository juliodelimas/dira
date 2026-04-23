import { Schema, model } from 'mongoose';

const boardSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default model('Board', boardSchema);
