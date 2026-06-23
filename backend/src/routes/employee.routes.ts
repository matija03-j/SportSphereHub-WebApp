import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { uploadImage, uploadJson } from '../middleware/upload';
import {
  myFacilities,
  createFacility,
  createFacilityFromJson,
  updateFacility,
  addResource,
  facilityReservations,
  confirmReservation,
  noShowReservation,
  moveReservation,
  listPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  listFacilityEquipment,
  createEquipment,
  updateEquipment,
  facilityOrders,
  updateOrderStatus,
} from '../controllers/employee.controller';
import { occupancyReport, equipmentReport } from '../controllers/reports.controller';

export const employeeRouter = Router();
employeeRouter.use(authenticate, requireRole('employee'));

// Facilities
employeeRouter.get('/facilities', myFacilities);
employeeRouter.post('/facilities', createFacility);
employeeRouter.post('/facilities/json', uploadJson.single('file'), createFacilityFromJson);
employeeRouter.patch('/facilities/:id', updateFacility);
employeeRouter.post('/facilities/:id/resources', addResource);

// Reservations & trainings
employeeRouter.get('/reservations', facilityReservations);
employeeRouter.patch('/reservations/:id/confirm', confirmReservation);
employeeRouter.patch('/reservations/:id/no-show', noShowReservation);
employeeRouter.patch('/reservations/:id/move', moveReservation);

// Promotions
employeeRouter.get('/promotions', listPromotions);
employeeRouter.post('/promotions', createPromotion);
employeeRouter.patch('/promotions/:id', updatePromotion);
employeeRouter.delete('/promotions/:id', deletePromotion);

// Equipment & orders
employeeRouter.get('/equipment', listFacilityEquipment);
employeeRouter.post('/equipment', uploadImage.single('image'), createEquipment);
employeeRouter.patch('/equipment/:id', uploadImage.single('image'), updateEquipment);
employeeRouter.get('/orders', facilityOrders);
employeeRouter.patch('/orders/:id/status', updateOrderStatus);

// PDF reports
employeeRouter.get('/reports/occupancy', occupancyReport);
employeeRouter.get('/reports/equipment', equipmentReport);
