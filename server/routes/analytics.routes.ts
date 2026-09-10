import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

// POST /api/analytics/track - Public, non-blocking visitor tracking
router.post('/track', (req, res) => analyticsController.trackVisit(req, res));

export default router;
