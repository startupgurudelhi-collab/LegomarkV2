import { Router } from 'express';
import { adminServiceController } from '../controllers/admin-service.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protect all admin service routes
router.use(requireAuth);
router.use(requireRole(['ADMIN', 'EDITOR']));

// GET /api/admin/services - List all services with category and child counts
router.get('/', (req, res) => adminServiceController.getAllServices(req, res));

// POST /api/admin/services - Create a new service
router.post('/', (req, res) => adminServiceController.createService(req, res));

// PATCH /api/admin/services/reorder - Reorder services in one atomic transaction
router.patch('/reorder', (req, res) => adminServiceController.reorderServices(req, res));

// GET /api/admin/services/:id - Get single service
router.get('/:id', (req, res) => adminServiceController.getServiceById(req, res));

// PUT /api/admin/services/:id - Update service metadata
router.put('/:id', (req, res) => adminServiceController.updateService(req, res));

// PATCH /api/admin/services/:id/status - Toggle active/inactive
router.patch('/:id/status', (req, res) => adminServiceController.updateStatus(req, res));

// DELETE /api/admin/services/:id - Delete a service
router.delete('/:id', (req, res) => adminServiceController.deleteService(req, res));

export default router;
