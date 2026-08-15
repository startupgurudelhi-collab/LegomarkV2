import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  host: string;
  corsOrigin: string;
  database: {
    url?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    name?: string;
    ssl: boolean;
  };
  auth: {
    sessionSecret: string;
    cookieSecure: boolean;
    sessionMaxAgeDays: number;
  };
  uploadsDir: string;
  appUrl?: string;
}

function resolveConfig(): AppConfig {
  const env = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = '0.0.0.0'; // Essential for Cloud Run / Coolify / Docker
  const corsOrigin = process.env.CORS_ORIGIN || '*';

  // Configurable persistent media uploads directory (Coolify Persistent Volume / Host Mount)
  const uploadsDir = process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.resolve(process.cwd(), 'public', 'uploads');

  const dbSsl = process.env.DB_SSL === 'true';

  const database = {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    ssl: dbSsl,
  };

  const auth = {
    sessionSecret: process.env.SESSION_SECRET || 'legomark-admin-default-dev-secret-key-change-in-prod',
    cookieSecure: process.env.ADMIN_COOKIE_SECURE ? process.env.ADMIN_COOKIE_SECURE === 'true' : env === 'production',
    sessionMaxAgeDays: parseInt(process.env.ADMIN_SESSION_MAX_AGE_DAYS || '7', 10),
  };

  const hasDbUrl = Boolean(database.url && database.url.trim().length > 0);
  const hasDiscreteConfig = Boolean(database.host && database.user && database.name);

  if (!hasDbUrl && !hasDiscreteConfig) {
    logger.warn(
      'No explicit PostgreSQL configuration detected in DATABASE_URL or DB_HOST/DB_USER/DB_NAME. Health checks will report database connectivity status.',
      'Config'
    );
  }

  return {
    env,
    port,
    host,
    corsOrigin,
    database,
    auth,
    uploadsDir,
    appUrl: process.env.APP_URL || `http://localhost:${port}`,
  };
}

export const config = resolveConfig();
