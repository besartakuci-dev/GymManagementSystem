import { Router } from 'express';
import { dashboardController } from '../controllers/class.controller.js';

const router = Router();

router.get('/dashboard', dashboardController);

export default router;