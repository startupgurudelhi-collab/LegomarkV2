import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { getDatabase, pingDatabase, closeDatabasePool } from '../server/config/database';
import { adminUsers } from './schema/index';
import { eq } from 'drizzle-orm';
import { logger } from '../server/utils/logger';

dotenv.config();

export async function bootstrapInitialAdmin(): Promise<void> {
  const email = process.env.ADMIN_INITIAL_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  const fullName = process.env.ADMIN_INITIAL_NAME?.trim() || 'System Administrator';

  if (!email || !password) {
    logger.info(
      'No ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD environment variables found. Skipping explicit admin bootstrap.',
      'AuthBootstrap'
    );
    return;
  }

  const isConn = await pingDatabase();
  if (!isConn.connected) {
    logger.warn('Cannot run admin bootstrap: database unreachable.', 'AuthBootstrap');
    return;
  }

  const db = getDatabase();

  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    logger.info(`Admin user [${email}] already exists. No action taken.`, 'AuthBootstrap');
    return;
  }

  logger.info(`Creating initial admin account for [${email}]...`, 'AuthBootstrap');
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(adminUsers).values({
    email,
    passwordHash,
    fullName,
    role: 'ADMIN',
    isActive: true,
  });

  logger.info(`Initial admin account created successfully for [${email}] with role [ADMIN].`, 'AuthBootstrap');
}

// Execute standalone if called directly
if (process.argv[1]?.endsWith('seed-admin.ts')) {
  bootstrapInitialAdmin()
    .then(() => closeDatabasePool())
    .catch((err) => {
      logger.error('Failed to run admin bootstrap', 'AuthBootstrap', err);
      process.exit(1);
    });
}
