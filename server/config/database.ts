import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema/index';
import { config } from './env';
import { logger } from '../utils/logger';

const { Pool } = pg;

export interface DatabaseConnectionStatus {
  connected: boolean;
  timestamp: string;
  latencyMs?: number;
  error?: string;
  poolInfo?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
}

let pool: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createPgPool(): pg.Pool {
  if (pool) {
    return pool;
  }

  const { database } = config;

  let poolConfig: pg.PoolConfig;

  if (database.url && database.url.trim().length > 0) {
    poolConfig = {
      connectionString: database.url,
      ssl: database.ssl ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  } else if (database.host && database.user && database.name) {
    poolConfig = {
      host: database.host,
      port: database.port,
      user: database.user,
      password: database.password,
      database: database.name,
      ssl: database.ssl ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  } else {
    // If no credentials configured yet, create empty config that will fail explicitly upon connection attempt
    poolConfig = {
      connectionString: 'postgresql://localhost:5432/legomark_db',
      connectionTimeoutMillis: 3000,
    };
  }

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    logger.error('Unexpected idle client error on PostgreSQL pool', 'DatabasePool', err);
  });

  return pool;
}

export function getDatabasePool(): pg.Pool {
  if (!pool) {
    pool = createPgPool();
  }
  return pool;
}

export function getDatabase() {
  if (!dbInstance) {
    const currentPool = getDatabasePool();
    dbInstance = drizzle(currentPool, { schema });
  }
  return dbInstance;
}

export async function pingDatabase(): Promise<DatabaseConnectionStatus> {
  const currentPool = getDatabasePool();
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const client = await currentPool.connect();
    try {
      const res = await client.query('SELECT NOW() as current_time, current_database() as database_name;');
      const latencyMs = Date.now() - startTime;

      return {
        connected: true,
        timestamp,
        latencyMs,
        poolInfo: {
          totalCount: currentPool.totalCount,
          idleCount: currentPool.idleCount,
          waitingCount: currentPool.waitingCount,
        },
      };
    } finally {
      client.release();
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      connected: false,
      timestamp,
      latencyMs,
      error: errorMessage,
      poolInfo: {
        totalCount: currentPool.totalCount,
        idleCount: currentPool.idleCount,
        waitingCount: currentPool.waitingCount,
      },
    };
  }
}

export async function verifyDatabaseConnection(): Promise<boolean> {
  logger.info('Verifying PostgreSQL database connectivity...', 'Database');
  const status = await pingDatabase();

  if (status.connected) {
    logger.info(
      `PostgreSQL connection verified successfully (${status.latencyMs}ms latency). Pool total: ${status.poolInfo?.totalCount}, idle: ${status.poolInfo?.idleCount}`,
      'Database'
    );
    return true;
  } else {
    logger.warn(
      `PostgreSQL connectivity check failed: ${status.error}. Running server in degraded state until PostgreSQL is supplied.`,
      'Database'
    );
    return false;
  }
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    logger.info('Closing PostgreSQL pool...', 'Database');
    await pool.end();
    pool = null;
    dbInstance = null;
    logger.info('PostgreSQL pool successfully drained and closed.', 'Database');
  }
}
