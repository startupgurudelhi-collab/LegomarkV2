import { Request, Response } from 'express';
import { testimonialRepository } from '../repositories/testimonial.repository';
import { logger } from '../utils/logger';

export class TestimonialController {
  /**
   * GET /api/testimonials
   * Returns active/published client testimonials for the public website
   */
  async getPublicTestimonials(req: Request, res: Response): Promise<void> {
    try {
      const items = await testimonialRepository.getPublicTestimonials();
      res.json({
        success: true,
        data: items,
        total: items.length,
      });
    } catch (err: any) {
      logger.error('Error in TestimonialController.getPublicTestimonials', 'TestimonialCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch client testimonials',
      });
    }
  }
}

export const testimonialController = new TestimonialController();
