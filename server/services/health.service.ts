import { healthRepository, DatabaseHealthInfo } from '../repositories/health.repository';
import { config } from '../config/env';

export interface ApplicationHealthReport {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  architecture: {
    frontend: 'React 19 + TypeScript + Vite';
    backend: 'Node.js + Express';
    database: 'PostgreSQL';
    orm: 'Drizzle ORM';
    deploymentTarget: 'Coolify / Docker';
  };
  system: {
    nodeVersion: string;
    memoryUsageMB: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
  database: {
    connected: boolean;
    latencyMs?: number;
    databaseName?: string;
    serverVersion?: string;
    error?: string;
    poolInfo?: {
      totalCount: number;
      idleCount: number;
      waitingCount: number;
    };
  };
}

export class HealthService {
  async getSystemHealth(): Promise<ApplicationHealthReport> {
    const memory = process.memoryUsage();
    const dbHealth: DatabaseHealthInfo = await healthRepository.checkDatabaseHealth();

    const status: 'ok' | 'degraded' | 'error' = dbHealth.connected ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.env,
      architecture: {
        frontend: 'React 19 + TypeScript + Vite',
        backend: 'Node.js + Express',
        database: 'PostgreSQL',
        orm: 'Drizzle ORM',
        deploymentTarget: 'Coolify / Docker',
      },
      system: {
        nodeVersion: process.version,
        memoryUsageMB: {
          rss: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
          heapTotal: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
          heapUsed: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
          external: Math.round((memory.external / 1024 / 1024) * 100) / 100,
        },
      },
      database: {
        connected: dbHealth.connected,
        latencyMs: dbHealth.latencyMs,
        databaseName: dbHealth.databaseName,
        serverVersion: dbHealth.serverVersion,
        error: dbHealth.error,
        poolInfo: dbHealth.poolInfo,
      },
    };
  }
}

export const healthService = new HealthService();
