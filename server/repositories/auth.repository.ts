import { getDatabase, pingDatabase } from '../config/database';
import { adminUsers, adminSessions, AdminUser, AdminSession, NewAdminUser, NewAdminSession } from '../../db/schema/index';
import { eq, and, isNull, gt, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

export class AuthRepository {
  /**
   * Find an admin user by lowercase trimmed email
   */
  async findUserByEmail(email: string): Promise<AdminUser | null> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();
    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase().trim()))
      .limit(1);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find an admin user by UUID
   */
  async findUserById(id: string): Promise<AdminUser | null> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();
    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Record a new active session
   */
  async createSession(data: {
    userId: string;
    sessionTokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<AdminSession> {
    const db = getDatabase();
    const rows = await db
      .insert(adminSessions)
      .values({
        userId: data.userId,
        sessionTokenHash: data.sessionTokenHash,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        expiresAt: data.expiresAt,
      })
      .returning();

    return rows[0];
  }

  /**
   * Find an active, non-revoked session by SHA-256 token hash and join its user
   */
  async findSessionWithUser(tokenHash: string): Promise<{ session: AdminSession; user: AdminUser } | null> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      return null;
    }

    const db = getDatabase();
    const now = new Date();

    const rows = await db
      .select({
        session: adminSessions,
        user: adminUsers,
      })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
      .where(
        and(
          eq(adminSessions.sessionTokenHash, tokenHash),
          isNull(adminSessions.revokedAt),
          gt(adminSessions.expiresAt, now)
        )
      )
      .limit(1);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Update session activity timestamp (throttled to avoid heavy write load)
   */
  async touchSession(sessionId: string): Promise<void> {
    try {
      const db = getDatabase();
      await db
        .update(adminSessions)
        .set({ lastActiveAt: new Date() })
        .where(eq(adminSessions.id, sessionId));
    } catch (err) {
      logger.warn(`Failed to touch session ${sessionId}`, 'AuthRepository', err);
    }
  }

  /**
   * Revoke a single active session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const db = getDatabase();
    await db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(eq(adminSessions.id, sessionId));
  }

  /**
   * Revoke a session by token hash
   */
  async revokeSessionByTokenHash(tokenHash: string): Promise<void> {
    const db = getDatabase();
    await db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(adminSessions.sessionTokenHash, tokenHash),
          isNull(adminSessions.revokedAt)
        )
      );
  }

  /**
   * Revoke all active sessions for a given user (Logout All)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const db = getDatabase();
    await db
      .update(adminSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(adminSessions.userId, userId),
          isNull(adminSessions.revokedAt)
        )
      );
  }

  /**
   * Handle failed login attempt and lock account if exceeding threshold (5 failed attempts = 15m lock)
   */
  async recordFailedAttempt(userId: string, currentAttempts: number): Promise<{ lockedUntil: Date | null }> {
    const db = getDatabase();
    const newAttempts = currentAttempts + 1;
    let lockedUntil: Date | null = null;

    if (newAttempts >= 5) {
      // Lock for 15 minutes
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await db
      .update(adminUsers)
      .set({
        failedAttempts: newAttempts,
        lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, userId));

    return { lockedUntil };
  }

  /**
   * Reset failed attempts counter and update last_login_at timestamp
   */
  async recordSuccessfulLogin(userId: string): Promise<void> {
    const db = getDatabase();
    await db
      .update(adminUsers)
      .set({
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, userId));
  }

  /**
   * Explicit admin account creation (used by bootstrap / setup)
   */
  async createAdminUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    role?: 'ADMIN' | 'EDITOR';
    mustChangePassword?: boolean;
  }): Promise<AdminUser> {
    const db = getDatabase();
    const rows = await db
      .insert(adminUsers)
      .values({
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName.trim(),
        role: data.role || 'ADMIN',
        isActive: true,
        mustChangePassword: data.mustChangePassword ?? false,
      })
      .returning();

    return rows[0];
  }

  /**
   * Update admin user password and clear must_change_password flag
   */
  async updatePassword(userId: string, newPasswordHash: string): Promise<AdminUser> {
    const db = getDatabase();
    const rows = await db
      .update(adminUsers)
      .set({
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, userId))
      .returning();

    return rows[0];
  }
}

export const authRepository = new AuthRepository();
