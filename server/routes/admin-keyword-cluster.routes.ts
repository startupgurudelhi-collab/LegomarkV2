import { Router } from 'express';
import { adminKeywordClusterController } from '../controllers/admin-keyword-cluster.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Require admin authentication for AI keyword cluster tool
router.use(requireAuth);

router.post('/generate', (req, res) => adminKeywordClusterController.generate(req, res));

export default router;
