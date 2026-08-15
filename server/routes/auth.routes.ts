import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/auth/login - Authenticate admin & issue HttpOnly session cookie
router.post('/login', (req, res, next) => authController.login(req, res, next));

// POST /api/auth/logout - Invalidate current session and clear cookie
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// GET /api/auth/me - Protected endpoint returning current user profile
router.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));

// POST /api/auth/change-password - Change admin user password (forced or manual)
router.post('/change-password', requireAuth, (req, res, next) => authController.changePassword(req, res, next));

// POST /api/auth/logout-all - Invalidate all active sessions for current user
router.post('/logout-all', requireAuth, (req, res, next) => authController.logoutAll(req, res, next));

export default router;
