import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { createReview, reviewableFacilities } from '../controllers/reviews.controller';

export const reviewsRouter = Router();

reviewsRouter.use(authenticate, requireRole('athlete'));
reviewsRouter.get('/reviewable', reviewableFacilities);
reviewsRouter.post('/', createReview);
