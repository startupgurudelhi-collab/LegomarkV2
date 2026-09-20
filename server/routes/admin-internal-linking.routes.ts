import { Router } from 'express';
import { adminInternalLinkingController } from '../controllers/admin-internal-linking.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect with requireAuth
router.use(requireAuth);

// POST /api/admin/internal-linking/scan
router.post('/scan', (req, res) => adminInternalLinkingController.scan(req, res));

export default router;
