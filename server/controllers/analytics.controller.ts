import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { logger } from '../utils/logger';

export class AnalyticsController {
  /**
   * POST /api/analytics/track
   * Non-blocking public endpoint for recording page view events.
   * Completely anonymous — zero personal information accepted or stored.
   */
  async trackVisit(req: Request, res: Response): Promise<void> {
    try {
      const { path, visitorId, referrer } = req.body || {};

      // Fallback referrer from request headers if not provided in JSON body
      const effectiveReferrer = referrer || req.headers.referer || req.headers.referrer || null;

      const result = await analyticsService.trackVisit({
        path: typeof path === 'string' ? path : '/',
        visitorId: typeof visitorId === 'string' ? visitorId : undefined,
        referrer: typeof effectiveReferrer === 'string' ? effectiveReferrer : undefined,
      });

      res.status(200).json(result);
    } catch (err: any) {
      logger.warn(`Error in AnalyticsController.trackVisit: ${err?.message || err}`, 'AnalyticsCtrl');
      // Always return 200 OK so tracking never breaks client navigation
      res.status(200).json({ success: true, skipped: true });
    }
  }

  /**
   * GET /api/admin/analytics/stats
   * Protected administrative endpoint returning visitor metrics and daily trends.
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err: any) {
      logger.error(`Error in AnalyticsController.getStats: ${err?.message || err}`, 'AnalyticsCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve website analytics statistics',
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
