import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect admin settings route with frozen requireAuth middleware
router.use(requireAuth);

router.get('/', (req, res) => settingsController.getAdminSettings(req, res));
router.put('/', (req, res) => settingsController.updateAdminSettings(req, res));

export default router;
