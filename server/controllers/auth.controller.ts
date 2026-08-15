import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ADMIN_COOKIE_NAME } from '../middleware/auth';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { getSessionCookieOptions } from '../utils/cookie';

export class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      // Extract client network metadata
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(email, password, { ipAddress, userAgent });

      // Set adaptive HttpOnly session cookie (dynamically checks HTTPS / proxy TLS)
      const maxAgeMs = config.auth.sessionMaxAgeDays * 24 * 60 * 60 * 1000;
      const cookieOptions = getSessionCookieOptions(req, maxAgeMs);
      res.cookie(ADMIN_COOKIE_NAME, result.rawSessionToken, cookieOptions);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user: result.user,
          expiresAt: result.expiresAt,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      logger.warn(`Login attempt failed: ${errorMessage}`, 'AuthController');

      res.status(401).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies?.[ADMIN_COOKIE_NAME] || req.signedCookies?.[ADMIN_COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');

      if (rawToken) {
        await authService.logout(rawToken);
      }

      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(ADMIN_COOKIE_NAME, cookieOptions);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout error', 'AuthController', error);
      res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
      res.status(200).json({
        success: true,
        message: 'Session cleared',
      });
    }
  }

  /**
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Authenticated admin password update
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'Authentication required. Please sign in.',
        });
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = req.body || {};

      if (!newPassword) {
        res.status(400).json({
          success: false,
          error: 'New password is required.',
        });
        return;
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        res.status(400).json({
          success: false,
          error: 'New password and confirmation password do not match.',
        });
        return;
      }

      const updatedUser = await authService.changePassword(
        req.user.id,
        newPassword,
        currentPassword
      );

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. You may now access the admin portal.',
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password.';
      logger.warn(`Password change failed for user [${req.user?.email}]: ${errorMessage}`, 'AuthController');

      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  /**
   * POST /api/auth/logout-all
   */
  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id) {
        await authService.logoutAll(req.user.id);
      }

      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(ADMIN_COOKIE_NAME, cookieOptions);

      res.status(200).json({
        success: true,
        message: 'All active sessions have been invalidated successfully',
      });
    } catch (error) {
      logger.error('Logout all error', 'AuthController', error);
      next(error);
    }
  }
}

export const authController = new AuthController();
