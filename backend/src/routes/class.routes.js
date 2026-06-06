import { Router } from 'express';
import {
  dashboardController,
  classBookingsController,
  cancelClassController,
  createClassController,
  getClassController,
  joinClassController,
  listClassesController,
  listTrainerClassesController,
  updateClassController,
} from '../controllers/class.controller.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  classIdSchema,
  createClassSchema,
  joinClassSchema,
  trainerClassSchema,
  updateClassSchema,
} from '../validators/class.schema.js';

const router = Router();

router.get('/dashboard', dashboardController);
router.get('/:id/bookings', classBookingsController);

router.get('/', listClassesController);
router.get(
  '/trainer/:trainerId',
  authenticate,
  authorize('admin', 'trainer'),
  validate(trainerClassSchema),
  listTrainerClassesController
);
router.get('/:id', validate(classIdSchema), getClassController);
router.post('/:id/join', authenticate, authorize('member'), validate(joinClassSchema), joinClassController);
router.post('/', authenticate, authorize('admin', 'trainer'), validate(createClassSchema), createClassController);
router.put('/:id', authenticate, authorize('admin', 'trainer'), validate(updateClassSchema), updateClassController);
router.put('/:id/cancel', authenticate, authorize('admin', 'trainer'), validate(classIdSchema), cancelClassController);
router.delete('/:id', authenticate, authorize('admin', 'trainer'), validate(classIdSchema), cancelClassController);

export default router;
