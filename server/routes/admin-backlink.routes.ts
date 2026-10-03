import { Router } from 'express';
import { adminBacklinkController } from '../controllers/admin-backlink.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication and ADMIN role requirement
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

// GET /api/admin/backlinks/opportunities
router.get('/opportunities', (req, res) => adminBacklinkController.getOpportunities(req, res));

export default router;
