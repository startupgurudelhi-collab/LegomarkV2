import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service';
import { logger } from '../utils/logger';

export class HealthController {
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await healthService.getSystemHealth();
      const httpStatus = report.status === 'ok' ? 200 : 503;

      if (report.status !== 'ok') {
        logger.warn(`Health check degraded: ${report.database.error || 'PostgreSQL not reachable'}`, 'HealthController');
      }

      res.status(httpStatus).json(report);
    } catch (error) {
      next(error);
    }
  }

  async getLiveness(req: Request, res: Response): Promise<void> {
    // Quick liveness check for Docker / Coolify container orchestration
    res.status(200).json({
      status: 'alive',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }
}

export const healthController = new HealthController();
