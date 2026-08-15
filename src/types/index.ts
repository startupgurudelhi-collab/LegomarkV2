export interface SystemHealthReport {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  architecture: {
    frontend: string;
    backend: string;
    database: string;
    orm: string;
    deploymentTarget: string;
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
