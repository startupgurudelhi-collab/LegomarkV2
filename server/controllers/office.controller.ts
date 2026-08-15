import { Request, Response, NextFunction } from 'express';
import { officeService } from '../services/office.service';
import { logger } from '../utils/logger';

export class OfficeController {
  /**
   * GET /api/office
   * Public endpoint to fetch active office profile
   */
  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await officeService.getPublicProfile();
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error('Failed to fetch office profile', 'OfficeController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load office profile',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/admin/office
   * Admin endpoint to fetch office profile
   */
  async getAdminProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await officeService.getAdminProfile();
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error('Failed to fetch admin office profile', 'OfficeController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load office profile for admin',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * PUT /api/admin/office
   * Admin endpoint to update office profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).adminUser;
      const updatedBy = user?.fullName || user?.email || 'admin';
      const updated = await officeService.updateProfile(req.body, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Office profile updated successfully',
        data: updated,
      });
    } catch (error) {
      logger.error('Failed to update office profile', 'OfficeController', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update office profile',
      });
    }
  }
}

export const officeController = new OfficeController();
