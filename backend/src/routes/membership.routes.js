import { Router } from 'express';
import {
  cancelMembershipController,
  myMembershipController,
  purchaseMembershipController,
} from '../controllers/membership.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { membershipIdSchema, purchaseMembershipSchema } from '../validators/membership.schema.js';

const router = Router();

router.get('/me', authenticate, myMembershipController);
router.post(
  '/',
  authenticate,
  authorize('member', 'admin'),
  validate(purchaseMembershipSchema),
  purchaseMembershipController
);
router.put(
  '/:id/cancel',
  authenticate,
  authorize('member', 'admin'),
  validate(membershipIdSchema),
  cancelMembershipController
);

export default router;
