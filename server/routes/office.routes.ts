import { Router } from 'express';
import { officeController } from '../controllers/office.controller';

const router = Router();

// GET /api/office - Public endpoint for active office profile
router.get('/', (req, res, next) => officeController.getPublicProfile(req, res, next));

export default router;
