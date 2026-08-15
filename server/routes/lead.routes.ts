import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';

const router = Router();

// Public consultation submission endpoints
// POST /api/leads or POST /api/consultations
router.post('/', (req, res) => leadController.submitConsultation(req, res));

export default router;
