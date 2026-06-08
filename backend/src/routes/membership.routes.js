import { Router } from 'express';
import {
  listPlansController,
  myMembershipController,
  purchaseMembershipController,
} from '../controllers/membership.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { purchaseMembershipSchema } from '../validators/membership.schema.js';

const router = Router();

router.get('/plans', listPlansController);
router.get('/me', authenticate, myMembershipController);
router.post('/', authenticate, authorize('member'), validate(purchaseMembershipSchema), purchaseMembershipController);

export default router;
