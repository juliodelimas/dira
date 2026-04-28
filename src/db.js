import crypto from 'crypto';
import mongoose from 'mongoose';
import Board from './models/board.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dira';

let connectionPromise;
let migrationPromise;

const migrateInviteCodes = async () => {
  const boards = await Board.find({ inviteCode: { $exists: false } });
  if (!boards.length) return;

  await Promise.all(
    boards.map((board) => {
      board.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      return board.save();
    })
  );

  console.log(`Assigned invite codes to ${boards.length} existing board(s)`);
};

export const connectDatabase = async () => {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGODB_URI)
      .then((connection) => {
        console.log('MongoDB connected');
        return connection;
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  const connection = await connectionPromise;

  if (!migrationPromise) {
    migrationPromise = migrateInviteCodes().catch((error) => {
      migrationPromise = undefined;
      throw error;
    });
  }
  await migrationPromise;

  return connection;
};
