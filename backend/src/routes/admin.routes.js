import { Router } from 'express';
import {
  dashboardController,
  classBookingsController,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/dashboard', authenticate, authorize('admin'), dashboardController);
router.get('/class-bookings', authenticate, authorize('admin'), classBookingsController);

export default router;
