import { Request, Response, NextFunction } from 'express';
import { packageService } from '../services/package.service';
import { logger } from '../utils/logger';

export class PackageController {
  /**
   * GET /api/packages
   * Public endpoint to fetch active packages with features
   */
  async getPackages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const packages = await packageService.getPublicPackages();
      res.status(200).json({
        success: true,
        count: packages.length,
        data: packages,
      });
    } catch (error) {
      logger.error('Failed to fetch packages from database', 'PackageController', error);
      res.status(503).json({
        success: false,
        error: 'Database service unavailable. Unable to load packages.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/packages/matrix
   * Public endpoint to fetch comparison matrix data
   */
  async getMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matrix = await packageService.getPublicMatrix();
      res.status(200).json({
        success: true,
        data: matrix,
      });
    } catch (error) {
      logger.error('Failed to fetch matrix comparison data from database', 'PackageController', error);
      res.status(503).json({
        success: false,
        error: 'Database service unavailable. Unable to load comparison matrix.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/admin/packages
   * Admin endpoint to fetch ALL packages (active and inactive) with features
   */
  async getAdminPackages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const packages = await packageService.getAllPackagesForAdmin();
      res.status(200).json({
        success: true,
        count: packages.length,
        data: packages,
      });
    } catch (error) {
      logger.error('Admin: Failed to fetch packages', 'PackageController', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve packages.',
      });
    }
  }

  /**
   * POST /api/admin/packages
   * Admin endpoint to create a new package with features
   */
  async createPackage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const created = await packageService.createPackage(req.body, updatedBy);
      res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: created,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`Admin: Create package failed: ${msg}`, 'PackageController');

      const isConflict = msg.includes('already exists');
      const statusCode = isConflict ? 409 : 400;

      res.status(statusCode).json({
        success: false,
        error: msg,
      });
    }
  }

  /**
   * PUT /api/admin/packages/:id
   * Admin endpoint to update package metadata and replace features atomically
   */
  async updatePackage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const updated = await packageService.updatePackage(id, req.body, updatedBy);
      res.status(200).json({
        success: true,
        message: 'Package updated successfully',
        data: updated,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const statusCode = (error as any)?.statusCode || (msg.includes('not found') ? 404 : 400);

      logger.warn(`Admin: Update package failed [${req.params.id}]: ${msg}`, 'PackageController');
      res.status(statusCode).json({
        success: false,
        error: msg,
      });
    }
  }

  /**
   * PATCH /api/admin/packages/reorder
   * Admin endpoint to reorder packages in bulk
   */
  async reorderPackages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const reordered = await packageService.reorderPackages(req.body, updatedBy);
      res.status(200).json({
        success: true,
        message: 'Packages reordered successfully',
        data: reordered,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const statusCode = (error as any)?.statusCode || (msg.includes('not found') ? 404 : 400);

      logger.warn(`Admin: Reorder packages failed: ${msg}`, 'PackageController');
      res.status(statusCode).json({
        success: false,
        error: msg,
      });
    }
  }

  /**
   * PATCH /api/admin/packages/:id/status
   * Admin endpoint to activate/deactivate a package
   */
  async updatePackageStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body || {};
      const updatedBy = req.user?.email || req.user?.id || 'admin';
      const updated = await packageService.updatePackageStatus(id, isActive, updatedBy);
      res.status(200).json({
        success: true,
        message: `Package ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const statusCode = (error as any)?.statusCode || (msg.includes('not found') ? 404 : 400);

      logger.warn(`Admin: Update package status failed [${req.params.id}]: ${msg}`, 'PackageController');
      res.status(statusCode).json({
        success: false,
        error: msg,
      });
    }
  }

  /**
   * DELETE /api/admin/packages/:id
   * Admin endpoint to delete a package
   */
  async deletePackage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await packageService.deletePackage(id);
      res.status(200).json({
        success: true,
        message: 'Package deleted successfully',
        deletedId: id,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const statusCode = (error as any)?.statusCode || (msg.includes('not found') ? 404 : 400);

      logger.warn(`Admin: Delete package failed [${req.params.id}]: ${msg}`, 'PackageController');
      res.status(statusCode).json({
        success: false,
        error: msg,
      });
    }
  }
}

export const packageController = new PackageController();

