import { Router } from 'express';
import authRoutes from './auth.routes.js';
import classTypeRoutes from './classType.routes.js';
import classRoutes from './class.routes.js';
import adminRoutes from './admin.routes.js';
<<<<<<< HEAD
import trainerRoutes from './trainer.routes.js';
=======
import plansRoutes from './plans.routes.js';
import membershipRoutes from './membership.routes.js';
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb

const router = Router();

router.use('/auth', authRoutes);
router.use('/class-types', classTypeRoutes);
router.use('/classes', classRoutes);
router.use('/admin', adminRoutes);
<<<<<<< HEAD
router.use('/trainers', trainerRoutes);
=======
router.use('/plans', plansRoutes);
router.use('/memberships', membershipRoutes);
>>>>>>> c2414002c786a360498184c8b29ca26b330d6afb

export default router;