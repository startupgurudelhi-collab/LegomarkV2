import { Request, Response, NextFunction } from 'express';
import { authService, AuthUserProfile } from '../services/auth.service';
import { AdminSession } from '../../db/schema/index';
import { logger } from '../utils/logger';
import { getSessionCookieOptions } from '../utils/cookie';

export const ADMIN_COOKIE_NAME = 'legomark_admin_session';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserProfile;
      session?: AdminSession;
    }
  }
}

/**
 * Authentication Middleware
 * Validates HttpOnly cookie token or Bearer header against active PostgreSQL sessions
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Extract token from cookie (signed or unsigned) or Authorization Bearer header
    let rawToken: string | undefined = req.cookies?.[ADMIN_COOKIE_NAME] || req.signedCookies?.[ADMIN_COOKIE_NAME];

    if (!rawToken && req.headers.authorization?.startsWith('Bearer ')) {
      rawToken = req.headers.authorization.substring(7).trim();
    }

    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.',
      });
      return;
    }

    // 2. Validate session against database
    const authResult = await authService.validateSession(rawToken);

    if (!authResult) {
      // Clear invalid/expired cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(ADMIN_COOKIE_NAME, cookieOptions);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please sign in again.',
      });
      return;
    }

    // 3. Attach authenticated user and session to request
    req.user = authResult.user;
    req.session = authResult.session;

    next();
  } catch (error) {
    logger.error('Authentication verification error', 'requireAuth', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed. Please sign in.',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified admin roles (e.g. ADMIN, EDITOR)
 */
export function requireRole(allowedRoles: Array<'ADMIN' | 'EDITOR'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Access denied: user ${req.user.email} (${req.user.role}) attempted restricted action requiring [${allowedRoles.join(', ')}]`,
        'requireRole'
      );
      res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have sufficient permissions to perform this action.',
      });
      return;
    }

    next();
  };
}
