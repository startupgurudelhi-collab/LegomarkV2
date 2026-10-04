import { Request, Response } from 'express';
import { lacsCommandCenterService } from '../services/lacs-command-center.service';
import { logger } from '../utils/logger';

export class AdminCommandCenterController {
  /**
   * GET /api/admin/command-center
   * Returns consolidated LACS #23 overview, deterministic health index, KPIs, priority actions, and module telemetry.
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const overview = await lacsCommandCenterService.getOverview();
      res.json({
        success: true,
        data: overview,
      });
    } catch (err: any) {
      logger.error('Failed to generate Command Center overview', 'AdminCommandCenterController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve Command Center overview',
      });
    }
  }
}

export const adminCommandCenterController = new AdminCommandCenterController();
