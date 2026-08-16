import { Router } from 'express';
import { clientLogoController } from '../controllers/client-logo.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Require admin authentication for all modification routes
router.use(requireAuth);

// GET /api/admin/client-logos
router.get('/', (req, res) => clientLogoController.getAdminLogos(req, res));

// POST /api/admin/client-logos
router.post('/', (req, res) => clientLogoController.createLogo(req, res));

// PUT /api/admin/client-logos/:id
router.put('/:id', (req, res) => clientLogoController.updateLogo(req, res));

// DELETE /api/admin/client-logos/:id
router.delete('/:id', (req, res) => clientLogoController.deleteLogo(req, res));

// PATCH /api/admin/client-logos/reorder
router.patch('/reorder', (req, res) => clientLogoController.reorderLogos(req, res));

export default router;
