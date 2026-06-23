import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listUsers,
  updateUser,
  deleteUser,
  pendingRequests,
  decideRequest,
  pendingFacilities,
  decideFacility,
  listTrainers,
  setTrainerActive,
} from '../controllers/admin.controller';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/users', listUsers);
adminRouter.patch('/users/:id', updateUser);
adminRouter.delete('/users/:id', deleteUser);

adminRouter.get('/requests', pendingRequests);
adminRouter.patch('/requests/:id', decideRequest);

adminRouter.get('/facilities/pending', pendingFacilities);
adminRouter.patch('/facilities/:id', decideFacility);

adminRouter.get('/trainers', listTrainers);
adminRouter.patch('/trainers/:id', setTrainerActive);
