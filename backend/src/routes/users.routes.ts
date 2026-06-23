import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadImage } from '../middleware/upload';
import { me, updateMe } from '../controllers/users.controller';

export const usersRouter = Router();

usersRouter.use(authenticate);
usersRouter.get('/me', me);
usersRouter.patch('/me', uploadImage.single('profileImage'), updateMe);
