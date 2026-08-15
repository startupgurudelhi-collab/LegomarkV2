import { Router } from 'express';
import { founderController } from '../controllers/founder.controller';

const router = Router();

// GET /api/founder - Public endpoint for active founder profile
router.get('/', (req, res, next) => founderController.getPublicProfile(req, res, next));

export default router;
