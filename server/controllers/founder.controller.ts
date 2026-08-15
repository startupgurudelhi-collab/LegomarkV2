import { Request, Response, NextFunction } from 'express';
import { founderService } from '../services/founder.service';
import { logger } from '../utils/logger';

export class FounderController {
  /**
   * GET /api/founder
   * Public endpoint to fetch active founder profile
   */
  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await founderService.getPublicProfile();
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error('Failed to fetch founder profile', 'FounderController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load founder profile',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * GET /api/admin/founder
   * Admin endpoint to fetch founder profile
   */
  async getAdminProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await founderService.getAdminProfile();
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error('Failed to fetch admin founder profile', 'FounderController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load founder profile for admin',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * PUT /api/admin/founder
   * Admin endpoint to update founder profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).adminUser;
      const updatedBy = user?.fullName || user?.email || 'admin';
      const updated = await founderService.updateProfile(req.body, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Founder profile updated successfully',
        data: updated,
      });
    } catch (error) {
      logger.error('Failed to update founder profile', 'FounderController', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update founder profile',
      });
    }
  }
}

export const founderController = new FounderController();
