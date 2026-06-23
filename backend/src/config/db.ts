import mongoose from 'mongoose';
import { env } from './env';

/**
 * Connects to MongoDB.
 *
 * IMPORTANT (spec requirement): the application must NOT create collections.
 * The database is created and populated independently by `npm run seed`.
 * We disable Mongoose's automatic collection/index creation globally so the
 * running app only reads/writes EXISTING collections.
 */
export async function connectDb(): Promise<void> {
  mongoose.set('autoCreate', false);
  mongoose.set('autoIndex', false);
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${env.mongoUri}`);
}
