import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { authRepository } from '../repositories/auth.repository';
import { AdminUser, AdminSession } from '../../db/schema/index';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Standard constant-time dummy hash to prevent user enumeration via timing
const DUMMY_HASH = '$2a$12$e8Y4Lq0sL2NqD5F8oJ1nOe7bV9k8xZ6m0Pq1rS2tU3vW4xY5z6A7B';
const BCRYPT_SALT_ROUNDS = 12;
const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOUCH_THROTTLE_MS = 15 * 60 * 1000; // 15 minutes

export interface AuthUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'EDITOR';
}

export interface LoginResult {
  rawSessionToken: string;
  user: AuthUserProfile;
  expiresAt: Date;
}

export class AuthService {
  /**
   * Compute SHA-256 hash of an opaque session token
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Hash a raw password using bcrypt (work factor 12)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Authenticate admin user with email and password
   */
  async login(
    emailRaw: string,
    passwordRaw: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<LoginResult> {
    const email = (emailRaw || '').toLowerCase().trim();
    const password = passwordRaw || '';

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await authRepository.findUserByEmail(email);

    // If user does not exist, execute dummy comparison to mitigate timing attacks
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw new Error('Invalid email or password');
    }

    // Verify user is active
    if (!user.isActive) {
      logger.warn(`Login rejected: inactive admin account [${email}]`, 'AuthService');
      throw new Error('Invalid email or password');
    }

    // Check account lockout
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      logger.warn(`Login rejected: account [${email}] is locked for ${minutesRemaining} more minutes`, 'AuthService');
      throw new Error(`Account temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes.`);
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const { lockedUntil } = await authRepository.recordFailedAttempt(user.id, user.failedAttempts);
      if (lockedUntil) {
        logger.warn(`Account [${email}] locked due to reaching failed attempt threshold`, 'AuthService');
        throw new Error('Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.');
      }
      throw new Error('Invalid email or password');
    }

    // Successful login: reset failed attempts & update last login timestamp
    await authRepository.recordSuccessfulLogin(user.id);

    // Generate 32-byte cryptographically secure opaque token
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(rawSessionToken);
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

    await authRepository.createSession({
      userId: user.id,
      sessionTokenHash,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      expiresAt,
    });

    logger.info(`Admin user [${user.email}] (${user.role}) logged in successfully`, 'AuthService');

    return {
      rawSessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as 'ADMIN' | 'EDITOR',
      },
      expiresAt,
    };
  }

  /**
   * Validate raw session token from HttpOnly cookie
   */
  async validateSession(rawToken: string): Promise<{ user: AuthUserProfile; session: AdminSession } | null> {
    if (!rawToken || typeof rawToken !== 'string') {
      return null;
    }

    const tokenHash = this.hashToken(rawToken);
    const result = await authRepository.findSessionWithUser(tokenHash);

    if (!result) {
      return null;
    }

    const { session, user } = result;
    const now = new Date();

    // Check inactive user
    if (!user.isActive) {
      await authRepository.revokeSession(session.id);
      return null;
    }

    // Check 24-hour inactivity expiration
    const lastActiveTime = new Date(session.lastActiveAt).getTime();
    if (now.getTime() - lastActiveTime > INACTIVITY_TIMEOUT_MS) {
      logger.info(`Session ${session.id} expired due to 24h inactivity`, 'AuthService');
      await authRepository.revokeSession(session.id);
      return null;
    }

    // Throttle lastActiveAt updates (only touch if > 15 minutes elapsed)
    if (now.getTime() - lastActiveTime > TOUCH_THROTTLE_MS) {
      // Non-blocking fire and forget
      authRepository.touchSession(session.id).catch(() => {});
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as 'ADMIN' | 'EDITOR',
      },
      session,
    };
  }

  /**
   * Invalidate a single active session
   */
  async logout(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await authRepository.revokeSessionByTokenHash(tokenHash);
  }

  /**
   * Invalidate all active sessions for a user
   */
  async logoutAll(userId: string): Promise<void> {
    if (!userId) return;
    await authRepository.revokeAllUserSessions(userId);
  }
}

export const authService = new AuthService();
