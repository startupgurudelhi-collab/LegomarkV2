import { Router } from 'express';
import { adminBacklinkController } from '../controllers/admin-backlink.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication and ADMIN role requirement
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

// GET /api/admin/backlinks/opportunities
router.get('/opportunities', (req, res) => adminBacklinkController.getOpportunities(req, res));

// LACS #22: Tracked Backlinks CRUD & Verification
// GET /api/admin/backlinks/tracked
router.get('/tracked', (req, res) => adminBacklinkController.getTracked(req, res));

// POST /api/admin/backlinks/tracked
router.post('/tracked', (req, res) => adminBacklinkController.createTracked(req, res));

// POST /api/admin/backlinks/tracked/verify-all
router.post('/tracked/verify-all', (req, res) => adminBacklinkController.verifyAllTracked(req, res));

// PUT /api/admin/backlinks/tracked/:id
router.put('/tracked/:id', (req, res) => adminBacklinkController.updateTracked(req, res));

// DELETE /api/admin/backlinks/tracked/:id
router.delete('/tracked/:id', (req, res) => adminBacklinkController.deleteTracked(req, res));

// POST /api/admin/backlinks/tracked/:id/verify
router.post('/tracked/:id/verify', (req, res) => adminBacklinkController.verifyTracked(req, res));

export default router;
