import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

// Public settings route (No auth required)
router.get('/', (req, res) => settingsController.getPublicSettings(req, res));

export default router;
