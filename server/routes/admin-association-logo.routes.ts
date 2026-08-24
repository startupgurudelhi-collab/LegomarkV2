import { Router } from 'express';
import { associationLogoController } from '../controllers/association-logo.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Require admin authentication for all modification routes
router.use(requireAuth);

// GET /api/admin/association-logos
router.get('/', (req, res) => associationLogoController.getAdminLogos(req, res));

// POST /api/admin/association-logos
router.post('/', (req, res) => associationLogoController.createLogo(req, res));

// PUT /api/admin/association-logos/:id
router.put('/:id', (req, res) => associationLogoController.updateLogo(req, res));

// DELETE /api/admin/association-logos/:id
router.delete('/:id', (req, res) => associationLogoController.deleteLogo(req, res));

// PATCH /api/admin/association-logos/reorder
router.patch('/reorder', (req, res) => associationLogoController.reorderLogos(req, res));

export default router;
