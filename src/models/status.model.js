import { Schema, model } from 'mongoose';

const statusSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    name: { type: String, required: true },
    color: { type: String, default: '#6B7280' },
    position: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export default model('Status', statusSchema);
