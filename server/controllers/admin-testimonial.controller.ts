import { Request, Response } from 'express';
import { testimonialRepository } from '../repositories/testimonial.repository';
import { logger } from '../utils/logger';

export class AdminTestimonialController {
  /**
   * GET /api/admin/testimonials
   * Return testimonials with filters and stats
   */
  async getTestimonials(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, hasVideo, sortBy, sortOrder } = req.query;

      const result = await testimonialRepository.getAdminTestimonials({
        search: search as string,
        status: status as 'all' | 'published' | 'draft',
        hasVideo: hasVideo === 'true' ? true : undefined,
        sortBy: sortBy as 'displayOrder' | 'createdAt' | 'clientName',
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        data: result.testimonials,
        total: result.total,
        stats: result.stats,
      });
    } catch (err: any) {
      logger.error('Error in AdminTestimonialController.getTestimonials', 'AdminTestimonialCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch testimonials from database',
      });
    }
  }

  /**
   * GET /api/admin/testimonials/:id
   * Return single testimonial by ID
   */
  async getTestimonialById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await testimonialRepository.getById(id);
      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Testimonial not found',
        });
        return;
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      logger.error('Error in AdminTestimonialController.getTestimonialById', 'AdminTestimonialCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch testimonial',
      });
    }
  }

  /**
   * POST /api/admin/testimonials
   * Create new client review/testimonial
   */
  async createTestimonial(req: Request, res: Response): Promise<void> {
    try {
      const { clientName, company, designation, quote, rating, avatarUrl, videoUrl, isActive, displayOrder } = req.body;

      if (!clientName || typeof clientName !== 'string' || clientName.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Client name is required',
        });
        return;
      }

      if (!quote || typeof quote !== 'string' || quote.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Testimonial quote text is required',
        });
        return;
      }

      const author = (req as any).user?.fullName || (req as any).user?.email || 'Admin';

      const item = await testimonialRepository.create(
        {
          clientName,
          company,
          designation,
          quote,
          rating: typeof rating === 'number' ? rating : 5,
          avatarUrl,
          videoUrl,
          isActive: isActive !== false,
          displayOrder: typeof displayOrder === 'number' ? displayOrder : undefined,
        },
        author
      );

      res.status(201).json({
        success: true,
        message: 'Client testimonial created successfully',
        data: item,
      });
    } catch (err: any) {
      logger.error('Error in AdminTestimonialController.createTestimonial', 'AdminTestimonialCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to create testimonial',
      });
    }
  }

  /**
   * PUT /api/admin/testimonials/:id
   * Update existing testimonial
   */
  async updateTestimonial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { clientName, company, designation, quote, rating, avatarUrl, videoUrl, isActive, displayOrder } = req.body;

      if (clientName !== undefined && (!clientName || clientName.trim().length === 0)) {
        res.status(400).json({
          success: false,
          error: 'Client name cannot be empty',
        });
        return;
      }

      if (quote !== undefined && (!quote || quote.trim().length === 0)) {
        res.status(400).json({
          success: false,
          error: 'Testimonial quote cannot be empty',
        });
        return;
      }

      const author = (req as any).user?.fullName || (req as any).user?.email || 'Admin';

      const updated = await testimonialRepository.update(
        id,
        {
          clientName,
          company,
          designation,
          quote,
          rating,
          avatarUrl,
          videoUrl,
          isActive,
          displayOrder,
        },
        author
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Testimonial not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Testimonial updated successfully',
        data: updated,
      });
    } catch (err: any) {
      logger.error('Error in AdminTestimonialController.updateTestimonial', 'AdminTestimonialCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update testimonial',
      });
    }
  }

  /**
   * PATCH /api/admin/testimonials/reorder
   * Bulk update display orders
   */
  async reorderTestimonials(req: Request, res: Response): Promise<void> {
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders)) {
        res.status(400).json({
          success: false,
          error: 'Orders array is required ({ id: string, displayOrder: number }[])',
        });
        return;
      }

      const author = (req as any).user?.fullName || (req as any).user?.email || 'Admin';
      await testimonialRepository.updateDisplayOrders(orders, author);

      res.json({
        success: true,
        message: 'Testimonials reordered successfully',
      });
    } catch (err: any) {
      logger.error('Error in AdminTestimonialController.reorderTestimonials', 'AdminTestimonialCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to reorder testimonials',
      });
    }
  }

  /**
   * DELETE /api/admin/testimonials/:id
   * Remove testimonial
   */
  async deleteTestimonial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await testimonialRepository.delete(id);

      res.json({
        success,
        message: 'Testimonial deleted successfully',
      });
    } catch (err: any) {
      logger.error('Error in AdminTestimonialController.deleteTestimonial', 'AdminTestimonialCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to delete testimonial',
      });
    }
  }
}

export const adminTestimonialController = new AdminTestimonialController();
