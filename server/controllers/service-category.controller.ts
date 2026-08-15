import { Request, Response, NextFunction } from 'express';
import { serviceCategoryService } from '../services/service-category.service';
import { logger } from '../utils/logger';

export class ServiceCategoryController {
  /**
   * GET /api/admin/service-categories
   * Protected endpoint to return all categories (active & inactive) with dynamic serviceCount
   */
  async getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await serviceCategoryService.getAllCategories();
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (error) {
      logger.error('Admin: Failed to fetch categories', 'ServiceCategoryController', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve categories.',
      });
    }
  }

  /**
   * POST /api/admin/service-categories
   * Protected endpoint to create a new category
   */
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const created = await serviceCategoryService.createCategory(req.body, updatedBy);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: created,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      logger.warn(`Admin: Create category failed: ${error.message}`, 'ServiceCategoryController');
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/service-categories/:id
   * Protected endpoint to update category metadata (ID cannot be altered)
   */
  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const updated = await serviceCategoryService.updateCategory(id, req.body, updatedBy);
      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: updated,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      logger.warn(`Admin: Update category '${req.params.id}' failed: ${error.message}`, 'ServiceCategoryController');
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PATCH /api/admin/service-categories/:id/status
   * Protected endpoint to toggle active / inactive status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const updated = await serviceCategoryService.updateStatus(id, req.body, updatedBy);
      res.status(200).json({
        success: true,
        message: `Category ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      logger.warn(`Admin: Update category status '${req.params.id}' failed: ${error.message}`, 'ServiceCategoryController');
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PATCH /api/admin/service-categories/reorder
   * Protected endpoint to bulk reorder categories in a single transaction
   */
  async reorderCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const reordered = await serviceCategoryService.reorderCategories(req.body, updatedBy);
      res.status(200).json({
        success: true,
        message: 'Categories reordered successfully',
        data: reordered,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      logger.warn(`Admin: Reorder categories failed: ${error.message}`, 'ServiceCategoryController');
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/admin/service-categories/:id
   * Protected endpoint to safely delete category if no services are attached
   */
  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await serviceCategoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 400;
      logger.warn(`Admin: Delete category '${req.params.id}' failed: ${error.message}`, 'ServiceCategoryController');
      res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const serviceCategoryController = new ServiceCategoryController();
