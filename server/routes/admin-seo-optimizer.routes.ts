import { Router } from 'express';
import { adminSeoOptimizerController } from '../controllers/admin-seo-optimizer.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Require admin authentication for AI SEO Optimizer
router.use(requireAuth);

router.post('/analyze', (req, res) => adminSeoOptimizerController.analyze(req, res));

export default router;
