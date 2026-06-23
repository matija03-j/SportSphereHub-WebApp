import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listEquipment,
  myOrders,
  createOrder,
  cancelOrder,
} from '../controllers/shop.controller';

export const shopRouter = Router();

shopRouter.get('/equipment', listEquipment);
shopRouter.get('/orders/mine', authenticate, requireRole('athlete'), myOrders);
shopRouter.post('/orders', authenticate, requireRole('athlete'), createOrder);
shopRouter.patch('/orders/:id/cancel', authenticate, requireRole('athlete'), cancelOrder);
