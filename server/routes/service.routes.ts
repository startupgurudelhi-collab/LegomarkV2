import { Router } from 'express';
import { serviceController } from '../controllers/service.controller';

const router = Router();

// GET /api/services/categories - Returns all active service categories ordered by display_order
router.get('/categories', (req, res, next) => serviceController.getCategories(req, res, next));

// GET /api/services/category/:categoryId - Returns all active services for a category ordered by display_order
router.get('/category/:categoryId', (req, res, next) => serviceController.getServicesByCategory(req, res, next));

// GET /api/services - Returns all active services ordered by display_order
router.get('/', (req, res, next) => serviceController.getServices(req, res, next));

// GET /api/services/:slug - Returns one active service by canonical slug with full landing page CMS content
router.get('/:slug', (req, res, next) => serviceController.getServiceBySlug(req, res, next));

export default router;
