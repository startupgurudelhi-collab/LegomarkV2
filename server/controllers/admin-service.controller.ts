import { Request, Response } from 'express';
import { adminServiceService } from '../services/admin-service.service';
import { logger } from '../utils/logger';

export class AdminServiceController {
  /**
   * GET /api/admin/services
   * Returns all services with joined categories and relational child counts
   */
  async getAllServices(req: Request, res: Response): Promise<void> {
    try {
      const services = await adminServiceService.getAllServices();
      res.json({
        success: true,
        data: services,
        meta: {
          total: services.length,
          active: services.filter((s) => s.isActive).length,
          inactive: services.filter((s) => !s.isActive).length,
        },
      });
    } catch (error: any) {
      logger.error('Error in AdminServiceController.getAllServices', 'AdminServiceController', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch admin services',
      });
    }
  }

  /**
   * GET /api/admin/services/:id
   * Fetch single service details
   */
  async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const service = await adminServiceService.getServiceById(id);
      if (!service) {
        res.status(404).json({
          success: false,
          error: `Service not found with ID '${id}'`,
        });
        return;
      }
      res.json({
        success: true,
        data: service,
      });
    } catch (error: any) {
      logger.error('Error in AdminServiceController.getServiceById', 'AdminServiceController', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to fetch service',
      });
    }
  }

  /**
   * POST /api/admin/services
   * Create a new service
   */
  async createService(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = (req as any).user?.email || 'admin@legomark.in';
      const created = await adminServiceService.createService(req.body, adminEmail);
      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: created,
      });
    } catch (error: any) {
      logger.error('Error in AdminServiceController.createService', 'AdminServiceController', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to create service',
      });
    }
  }

  /**
   * PUT /api/admin/services/:id
   * Update service metadata
   */
  async updateService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminEmail = (req as any).user?.email || 'admin@legomark.in';
      const updated = await adminServiceService.updateService(id, req.body, adminEmail);
      res.json({
        success: true,
        message: 'Service updated successfully',
        data: updated,
      });
    } catch (error: any) {
      logger.error('Error in AdminServiceController.updateService', 'AdminServiceController', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to update service',
      });
    }
  }

  /**
   * PATCH /api/admin/services/:id/status
   * Toggle service active/inactive status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminEmail = (req as any).user?.email || 'admin@legomark.in';
      const updated = await adminServiceService.updateStatus(id, req.body, adminEmail);
      res.json({
        success: true,
        message: `Service ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
      });
    } catch (error: any) {
      logger.error('Error in AdminServiceController.updateStatus', 'AdminServiceController', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to update service status',
      });
    }
  }

  /**
   * PATCH /api/admin/services/reorder
   * Reorder services in one atomic transaction
   */
  async reorderServices(req: Request, res: Response): Promise<void> {
    try {
      const adminEmail = (req as any).user?.email || 'admin@legomark.in';
      const updatedList = await adminServiceService.reorderServices(req.body, adminEmail);
      res.json({
        success: true,
        message: 'Services reordered successfully',
        data: updatedList,
      });
    } catch (error: any) {
      logger.error('Error in AdminServiceController.reorderServices', 'AdminServiceController', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to reorder services',
      });
    }
  }

  /**
   * DELETE /api/admin/services/:id
   * Delete a service safely
   */
  async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await adminServiceService.deleteService(id);
      res.json({
        success: true,
        message: `Service '${id}' deleted successfully`,
      });
    } catch (error: any) {
      logger.error('Error in AdminServiceController.deleteService', 'AdminServiceController', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to delete service',
      });
    }
  }
}

export const adminServiceController = new AdminServiceController();
