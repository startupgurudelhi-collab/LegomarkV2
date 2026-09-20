import { Router } from 'express';
import { adminBlogSeriesController } from '../controllers/admin-blog-series.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Require admin authentication for AI Blog Series Generator
router.use(requireAuth);

router.post('/generate', (req, res) => adminBlogSeriesController.generate(req, res));

export default router;
