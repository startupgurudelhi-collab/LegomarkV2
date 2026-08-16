import { Request, Response } from 'express';
import { clientLogoRepository } from '../repositories/client-logo.repository';
import { logger } from '../utils/logger';

export class ClientLogoController {
  /**
   * GET /api/client-logos
   * Public: List all active client logos
   */
  async getPublicLogos(req: Request, res: Response): Promise<void> {
    try {
      const logos = await clientLogoRepository.getPublicLogos();
      res.json({
        success: true,
        data: logos,
      });
    } catch (err: any) {
      logger.error('Error in ClientLogoController.getPublicLogos', 'ClientLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch client logos',
      });
    }
  }

  /**
   * GET /api/admin/client-logos
   * Admin: List all client logos
   */
  async getAdminLogos(req: Request, res: Response): Promise<void> {
    try {
      const logos = await clientLogoRepository.getAllLogos();
      res.json({
        success: true,
        data: logos,
      });
    } catch (err: any) {
      logger.error('Error in ClientLogoController.getAdminLogos', 'ClientLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin client logos',
      });
    }
  }

  /**
   * POST /api/admin/client-logos
   * Admin: Create a new client logo record
   */
  async createLogo(req: Request, res: Response): Promise<void> {
    try {
      const { name, logoUrl, category, isActive, displayOrder } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          error: 'Client or Company Name is required',
        });
        return;
      }

      const authorUser = (req as any).user?.fullName || (req as any).user?.email || 'Admin';

      const newLogo = await clientLogoRepository.createLogo(
        {
          name,
          logoUrl: logoUrl || '',
          category,
          isActive,
          displayOrder,
        },
        authorUser
      );

      res.status(201).json({
        success: true,
        message: 'Client logo created successfully',
        data: newLogo,
      });
    } catch (err: any) {
      logger.error('Error in ClientLogoController.createLogo', 'ClientLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to create client logo',
      });
    }
  }

  /**
   * PUT /api/admin/client-logos/:id
   * Admin: Update an existing client logo record
   */
  async updateLogo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authorUser = (req as any).user?.fullName || (req as any).user?.email || 'Admin';

      const updated = await clientLogoRepository.updateLogo(id, req.body, authorUser);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Client logo not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Client logo updated successfully',
        data: updated,
      });
    } catch (err: any) {
      logger.error(`Error in ClientLogoController.updateLogo for ${req.params.id}`, 'ClientLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update client logo',
      });
    }
  }

  /**
   * DELETE /api/admin/client-logos/:id
   * Admin: Delete a client logo record
   */
  async deleteLogo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await clientLogoRepository.deleteLogo(id);

      res.json({
        success: true,
        message: success ? 'Client logo deleted successfully' : 'Client logo removed',
      });
    } catch (err: any) {
      logger.error(`Error in ClientLogoController.deleteLogo for ${req.params.id}`, 'ClientLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to delete client logo',
      });
    }
  }

  /**
   * PATCH /api/admin/client-logos/reorder
   * Admin: Reorder client logos
   */
  async reorderLogos(req: Request, res: Response): Promise<void> {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        res.status(400).json({
          success: false,
          error: 'orderedIds must be an array of logo IDs',
        });
        return;
      }

      const authorUser = (req as any).user?.fullName || (req as any).user?.email || 'Admin';
      const updatedList = await clientLogoRepository.reorderLogos(orderedIds, authorUser);

      res.json({
        success: true,
        message: 'Client logos reordered successfully',
        data: updatedList,
      });
    } catch (err: any) {
      logger.error('Error in ClientLogoController.reorderLogos', 'ClientLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to reorder client logos',
      });
    }
  }
}

export const clientLogoController = new ClientLogoController();
