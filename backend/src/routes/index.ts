import { Router } from 'express';
import { authRouter } from './auth.routes';
import { sportsRouter } from './sports.routes';
import { facilitiesRouter } from './facilities.routes';
import { usersRouter } from './users.routes';
import { reservationsRouter } from './reservations.routes';
import { teammatesRouter } from './teammates.routes';
import { trainingsRouter } from './trainings.routes';
import { shopRouter } from './shop.routes';
import { reviewsRouter } from './reviews.routes';
import { statsRouter } from './stats.routes';
import { employeeRouter } from './employee.routes';
import { adminRouter } from './admin.routes';

/**
 * Aggregates all domain routers under /api.
 */
export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/sports', sportsRouter);
apiRouter.use('/facilities', facilitiesRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/reservations', reservationsRouter);
apiRouter.use('/teammates', teammatesRouter);
apiRouter.use('/trainings', trainingsRouter);
apiRouter.use('/shop', shopRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/employee', employeeRouter);
apiRouter.use('/admin', adminRouter);
