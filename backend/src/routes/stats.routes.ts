import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { athleteStats } from '../controllers/stats.controller';

export const statsRouter = Router();

statsRouter.get('/athlete', authenticate, requireRole('athlete'), athleteStats);
