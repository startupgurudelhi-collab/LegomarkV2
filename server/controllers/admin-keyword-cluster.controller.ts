import { Request, Response } from 'express';
import { keywordClusterService } from '../services/keyword-cluster.service';
import { logger } from '../utils/logger';

export class AdminKeywordClusterController {
  async generate(req: Request, res: Response): Promise<void> {
    try {
      const { topic, targetService } = req.body;

      if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Main Topic / Seed Keyword is required',
        });
        return;
      }

      const cluster = await keywordClusterService.generateCluster(
        topic.trim(),
        typeof targetService === 'string' ? targetService.trim() : undefined
      );

      res.json({
        success: true,
        data: cluster,
      });
    } catch (err: any) {
      logger.error('Error in AdminKeywordClusterController.generate', 'KeywordClusterCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate AI keyword cluster',
      });
    }
  }
}

export const adminKeywordClusterController = new AdminKeywordClusterController();
