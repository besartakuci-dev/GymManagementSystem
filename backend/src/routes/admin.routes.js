import { Router } from 'express';
import {
  dashboardController,
  classBookingsController,
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/dashboard', dashboardController);
router.get('/class-bookings', classBookingsController);

export default router;