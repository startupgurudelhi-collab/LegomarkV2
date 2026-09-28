import { Request, Response } from 'express';
import { contentRefreshService } from '../services/content-refresh.service';
import { logger } from '../utils/logger';

export class AdminContentRefreshController {
  /**
   * GET /api/admin/content-refresh
   * Scans and returns articles requiring refresh or updates.
   */
  async getRefreshAudit(req: Request, res: Response): Promise<void> {
    try {
      const result = await contentRefreshService.analyzeContentRefresh();
      res.json(result);
    } catch (err: any) {
      logger.error('Error in AdminContentRefreshController.getRefreshAudit', 'ContentRefreshCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to analyze content refresh',
      });
    }
  }
}

export const adminContentRefreshController = new AdminContentRefreshController();
