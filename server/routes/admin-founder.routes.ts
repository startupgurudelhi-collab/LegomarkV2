import { Router } from 'express';
import { founderController } from '../controllers/founder.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin founder endpoints
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'EDITOR']));

// GET /api/admin/founder - Fetch founder profile
router.get('/', (req, res, next) => founderController.getAdminProfile(req, res, next));

// PUT /api/admin/founder - Update founder profile
router.put('/', (req, res, next) => founderController.updateProfile(req, res, next));

export default router;
