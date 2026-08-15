import { Request, Response } from 'express';
import { settingsRepository } from '../repositories/settings.repository';
import { logger } from '../utils/logger';

export class SettingsController {
  /**
   * GET /api/settings
   * Public read: Returns global website information and contact profile
   */
  async getPublicSettings(req: Request, res: Response): Promise<void> {
    try {
      const data = await settingsRepository.getSettings();
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      logger.error('Error in SettingsController.getPublicSettings', 'SettingsCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch website settings',
      });
    }
  }

  /**
   * GET /api/admin/settings
   * Admin read: Returns website settings configuration
   */
  async getAdminSettings(req: Request, res: Response): Promise<void> {
    try {
      const data = await settingsRepository.getSettings();
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      logger.error('Error in SettingsController.getAdminSettings', 'SettingsCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin website settings',
      });
    }
  }

  /**
   * PUT /api/admin/settings
   * Admin update: Save global website settings
   */
  async updateAdminSettings(req: Request, res: Response): Promise<void> {
    try {
      const authorUser = (req as any).user?.fullName || (req as any).user?.email || 'Admin';
      const updated = await settingsRepository.updateSettings(req.body, authorUser);

      res.json({
        success: true,
        message: 'Website settings saved successfully',
        data: updated,
      });
    } catch (err: any) {
      logger.error('Error in SettingsController.updateAdminSettings', 'SettingsCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update website settings',
      });
    }
  }
}

export const settingsController = new SettingsController();
