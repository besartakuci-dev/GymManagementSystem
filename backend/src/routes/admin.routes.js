import { Router } from 'express';
import {
  dashboardController,
  classBookingsController,
  getUsersController,
  createUserController,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', authenticate, authorize('admin'), dashboardController);
router.get('/class-bookings', authenticate, authorize('admin'), classBookingsController);
router.get('/users', getUsersController);
router.post('/users', createUserController);

export default router;
