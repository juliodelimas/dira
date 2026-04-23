import { Schema, model } from 'mongoose';

const taskSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    statusId: { type: Schema.Types.ObjectId, ref: 'Status', required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default model('Task', taskSchema);
