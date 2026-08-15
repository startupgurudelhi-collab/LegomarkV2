import { Request, Response } from 'express';
import { blogRepository } from '../repositories/blog.repository';
import { logger } from '../utils/logger';

export class AdminBlogController {
  /**
   * GET /api/admin/blogs
   * Returns blogs with filters, search, sorting and database-backed stats
   */
  async getBlogs(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, category, sortBy, sortOrder } = req.query;

      const result = await blogRepository.getAdminBlogs({
        search: search as string,
        status: status as 'all' | 'published' | 'draft',
        category: category as string,
        sortBy: sortBy as 'createdAt' | 'updatedAt' | 'title' | 'publishedAt',
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        data: result.blogs,
        total: result.total,
        stats: result.stats,
      });
    } catch (err: any) {
      logger.error('Error in AdminBlogController.getBlogs', 'AdminBlogCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch blogs from database',
      });
    }
  }

  /**
   * GET /api/admin/blogs/:id
   * Return single blog by ID
   */
  async getBlogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await blogRepository.getById(id);

      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Blog article not found',
        });
        return;
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      logger.error('Error in AdminBlogController.getBlogById', 'AdminBlogCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch blog article',
      });
    }
  }

  /**
   * POST /api/admin/blogs
   * Create new blog article
   */
  async createBlog(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        slug,
        category,
        author,
        content,
        excerpt,
        featuredImage,
        seoTitle,
        metaDescription,
        seoSlug,
        isPublished,
        publishedAt,
      } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Article title is required',
        });
        return;
      }

      if (!category || typeof category !== 'string' || category.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Article category is required',
        });
        return;
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Article content is required',
        });
        return;
      }

      const authorUser = (req as any).user?.fullName || (req as any).user?.email || 'Admin';

      const item = await blogRepository.create(
        {
          title,
          slug,
          category,
          author,
          content,
          excerpt,
          featuredImage,
          seoTitle,
          metaDescription,
          seoSlug,
          isPublished: Boolean(isPublished),
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        },
        authorUser
      );

      res.status(201).json({
        success: true,
        message: 'Blog article created successfully',
        data: item,
      });
    } catch (err: any) {
      logger.error('Error in AdminBlogController.createBlog', 'AdminBlogCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to create blog article',
      });
    }
  }

  /**
   * PUT /api/admin/blogs/:id
   * Update existing blog article
   */
  async updateBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        category,
        author,
        content,
        excerpt,
        featuredImage,
        seoTitle,
        metaDescription,
        seoSlug,
        isPublished,
        publishedAt,
      } = req.body;

      if (title !== undefined && (!title || title.trim().length === 0)) {
        res.status(400).json({
          success: false,
          error: 'Article title cannot be empty',
        });
        return;
      }

      if (content !== undefined && (!content || content.trim().length === 0)) {
        res.status(400).json({
          success: false,
          error: 'Article content cannot be empty',
        });
        return;
      }

      const authorUser = (req as any).user?.fullName || (req as any).user?.email || 'Admin';

      const updated = await blogRepository.update(
        id,
        {
          title,
          slug,
          category,
          author,
          content,
          excerpt,
          featuredImage,
          seoTitle,
          metaDescription,
          seoSlug,
          isPublished,
          publishedAt: publishedAt ? new Date(publishedAt) : (publishedAt === null ? null : undefined),
        },
        authorUser
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Blog article not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Blog article updated successfully',
        data: updated,
      });
    } catch (err: any) {
      logger.error('Error in AdminBlogController.updateBlog', 'AdminBlogCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update blog article',
      });
    }
  }

  /**
   * PATCH /api/admin/blogs/:id/toggle-publish
   * Toggle published state
   */
  async togglePublish(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authorUser = (req as any).user?.fullName || (req as any).user?.email || 'Admin';

      const updated = await blogRepository.togglePublish(id, authorUser);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Blog article not found',
        });
        return;
      }

      res.json({
        success: true,
        message: `Article ${updated.isPublished ? 'published' : 'moved to drafts'} successfully`,
        data: updated,
      });
    } catch (err: any) {
      logger.error('Error in AdminBlogController.togglePublish', 'AdminBlogCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle publication status',
      });
    }
  }

  /**
   * DELETE /api/admin/blogs/:id
   * Remove article
   */
  async deleteBlog(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await blogRepository.delete(id);

      res.json({
        success,
        message: 'Blog article deleted successfully',
      });
    } catch (err: any) {
      logger.error('Error in AdminBlogController.deleteBlog', 'AdminBlogCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to delete blog article',
      });
    }
  }
}

export const adminBlogController = new AdminBlogController();
