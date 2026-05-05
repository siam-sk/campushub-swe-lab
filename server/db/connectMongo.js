/* global process */
import mongoose from 'mongoose';

let connectPromise = null;

export const connectMongo = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    return { connected: false, skipped: true, reason: 'MONGODB_URI is missing' };
  }

  if (mongoose.connection.readyState === 1) {
    return { connected: true, reused: true };
  }

  try {
    if (!connectPromise) {
      connectPromise = mongoose.connect(mongoUri, {
        dbName: process.env.MONGODB_DB_NAME || undefined,
      });
    }

    await connectPromise;

    return { connected: true };
  } catch (error) {
    connectPromise = null;
    return {
      connected: false,
      skipped: false,
      reason: error?.message || 'Unknown MongoDB connection error',
    };
  }
};
