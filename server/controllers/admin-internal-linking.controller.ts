import { Request, Response } from 'express';
import { internalLinkingService } from '../services/internal-linking.service';
import { logger } from '../utils/logger';

export class AdminInternalLinkingController {
  async scan(req: Request, res: Response): Promise<void> {
    try {
      const result = await internalLinkingService.scanInternalLinks();
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error in AdminInternalLinkingController.scan', 'InternalLinkingCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to scan internal linking opportunities',
      });
    }
  }
}

export const adminInternalLinkingController = new AdminInternalLinkingController();
