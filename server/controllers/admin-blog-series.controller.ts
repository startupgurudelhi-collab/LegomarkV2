import { Request, Response } from 'express';
import { blogSeriesService } from '../services/blog-series.service';
import { logger } from '../utils/logger';

export class AdminBlogSeriesController {
  async generate(req: Request, res: Response): Promise<void> {
    try {
      const { topic, targetService, articleCount } = req.body;

      if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Series Topic / Main Theme is required',
        });
        return;
      }

      const count = Number(articleCount) || 5;
      if (count < 3 || count > 8) {
        res.status(400).json({
          success: false,
          error: 'Number of articles must be between 3 and 8',
        });
        return;
      }

      const series = await blogSeriesService.generateSeries(
        topic.trim(),
        typeof targetService === 'string' ? targetService.trim() : undefined,
        count
      );

      res.json({
        success: true,
        data: series,
      });
    } catch (err: any) {
      logger.error('Error in AdminBlogSeriesController.generate', 'BlogSeriesCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate AI blog series',
      });
    }
  }
}

export const adminBlogSeriesController = new AdminBlogSeriesController();
