import { Router } from 'express';
import {
  dashboardController,
  classBookingsController,
  cancelClassController,
  cancelMyBookingController,
  createClassController,
  deleteClassController,
  getClassController,
  joinClassController,
  listClassesController,
  listTrainerClassesController,
  myBookingsController,
  updateClassController,
} from '../controllers/class.controller.js';

import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  bookingIdSchema,
  classIdSchema,
  createClassSchema,
  joinClassSchema,
  trainerClassSchema,
  updateClassSchema,
} from '../validators/class.schema.js';

const router = Router();

router.get('/dashboard', dashboardController);
router.get('/my/bookings', authenticate, authorize('member'), myBookingsController);
router.put(
  '/my/bookings/:bookingId/cancel',
  authenticate,
  authorize('member'),
  validate(bookingIdSchema),
  cancelMyBookingController
);
router.get(
  '/:id/bookings',
  authenticate,
  authorize('admin', 'trainer'),
  validate(classIdSchema),
  classBookingsController
);

router.get('/', optionalAuthenticate, listClassesController);
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
router.delete('/:id', authenticate, authorize('admin', 'trainer'), validate(classIdSchema), deleteClassController);

export default router;
