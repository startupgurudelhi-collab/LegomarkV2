import { Request, Response } from 'express';
import { servicePackageRepository } from '../repositories/service-package.repository';
import { logger } from '../utils/logger';

export class AdminServicePackageController {
  /**
   * GET /api/admin/services/:serviceId/packages
   */
  async getServicePackages(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const list = await servicePackageRepository.getServicePackages(serviceId);
      res.status(200).json({
        success: true,
        count: list.length,
        data: list,
      });
    } catch (error) {
      logger.error('Failed to get service packages', 'AdminServicePackageController', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service packages',
      });
    }
  }

  /**
   * GET /api/admin/services/:serviceId/packages/:packageId
   */
  async getServicePackageById(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId, packageId } = req.params;
      const pkg = await servicePackageRepository.getServicePackageById(serviceId, packageId);
      if (!pkg) {
        res.status(404).json({
          success: false,
          error: `Package '${packageId}' not found for service '${serviceId}'`,
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: pkg,
      });
    } catch (error) {
      logger.error('Failed to get service package by ID', 'AdminServicePackageController', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service package',
      });
    }
  }

  /**
   * POST /api/admin/services/:serviceId/packages
   */
  async assignPackage(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const result = await servicePackageRepository.assignPackage(serviceId, req.body, updatedBy);
      res.status(201).json({
        success: true,
        message: 'Package assigned to service successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to assign package to service', 'AdminServicePackageController', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign package to service',
      });
    }
  }

  /**
   * PUT /api/admin/services/:serviceId/packages/:packageId
   * Updates package configuration & deliverables for THIS service ONLY
   */
  async updateServicePackage(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId, packageId } = req.params;
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const updated = await servicePackageRepository.updateServicePackage(serviceId, packageId, req.body, updatedBy);
      res.status(200).json({
        success: true,
        message: 'Service package updated successfully',
        data: updated,
      });
    } catch (error) {
      logger.error('Failed to update service package', 'AdminServicePackageController', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update service package',
      });
    }
  }

  /**
   * PATCH /api/admin/services/:serviceId/packages/:packageId/status
   */
  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId, packageId } = req.params;
      const { isActive } = req.body;
      const updated = await servicePackageRepository.toggleServicePackageStatus(
        serviceId,
        packageId,
        Boolean(isActive)
      );
      res.status(200).json({
        success: true,
        message: `Package status set to ${Boolean(isActive) ? 'active' : 'inactive'}`,
        data: updated,
      });
    } catch (error) {
      logger.error('Failed to toggle service package status', 'AdminServicePackageController', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update package status',
      });
    }
  }

  /**
   * PATCH /api/admin/services/:serviceId/packages/reorder
   */
  async reorderPackages(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const { items } = req.body;
      if (!Array.isArray(items)) {
        res.status(400).json({
          success: false,
          error: 'Missing or invalid items array for reordering',
        });
        return;
      }
      await servicePackageRepository.reorderServicePackages(serviceId, items);
      res.status(200).json({
        success: true,
        message: 'Packages reordered successfully for this service',
      });
    } catch (error) {
      logger.error('Failed to reorder service packages', 'AdminServicePackageController', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder packages',
      });
    }
  }

  /**
   * DELETE /api/admin/services/:serviceId/packages/:packageId
   */
  async deleteServicePackage(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId, packageId } = req.params;
      await servicePackageRepository.deleteServicePackage(serviceId, packageId);
      res.status(200).json({
        success: true,
        message: `Package '${packageId}' unassigned from service '${serviceId}'`,
      });
    } catch (error) {
      logger.error('Failed to unassign service package', 'AdminServicePackageController', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unassign package from service',
      });
    }
  }
}

export const adminServicePackageController = new AdminServicePackageController();
