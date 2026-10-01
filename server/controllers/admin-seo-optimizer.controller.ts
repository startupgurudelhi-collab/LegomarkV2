import { Request, Response } from 'express';
import { seoOptimizerService } from '../services/seo-optimizer.service';
import { logger } from '../utils/logger';

export class AdminSeoOptimizerController {
  async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { blogId, blog, focusKeyword } = req.body;

      if (!blogId && !blog) {
        res.status(400).json({
          success: false,
          error: 'Either a blogId or blog article payload is required for SEO analysis',
        });
        return;
      }

      const input = {
        blogId: typeof blogId === 'string' ? blogId.trim() : undefined,
        title: blog?.title,
        slug: blog?.slug,
        category: blog?.category,
        content: blog?.content,
        excerpt: blog?.excerpt,
        seoTitle: blog?.seoTitle,
        metaDescription: blog?.metaDescription,
        seoSlug: blog?.seoSlug,
        featuredImage: blog?.featuredImage,
        focusKeyword: typeof focusKeyword === 'string' ? focusKeyword.trim() : undefined,
      };

      const result = await seoOptimizerService.analyzeBlog(input);

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error in AdminSeoOptimizerController.analyze', 'SeoOptimizerCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to complete AI SEO analysis',
      });
    }
  }

  /**
   * LACS Module #18: Run + persist a fresh catalog-wide deterministic SEO audit
   * POST /api/admin/seo-optimizer/catalog/audit
   */
  async runCatalogAudit(req: Request, res: Response): Promise<void> {
    try {
      const result = await seoOptimizerService.auditCatalogDeterministic(true);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error in AdminSeoOptimizerController.runCatalogAudit', 'SeoOptimizerCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to complete catalog SEO audit',
      });
    }
  }

  /**
   * LACS Module #18: Read the latest saved catalog SEO audit
   * GET /api/admin/seo-optimizer/catalog/audit
   */
  async getLatestCatalogAudit(req: Request, res: Response): Promise<void> {
    try {
      let result = await seoOptimizerService.getCatalogAudit();

      // If no audit has been saved yet and autoRun query param is true
      if (!result && req.query.autoRun === 'true') {
        result = await seoOptimizerService.auditCatalogDeterministic(true);
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error in AdminSeoOptimizerController.getLatestCatalogAudit', 'SeoOptimizerCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch latest catalog SEO audit',
      });
    }
  }

  /**
   * LACS Module #20: Instant deterministic SEO score evaluation
   * POST /api/admin/seo-optimizer/evaluate
   * Evaluates the current article payload in real time without Gemini AI or database writes
   */
  async evaluate(req: Request, res: Response): Promise<void> {
    try {
      const { article, blog, focusKeyword } = req.body;
      const articlePayload = article || blog || req.body;

      if (!articlePayload || typeof articlePayload !== 'object') {
        res.status(400).json({
          success: false,
          error: 'An article payload object is required for SEO evaluation',
        });
        return;
      }

      const focusKw =
        typeof focusKeyword === 'string'
          ? focusKeyword.trim()
          : typeof articlePayload.focusKeyword === 'string'
          ? articlePayload.focusKeyword.trim()
          : undefined;

      const result = seoOptimizerService.evaluateArticleDeterministic(articlePayload, focusKw);

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error in AdminSeoOptimizerController.evaluate', 'SeoOptimizerCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to evaluate article SEO score',
      });
    }
  }
}

export const adminSeoOptimizerController = new AdminSeoOptimizerController();
