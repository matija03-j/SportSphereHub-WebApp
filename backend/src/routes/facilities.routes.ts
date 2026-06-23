import { Router } from 'express';
import {
  homeInfo,
  activeCities,
  searchFacilities,
  facilityDetails,
} from '../controllers/facilities.controller';

export const facilitiesRouter = Router();

// Public endpoints.
facilitiesRouter.get('/home-info', homeInfo);
facilitiesRouter.get('/cities', activeCities);
facilitiesRouter.get('/search', searchFacilities);
facilitiesRouter.get('/:id', facilityDetails);
