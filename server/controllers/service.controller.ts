import { Request, Response, NextFunction } from 'express';
import { serviceService } from '../services/service.service';
import { logger } from '../utils/logger';

export class ServiceController {
  /**
   * GET /api/services/categories
   * Public endpoint to fetch all active service categories
   */
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await serviceService.getAllPublicCategories();
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (error) {
      logger.error('Failed to fetch service categories from database', 'ServiceController', error);
      res.status(503).json({
        success: false,
        error: 'Database service unavailable. Unable to load service categories.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/services
   * Public endpoint to fetch all active services
   */
  async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const servicesList = await serviceService.getAllPublicServices();
      res.status(200).json({
        success: true,
        count: servicesList.length,
        data: servicesList,
      });
    } catch (error) {
      logger.error('Failed to fetch services from database', 'ServiceController', error);
      res.status(503).json({
        success: false,
        error: 'Database service unavailable. Unable to load services.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/services/category/:categoryId
   * Public endpoint to fetch services belonging to a category
   */
  async getServicesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      if (!categoryId) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required',
        });
        return;
      }

      const result = await serviceService.getPublicServicesByCategory(categoryId);
      if (!result) {
        res.status(404).json({
          success: false,
          error: `Category not found: ${categoryId}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        category: result.category,
        count: result.services.length,
        data: result.services,
      });
    } catch (error) {
      logger.error(`Failed to fetch services for category '${req.params.categoryId}'`, 'ServiceController', error);
      res.status(503).json({
        success: false,
        error: 'Database service unavailable. Unable to load category services.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/services/:slug
   * Public endpoint to fetch a single service with its full landing-page CMS structure
   */
  async getServiceBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      if (!slug) {
        res.status(400).json({
          success: false,
          error: 'Service slug is required',
        });
        return;
      }

      const serviceDetail = await serviceService.getPublicServiceBySlug(slug);
      if (!serviceDetail) {
        res.status(404).json({
          success: false,
          error: `Service not found with slug: ${slug}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: serviceDetail,
      });
    } catch (error) {
      logger.error(`Failed to fetch service for slug '${req.params.slug}'`, 'ServiceController', error);
      res.status(503).json({
        success: false,
        error: 'Database service unavailable. Unable to load service details.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const serviceController = new ServiceController();
