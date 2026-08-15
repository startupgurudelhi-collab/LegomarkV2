import { Router } from 'express';
import { packageController } from '../controllers/package.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin package endpoints with authentication and ADMIN/EDITOR role checks
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'EDITOR']));

// GET /api/admin/packages - Returns ALL packages (active & inactive) ordered by display_order ASC
router.get('/', (req, res, next) => packageController.getAdminPackages(req, res, next));

// POST /api/admin/packages - Creates a new package with features atomically
router.post('/', (req, res, next) => packageController.createPackage(req, res, next));

// PATCH /api/admin/packages/reorder - Updates display_order for multiple packages in one transaction
// (Placed before /:id routes to avoid route collision)
router.patch('/reorder', (req, res, next) => packageController.reorderPackages(req, res, next));

// PUT /api/admin/packages/:id - Updates package metadata and synchronizes features in one transaction
router.put('/:id', (req, res, next) => packageController.updatePackage(req, res, next));

// PATCH /api/admin/packages/:id/status - Activates or deactivates a package
router.patch('/:id/status', (req, res, next) => packageController.updatePackageStatus(req, res, next));

// DELETE /api/admin/packages/:id - Deletes a package safely (cascading features and matrix cell values)
router.delete('/:id', (req, res, next) => packageController.deletePackage(req, res, next));

export default router;
