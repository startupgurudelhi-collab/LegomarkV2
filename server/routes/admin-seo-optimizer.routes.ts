import { Router } from 'express';
import { adminSeoOptimizerController } from '../controllers/admin-seo-optimizer.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Require admin authentication for AI SEO Optimizer
router.use(requireAuth);

router.post('/analyze', (req, res) => adminSeoOptimizerController.analyze(req, res));

// LACS Module #18: Catalog-wide SEO Audit
router.post('/catalog/audit', (req, res) => adminSeoOptimizerController.runCatalogAudit(req, res));
router.get('/catalog/audit', (req, res) => adminSeoOptimizerController.getLatestCatalogAudit(req, res));

export default router;
