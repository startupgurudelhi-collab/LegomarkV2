import { Router } from 'express';
import { serviceCategoryController } from '../controllers/service-category.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin service-category endpoints with authentication and ADMIN/EDITOR role checks
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'EDITOR']));

// GET /api/admin/service-categories - Returns ALL categories (active & inactive) ordered by display_order ASC
router.get('/', (req, res, next) => serviceCategoryController.getAllCategories(req, res, next));

// POST /api/admin/service-categories - Creates a new service category
router.post('/', (req, res, next) => serviceCategoryController.createCategory(req, res, next));

// PATCH /api/admin/service-categories/reorder - Updates display_order for multiple categories in one transaction
// (Placed before /:id routes to avoid route collision)
router.patch('/reorder', (req, res, next) => serviceCategoryController.reorderCategories(req, res, next));

// PUT /api/admin/service-categories/:id - Updates category metadata (id is non-editable)
router.put('/:id', (req, res, next) => serviceCategoryController.updateCategory(req, res, next));

// PATCH /api/admin/service-categories/:id/status - Activates or deactivates a category
router.patch('/:id/status', (req, res, next) => serviceCategoryController.updateStatus(req, res, next));

// DELETE /api/admin/service-categories/:id - Deletes category only if serviceCount === 0
router.delete('/:id', (req, res, next) => serviceCategoryController.deleteCategory(req, res, next));

export default router;
