import { Router } from 'express';
import {
  dashboardController,
  classBookingsController,
  cancelClassController,
  createClassController,
  getClassController,
  listClassesController,
  updateClassController,
} from '../controllers/class.controller.js';

import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { classIdSchema, createClassSchema, updateClassSchema } from '../validators/class.schema.js';

const router = Router();

router.get('/dashboard', dashboardController);
router.get('/:id/bookings', classBookingsController);

router.get('/', listClassesController);
router.get('/:id', validate(classIdSchema), getClassController);
router.post('/', authenticate, authorize('admin', 'trainer'), validate(createClassSchema), createClassController);
router.put('/:id', authenticate, authorize('admin', 'trainer'), validate(updateClassSchema), updateClassController);
router.delete('/:id', authenticate, authorize('admin', 'trainer'), validate(classIdSchema), cancelClassController);

export default router;