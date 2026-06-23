import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectDb } from './config/db';
import { UPLOAD_DIR } from './middleware/upload';
import { notFound, errorHandler } from './middleware/error';
import { apiRouter } from './routes';

async function start() {
  await connectDb();

  const app = express();
  app.use(cors({ origin: env.clientUrl }));
  app.use(express.json());

  // Static serving of uploaded files (profile pictures, galleries).
  app.use('/uploads', express.static(UPLOAD_DIR));

  app.get('/', (_req, res) => res.json({ name: 'SportSphere Hub API', status: 'ok' }));
  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(env.port, () => console.log(`SportSphere Hub API running on port ${env.port}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
