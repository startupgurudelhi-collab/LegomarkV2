import { Router } from 'express';
import { adminGscController } from '../controllers/admin-gsc.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Verify active session for all admin GSC routes
router.use(requireAuth);

// GET /api/admin/gsc/status - Return safe metadata only
router.get('/status', (req, res) => adminGscController.getStatus(req, res));

// Restricted strictly to ADMIN role
router.get('/auth-url', requireRole(['ADMIN']), (req, res) =>
  adminGscController.getAuthUrl(req, res)
);

router.get('/oauth2callback', requireRole(['ADMIN']), (req, res) =>
  adminGscController.oauth2callback(req, res)
);

// GET /api/admin/gsc/properties - Discovers verified Google Search Console properties
router.get('/properties', requireRole(['ADMIN']), (req, res) =>
  adminGscController.getProperties(req, res)
);

// POST /api/admin/gsc/select-property - Validates and saves active property
router.post('/select-property', requireRole(['ADMIN']), (req, res) =>
  adminGscController.selectProperty(req, res)
);

// GET /api/admin/gsc/search-analytics - Query search analytics for active selected property
router.get('/search-analytics', requireRole(['ADMIN']), (req, res) =>
  adminGscController.getSearchAnalytics(req, res)
);

// Alias route: GET /api/admin/gsc/analytics
router.get('/analytics', requireRole(['ADMIN']), (req, res) =>
  adminGscController.getSearchAnalytics(req, res)
);

router.post('/disconnect', requireRole(['ADMIN']), (req, res) =>
  adminGscController.disconnect(req, res)
);

export default router;
