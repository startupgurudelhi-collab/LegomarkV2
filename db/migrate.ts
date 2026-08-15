import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDatabase, closeDatabasePool, verifyDatabaseConnection } from '../server/config/database';
import { logger } from '../server/utils/logger';
import path from 'path';
import fs from 'fs';

async function runMigrations() {
  logger.info('Starting PostgreSQL schema migration process...', 'Migrations');

  const migrationsFolder = path.resolve(process.cwd(), 'db/migrations');
  if (!fs.existsSync(migrationsFolder)) {
    fs.mkdirSync(migrationsFolder, { recursive: true });
  }

  const isConnected = await verifyDatabaseConnection();
  if (!isConnected) {
    logger.error(
      'Cannot run migrations: PostgreSQL database connection could not be established. Please verify your DATABASE_URL or DB_* environment variables.',
      'Migrations'
    );
    process.exit(1);
  }

  try {
    const db = getDatabase();
    logger.info(`Applying migrations from ${migrationsFolder}...`, 'Migrations');
    await migrate(db, { migrationsFolder });
    logger.info('All PostgreSQL migrations applied successfully.', 'Migrations');
  } catch (error) {
    logger.error('PostgreSQL migration failed with error:', 'Migrations', error);
    process.exit(1);
  } finally {
    await closeDatabasePool();
  }
}

// Only run immediately if executed directly via CLI/script
if (process.argv[1]?.includes('migrate')) {
  runMigrations();
}

export { runMigrations };
