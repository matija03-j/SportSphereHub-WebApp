import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  myReservations,
  resourceAvailability,
  createReservation,
  cancelReservation,
} from '../controllers/reservations.controller';

export const reservationsRouter = Router();

// Availability is needed to render calendars (any logged-in user).
reservationsRouter.get('/availability', authenticate, resourceAvailability);
reservationsRouter.get('/mine', authenticate, requireRole('athlete'), myReservations);
reservationsRouter.post('/', authenticate, requireRole('athlete'), createReservation);
reservationsRouter.patch('/:id/cancel', authenticate, requireRole('athlete'), cancelReservation);
