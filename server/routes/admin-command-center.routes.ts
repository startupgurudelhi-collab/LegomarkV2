import { Router } from 'express';
import { adminCommandCenterController } from '../controllers/admin-command-center.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication and ADMIN role requirement
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

// GET /api/admin/command-center
router.get('/', (req, res) => adminCommandCenterController.getOverview(req, res));

export default router;
