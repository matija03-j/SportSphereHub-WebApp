import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listAds,
  myAds,
  createAd,
  joinAd,
  decideRequest,
  closeAd,
} from '../controllers/teammates.controller';

export const teammatesRouter = Router();

teammatesRouter.use(authenticate, requireRole('athlete'));
teammatesRouter.get('/', listAds);
teammatesRouter.get('/mine', myAds);
teammatesRouter.post('/', createAd);
teammatesRouter.post('/:id/join', joinAd);
teammatesRouter.patch('/:id/requests/:reqId', decideRequest);
teammatesRouter.patch('/:id/close', closeAd);
