import { Router } from 'express';
import { adminContentRefreshController } from '../controllers/admin-content-refresh.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect with requireAuth
router.use(requireAuth);

// GET /api/admin/content-refresh
router.get('/', (req, res) => adminContentRefreshController.getRefreshAudit(req, res));

export default router;
