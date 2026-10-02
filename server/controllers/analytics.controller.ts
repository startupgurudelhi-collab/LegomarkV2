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
      const { path, visitorId, referrer, sessionId, isLandingPage } = req.body || {};

      // Fallback referrer from request headers if not provided in JSON body
      const effectiveReferrer = referrer || req.headers.referer || req.headers.referrer || null;

      const result = await analyticsService.trackVisit({
        path: typeof path === 'string' ? path : '/',
        visitorId: typeof visitorId === 'string' ? visitorId : undefined,
        referrer: typeof effectiveReferrer === 'string' ? effectiveReferrer : undefined,
        sessionId: typeof sessionId === 'string' ? sessionId : undefined,
        isLandingPage: typeof isLandingPage === 'boolean' ? isLandingPage : Boolean(isLandingPage),
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

  /**
   * GET /api/admin/analytics/seo-stats
   * Protected administrative endpoint returning specialized SEO analytics and catalog correlation.
   * Query params: ?rangeDays=30 (optional, clamped between 1 and 365)
   */
  async getSeoStats(req: Request, res: Response): Promise<void> {
    try {
      const rawRange = req.query.rangeDays;
      let rangeDays = 30;

      if (typeof rawRange === 'string' && rawRange.trim() !== '') {
        const parsed = parseInt(rawRange.trim(), 10);
        if (!isNaN(parsed)) {
          rangeDays = Math.max(1, Math.min(365, parsed));
        }
      }

      const seoDashboard = await analyticsService.getSeoAnalyticsDashboard(rangeDays);

      res.status(200).json({
        success: true,
        data: seoDashboard,
      });
    } catch (err: any) {
      logger.error(`Error in AnalyticsController.getSeoStats: ${err?.message || err}`, 'AnalyticsCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve SEO analytics statistics',
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
