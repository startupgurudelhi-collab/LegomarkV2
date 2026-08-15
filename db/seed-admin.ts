import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDatabase, pingDatabase, closeDatabasePool } from '../server/config/database';
import { adminUsers } from './schema/index';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../server/utils/logger';

dotenv.config();

const TARGET_ADMIN_EMAIL = (process.env.ADMIN_INITIAL_EMAIL?.trim() || 'admin@legomarkindia.com').toLowerCase().trim();
const TARGET_ADMIN_NAME = process.env.ADMIN_INITIAL_NAME?.trim() || 'LEGOMARK INDIA Administrator';

/**
 * Generate a cryptographically strong, human-readable temporary password.
 * Guaranteed to satisfy all complexity requirements:
 * - 16+ characters (22 chars)
 * - Uppercase letters (A-Z)
 * - Lowercase letters (a-z)
 * - Numbers (0-9)
 * - Special characters (!@#$%&*)
 * Uses Node.js crypto.randomBytes / crypto.randomInt (Never Math.random())
 */
export function generateSecureTempPassword(): string {
  const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijkmnpqrstuvwxyz';
  const numChars = '23456789';
  const specialChars = '!@#$%&*';
  const allChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

  const randUpper = upperChars[crypto.randomInt(0, upperChars.length)];
  const randLower = lowerChars[crypto.randomInt(0, lowerChars.length)];
  const randNum = numChars[crypto.randomInt(0, numChars.length)];
  const randSpecial = specialChars[crypto.randomInt(0, specialChars.length)];

  const randomBlock1 = Array.from(crypto.randomBytes(4)).map((b) => allChars[b % allChars.length]).join('');
  const randomBlock2 = Array.from(crypto.randomBytes(4)).map((b) => allChars[b % allChars.length]).join('');

  return `LegoMark${randSpecial}${randNum}${randUpper}${randLower}-${randomBlock1}-${randomBlock2}`;
}

export async function bootstrapInitialAdmin(): Promise<{ created: boolean; email: string; tempPassword?: string }> {
  const isConn = await pingDatabase();
  if (!isConn.connected) {
    logger.error(`Cannot run admin bootstrap: PostgreSQL unreachable. Error: ${isConn.error}`, 'AuthBootstrap');
    throw new Error(`Database unreachable: ${isConn.error}`);
  }

  const db = getDatabase();

  // 1. Run all pending Drizzle schema migrations to ensure tables and columns exist
  const migrationsFolder = path.resolve(process.cwd(), 'db/migrations');
  if (fs.existsSync(migrationsFolder)) {
    try {
      logger.info('Verifying database schema migrations before bootstrap...', 'AuthBootstrap');
      await migrate(db, { migrationsFolder });
      logger.info('Schema migration check completed successfully.', 'AuthBootstrap');
    } catch (migErr) {
      logger.warn('Automated Drizzle migration check encountered an error, falling back to direct schema validation:', 'AuthBootstrap', migErr);
    }
  }

  // 2. Ensure column must_change_password exists idempotently
  try {
    await db.execute(sql`ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;`);
  } catch (sqlErr) {
    logger.warn('Could not run fallback column check (table might be newly created by migrations):', 'AuthBootstrap', sqlErr);
  }

  // 3. Check if target admin account already exists
  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, TARGET_ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log('\n========================================');
    console.log('ADMIN ACCOUNT ALREADY EXISTS');
    console.log('========================================\n');
    console.log('Email:');
    console.log(TARGET_ADMIN_EMAIL);
    console.log('\nNo password was changed.');
    console.log('No credentials were overwritten.\n');
    console.log('========================================\n');
    return { created: false, email: TARGET_ADMIN_EMAIL };
  }

  // 4. Generate cryptographically secure temporary password (never from environment variable)
  const tempPassword = generateSecureTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // 5. Insert initial administrator account
  await db.insert(adminUsers).values({
    email: TARGET_ADMIN_EMAIL,
    passwordHash,
    fullName: TARGET_ADMIN_NAME,
    role: 'ADMIN',
    isActive: true,
    mustChangePassword: true,
  });

  console.log('\n========================================');
  console.log('LEGOMARK INDIA ADMIN CREATED');
  console.log('========================================\n');
  console.log('Email:');
  console.log(TARGET_ADMIN_EMAIL);
  console.log('\nTemporary Password:');
  console.log(tempPassword);
  console.log('\nIMPORTANT:');
  console.log('Save this password securely.');
  console.log('It will be required for the first login.');
  console.log('You will be forced to change it after login.\n');
  console.log('========================================\n');

  return { created: true, email: TARGET_ADMIN_EMAIL, tempPassword };
}

// Execute standalone if called directly
if (process.argv[1]?.endsWith('seed-admin.ts')) {
  bootstrapInitialAdmin()
    .then(() => closeDatabasePool())
    .catch((err) => {
      console.error('Failed to run admin bootstrap:', err.message || err);
      process.exit(1);
    });
}
