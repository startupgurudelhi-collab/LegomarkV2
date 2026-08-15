import { Request, Response } from 'express';
import { blogRepository } from '../repositories/blog.repository';
import { logger } from '../utils/logger';

export class BlogController {
  /**
   * GET /api/blogs
   * Returns published blog articles for the public website
   */
  async getPublicBlogs(req: Request, res: Response): Promise<void> {
    try {
      const { category, search } = req.query;
      const items = await blogRepository.getPublicBlogs(
        category as string,
        search as string
      );

      res.json({
        success: true,
        data: items,
        total: items.length,
      });
    } catch (err: any) {
      logger.error('Error in BlogController.getPublicBlogs', 'BlogCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch public blog articles',
      });
    }
  }

  /**
   * GET /api/blogs/:slug
   * Returns single published article by slug
   */
  async getPublicBlogBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const article = await blogRepository.getPublicBlogBySlug(slug);

      if (!article) {
        res.status(404).json({
          success: false,
          error: 'Article not found or not published',
        });
        return;
      }

      res.json({
        success: true,
        data: article,
      });
    } catch (err: any) {
      logger.error('Error in BlogController.getPublicBlogBySlug', 'BlogCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch article details',
      });
    }
  }
}

export const blogController = new BlogController();
