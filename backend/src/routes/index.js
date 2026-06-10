import { Router } from 'express';
import authRoutes from './auth.routes.js';
import classTypeRoutes from './classType.routes.js';
import classRoutes from './class.routes.js';
import adminRoutes from './admin.routes.js';
import trainerRoutes from './trainer.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/class-types', classTypeRoutes);
router.use('/classes', classRoutes);
router.use('/admin', adminRoutes);
router.use('/trainers', trainerRoutes);

export default router;