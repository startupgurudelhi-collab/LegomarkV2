import { Request, Response } from 'express';
import { autoBlogGeneratorService } from '../services/auto-blog-generator.service';
import { logger } from '../utils/logger';

export class AdminAutoBlogController {
  async generateBlog(req: Request, res: Response): Promise<void> {
    try {
      const { topic, targetService } = req.body;

      if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Blog Topic is required' });
        return;
      }

      if (!targetService || typeof targetService !== 'string' || targetService.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Target Service is required' });
        return;
      }

      const result = await autoBlogGeneratorService.generateAutoBlog({
        topic: topic.trim(),
        targetService: targetService.trim(),
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error in AdminAutoBlogController.generateBlog', 'AutoBlogCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to complete unified auto blog generation',
      });
    }
  }
}

export const adminAutoBlogController = new AdminAutoBlogController();
