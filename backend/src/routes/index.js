import { Router } from 'express';
import authRoutes from './auth.routes.js';
import classTypeRoutes from './classType.routes.js';
import classRoutes from './class.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/class-types', classTypeRoutes);
router.use('/classes', classRoutes);

export default router;