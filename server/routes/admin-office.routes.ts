import { Router } from 'express';
import { officeController } from '../controllers/office.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin office endpoints
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'EDITOR']));

// GET /api/admin/office - Fetch office profile
router.get('/', (req, res, next) => officeController.getAdminProfile(req, res, next));

// PUT /api/admin/office - Update office profile
router.put('/', (req, res, next) => officeController.updateProfile(req, res, next));

export default router;
