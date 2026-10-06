import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load .env from multiple candidate paths for local development and containerized deployments
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env.production'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '../.env'),
  '/app/.env',
  '/app/applet/.env',
];

for (const envPath of candidateEnvPaths) {
  try {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } catch {
    // Ignore non-readable files
  }
}

/**
 * Safely resolves and cleans runtime environment variables.
 * In Coolify / Docker container environments, if a variable was injected
 * into PID 1 or an alternate .env location, it dynamically recovers it.
 */
export function getRuntimeEnv(...names: string[]): string | undefined {
  // 1. Direct process.env check across aliases
  for (const name of names) {
    const val = process.env[name];
    if (typeof val === 'string') {
      const clean = val.trim().replace(/^['"]|['"]$/g, '').trim();
      if (clean.length > 0) return clean;
    }
  }

  // 2. Candidate .env files
  for (const candidate of candidateEnvPaths) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf8');
        const parsed = dotenv.parse(content);
        for (const name of names) {
          const val = parsed[name];
          if (typeof val === 'string') {
            const clean = val.trim().replace(/^['"]|['"]$/g, '').trim();
            if (clean.length > 0) {
              process.env[name] = clean;
              return clean;
            }
          }
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // 3. Linux container init process (/proc/1/environ)
  try {
    if (fs.existsSync('/proc/1/environ')) {
      const p1Data = fs.readFileSync('/proc/1/environ', 'utf8');
      for (const item of p1Data.split('\0')) {
        if (!item) continue;
        const eqIdx = item.indexOf('=');
        if (eqIdx !== -1) {
          const key = item.slice(0, eqIdx);
          const val = item.slice(eqIdx + 1);
          if (names.includes(key)) {
            const clean = val.trim().replace(/^['"]|['"]$/g, '').trim();
            if (clean.length > 0) {
              process.env[key] = clean;
              return clean;
            }
          }
        }
      }
    }
  } catch {
    // Non-Linux or restricted procfs
  }

  // 4. Linux system /etc/environment
  try {
    if (fs.existsSync('/etc/environment')) {
      const envContent = fs.readFileSync('/etc/environment', 'utf8');
      const parsed = dotenv.parse(envContent);
      for (const name of names) {
        const val = parsed[name];
        if (typeof val === 'string') {
          const clean = val.trim().replace(/^['"]|['"]$/g, '').trim();
          if (clean.length > 0) {
            process.env[name] = clean;
            return clean;
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  return undefined;
}

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
  crm: {
    apiUrl: string;
    apiToken?: string;
  };
  recaptcha: {
    siteKey?: string;
    secretKey?: string;
  };
  gsc: {
    tokenEncryptionKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  rapidApi: {
    key?: string;
    host?: string;
  };
  falcon: {
    key?: string;
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

  const crm = {
    apiUrl: process.env.EFILINGG_CRM_API_URL?.trim() || 'https://efilingg.cloud/api/leads/website',
    apiToken: (
      process.env.EFILINGG_CRM_API_TOKEN ||
      process.env.EFILINGG_CRM_TOKEN ||
      process.env.CRM_BEARER_TOKEN ||
      process.env.EFILINGG_API_TOKEN ||
      process.env.CRM_API_TOKEN
    )?.trim(),
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
    crm,
    recaptcha: {
      siteKey: (process.env.VITE_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY)?.trim(),
      secretKey: process.env.RECAPTCHA_SECRET_KEY?.trim(),
    },
    gsc: {
      tokenEncryptionKey: process.env.GSC_TOKEN_ENCRYPTION_KEY?.trim() || undefined,
      clientId: (process.env.GOOGLE_CLIENT_ID || process.env.GSC_CLIENT_ID)?.trim() || undefined,
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || process.env.GSC_CLIENT_SECRET)?.trim() || undefined,
    },
    rapidApi: {
      get key(): string | undefined {
        return getRuntimeEnv('RAPIDAPI_KEY', 'RAPID_API_KEY', 'VITE_RAPIDAPI_KEY', 'X_RAPIDAPI_KEY');
      },
      get host(): string | undefined {
        return getRuntimeEnv('RAPIDAPI_HOST', 'RAPID_API_HOST', 'VITE_RAPIDAPI_HOST', 'X_RAPIDAPI_HOST');
      },
    },
    falcon: {
      get key(): string | undefined {
        return getRuntimeEnv('FALCON_API_KEY', 'FALCON_KEY', 'VITE_FALCON_API_KEY');
      },
    },
    uploadsDir,
    appUrl: process.env.APP_URL || `http://localhost:${port}`,
  };
}

export const config = resolveConfig();
