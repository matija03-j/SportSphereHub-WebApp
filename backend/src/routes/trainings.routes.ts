import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { listTrainers, myTrainings, bookTraining } from '../controllers/trainings.controller';

export const trainingsRouter = Router();

trainingsRouter.get('/trainers', authenticate, listTrainers);
trainingsRouter.get('/mine', authenticate, requireRole('athlete'), myTrainings);
trainingsRouter.post('/', authenticate, requireRole('athlete'), bookTraining);
