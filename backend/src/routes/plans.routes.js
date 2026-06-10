import { Router } from 'express';
import {
  createPlanController,
  deletePlanController,
  getPlanController,
  listPlansController,
  updatePlanController,
} from '../controllers/plan.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createPlanSchema,
  listPlansSchema,
  planIdSchema,
  updatePlanSchema,
} from '../validators/plans.schema.js';

const router = Router();

// Public reads — no auth required. optionalAuthenticate only *enriches* the request
// (an admin token unlocks inactive plans); anonymous callers still get active plans.
router.get('/', optionalAuthenticate, validate(listPlansSchema), listPlansController);
router.get('/:id', optionalAuthenticate, validate(planIdSchema), getPlanController);

// Admin-only writes — authenticate (401 if missing) THEN authorize('admin') (403 if not admin).
router.post('/', authenticate, authorize('admin'), validate(createPlanSchema), createPlanController);
router.patch('/:id', authenticate, authorize('admin'), validate(updatePlanSchema), updatePlanController);
router.delete('/:id', authenticate, authorize('admin'), validate(planIdSchema), deletePlanController);

export default router;
