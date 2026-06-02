import { Router } from 'express';
import {
  createClassTypeController,
  deleteClassTypeController,
  getClassTypeController,
  listClassTypesController,
  updateClassTypeController,
} from '../controllers/classType.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  classTypeIdSchema,
  createClassTypeSchema,
  updateClassTypeSchema,
} from '../validators/classType.schema.js';

const router = Router();

router.get('/', listClassTypesController);
router.get('/:id', validate(classTypeIdSchema), getClassTypeController);
router.post('/', authenticate, authorize('admin'), validate(createClassTypeSchema), createClassTypeController);
router.put('/:id', authenticate, authorize('admin'), validate(updateClassTypeSchema), updateClassTypeController);
router.delete('/:id', authenticate, authorize('admin'), validate(classTypeIdSchema), deleteClassTypeController);

export default router;
