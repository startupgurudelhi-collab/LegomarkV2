import { Router } from 'express';
import { associationLogoController } from '../controllers/association-logo.controller';

const router = Router();

// GET /api/association-logos - Public list of active association logos
router.get('/', (req, res) => associationLogoController.getPublicLogos(req, res));

export default router;
