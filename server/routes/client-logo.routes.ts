import { Router } from 'express';
import { clientLogoController } from '../controllers/client-logo.controller';

const router = Router();

// GET /api/client-logos - Public list of active client logos
router.get('/', (req, res) => clientLogoController.getPublicLogos(req, res));

export default router;
