import { Router } from 'express';
import {
  dashboardController,
  classBookingsController
} from '../controllers/class.controller.js';

const router = Router();

router.get('/dashboard', dashboardController);
router.get('/:id/bookings', classBookingsController);

export default router;