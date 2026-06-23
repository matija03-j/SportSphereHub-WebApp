import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/sportsphere_hub',
  jwtSecret: process.env.JWT_SECRET || 'sportsphere_dev_secret_change_me',
  jwtExpires: process.env.JWT_EXPIRES || '2h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',
  resetUrlBase: process.env.RESET_URL_BASE || 'http://localhost:4200/reset-password',
};
