import { Router } from 'express';
import { packageController } from '../controllers/package.controller';

const router = Router();

// GET /api/packages - Returns all active packages ordered by display_order ASC
router.get('/', (req, res, next) => packageController.getPackages(req, res, next));

// GET /api/packages/matrix - Returns comparison matrix data with active packages and rows
router.get('/matrix', (req, res, next) => packageController.getMatrix(req, res, next));

export default router;
