import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import app from './app.js';
import Board from './models/board.model.js';

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dira';

const migrateInviteCodes = async () => {
  const boards = await Board.find({ inviteCode: { $exists: false } });
  if (!boards.length) return;
  await Promise.all(
    boards.map((b) => {
      b.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      return b.save();
    })
  );
  console.log(`Assigned invite codes to ${boards.length} existing board(s)`);
};

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await migrateInviteCodes();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
