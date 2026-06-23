import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { listSports, createSport } from '../controllers/sports.controller';

export const sportsRouter = Router();

// Public: needed by registration & search dropdowns.
sportsRouter.get('/', listSports);

// Admin: add a new sport to the system.
sportsRouter.post('/', authenticate, requireRole('admin'), createSport);
