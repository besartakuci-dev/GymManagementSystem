import { Router } from 'express';
import { listPlansController } from '../controllers/membership.controller.js';

const router = Router();

// Public listing — mirrors the no-auth GET pattern used by /classes and /class-types.
router.get('/', listPlansController);

export default router;
