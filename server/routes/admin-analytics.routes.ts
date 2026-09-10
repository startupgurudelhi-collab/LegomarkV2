import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin analytics endpoints with active session verification and role check
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'EDITOR']));

// GET /api/admin/analytics/stats - Retrieve visitor counts, daily charts, and top pages
router.get('/stats', (req, res) => analyticsController.getStats(req, res));

export default router;
