import { getDatabasePool, pingDatabase, DatabaseConnectionStatus } from '../config/database';
import { logger } from '../utils/logger';

export interface DatabaseHealthInfo extends DatabaseConnectionStatus {
  databaseName?: string;
  serverVersion?: string;
}

export class HealthRepository {
  async checkDatabaseHealth(): Promise<DatabaseHealthInfo> {
    const baseStatus = await pingDatabase();
    if (!baseStatus.connected) {
      return baseStatus;
    }

    try {
      const pool = getDatabasePool();
      const client = await pool.connect();
      try {
        const queryRes = await client.query('SELECT current_database() as db_name, version() as version;');
        const row = queryRes.rows[0];
        return {
          ...baseStatus,
          databaseName: row?.db_name,
          serverVersion: row?.version,
        };
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('Failed to fetch detailed database health metadata', 'HealthRepository', err);
      return baseStatus;
    }
  }
}

export const healthRepository = new HealthRepository();
