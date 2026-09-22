import { Router } from 'express';
import { adminOrphanPageController } from '../controllers/admin-orphan-page.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect with requireAuth
router.use(requireAuth);

// POST /api/admin/orphan-pages/scan
router.post('/scan', (req, res) => adminOrphanPageController.scan(req, res));

export default router;
