import { Router } from 'express';
import { adminAutoBlogController } from '../controllers/admin-auto-blog.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/generate', (req, res) => adminAutoBlogController.generateBlog(req, res));

export default router;
