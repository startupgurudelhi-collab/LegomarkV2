import { Request, Response } from 'express';
import { orphanPageService } from '../services/orphan-page.service';
import { logger } from '../utils/logger';

export class AdminOrphanPageController {
  async scan(req: Request, res: Response): Promise<void> {
    try {
      const result = await orphanPageService.scanOrphanPages();
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error in AdminOrphanPageController.scan', 'OrphanPageCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to scan orphan pages',
      });
    }
  }
}

export const adminOrphanPageController = new AdminOrphanPageController();
