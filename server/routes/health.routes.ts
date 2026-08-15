import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

// Full health and database connectivity report
router.get('/health', (req, res, next) => healthController.getHealth(req, res, next));

// Fast liveness probe for container orchestration
router.get('/liveness', (req, res) => healthController.getLiveness(req, res));

export default router;
