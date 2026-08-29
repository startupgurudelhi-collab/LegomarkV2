import { Router } from 'express';
import { adminServiceController } from '../controllers/admin-service.controller';
import { adminServicePackageController } from '../controllers/admin-service-package.controller';
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

// ==========================================
// Service-Scoped Package Management Endpoints
// ==========================================

// GET /api/admin/services/:serviceId/packages - List packages for this service with custom configs & deliverables
router.get('/:serviceId/packages', (req, res) => adminServicePackageController.getServicePackages(req, res));

// GET /api/admin/services/:serviceId/packages/:packageId - Get single service-scoped package
router.get('/:serviceId/packages/:packageId', (req, res) => adminServicePackageController.getServicePackageById(req, res));

// POST /api/admin/services/:serviceId/packages - Assign or create package for this service
router.post('/:serviceId/packages', (req, res) => adminServicePackageController.assignPackage(req, res));

// PUT /api/admin/services/:serviceId/packages/:packageId - Update package config & deliverables for THIS service ONLY
router.put('/:serviceId/packages/:packageId', (req, res) => adminServicePackageController.updateServicePackage(req, res));

// PATCH /api/admin/services/:serviceId/packages/reorder - Reorder packages for this service
router.patch('/:serviceId/packages/reorder', (req, res) => adminServicePackageController.reorderPackages(req, res));

// PATCH /api/admin/services/:serviceId/packages/:packageId/status - Toggle active/inactive for this service
router.patch('/:serviceId/packages/:packageId/status', (req, res) => adminServicePackageController.toggleStatus(req, res));

// DELETE /api/admin/services/:serviceId/packages/:packageId - Unassign package from this service
router.delete('/:serviceId/packages/:packageId', (req, res) => adminServicePackageController.deleteServicePackage(req, res));

export default router;
