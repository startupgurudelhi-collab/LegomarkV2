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
}

export const adminSeoOptimizerController = new AdminSeoOptimizerController();
