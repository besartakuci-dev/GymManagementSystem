import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import {
  getPublicTrainersController,
  getMyTrainerProfileController,
  updateMyTrainerProfileController,
  getMyTrainerClassesController,
  getTrainerClassBookingsController,
} from '../controllers/trainer.controller.js';

const router = Router();

router.get('/public', getPublicTrainersController);

router.get('/me/profile', authenticate, authorize('trainer'), getMyTrainerProfileController);
router.put('/me/profile', authenticate, authorize('trainer'), updateMyTrainerProfileController);

router.get('/me/classes', authenticate, authorize('trainer'), getMyTrainerClassesController);
router.get('/classes/:id/bookings', authenticate, authorize('trainer'), getTrainerClassBookingsController);

export default router;