import { Request, Response } from 'express';
import { associationLogoRepository } from '../repositories/association-logo.repository';
import { logger } from '../utils/logger';

export class AssociationLogoController {
  /**
   * GET /api/association-logos
   * Public: List all active association logos
   */
  async getPublicLogos(req: Request, res: Response): Promise<void> {
    try {
      const logos = await associationLogoRepository.getPublicLogos();
      res.json({
        success: true,
        data: logos,
      });
    } catch (err: any) {
      logger.error('Error in AssociationLogoController.getPublicLogos', 'AssociationLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch association logos',
      });
    }
  }

  /**
   * GET /api/admin/association-logos
   * Admin: List all association logos
   */
  async getAdminLogos(req: Request, res: Response): Promise<void> {
    try {
      const logos = await associationLogoRepository.getAllLogos();
      res.json({
        success: true,
        data: logos,
      });
    } catch (err: any) {
      logger.error('Error in AssociationLogoController.getAdminLogos', 'AssociationLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch admin association logos',
      });
    }
  }

  /**
   * POST /api/admin/association-logos
   * Admin: Create a new association logo record
   */
  async createLogo(req: Request, res: Response): Promise<void> {
    try {
      const { name, logoUrl, category, isActive, displayOrder } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({
          success: false,
          error: 'Association or Organization Name is required',
        });
        return;
      }

      const authorUser = (req as any).user?.username || (req as any).user?.email || 'Admin';

      const created = await associationLogoRepository.createLogo(
        {
          name: name.trim(),
          logoUrl: (logoUrl || '').trim(),
          category: category ? category.trim() : 'Professional Association',
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        },
        authorUser
      );

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (err: any) {
      logger.error('Error in AssociationLogoController.createLogo', 'AssociationLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to create association logo',
      });
    }
  }

  /**
   * PUT /api/admin/association-logos/:id
   * Admin: Update an existing association logo
   */
  async updateLogo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, logoUrl, category, isActive, displayOrder } = req.body;

      const authorUser = (req as any).user?.username || (req as any).user?.email || 'Admin';

      const updated = await associationLogoRepository.updateLogo(
        id,
        {
          name: name !== undefined ? name.trim() : undefined,
          logoUrl: logoUrl !== undefined ? logoUrl.trim() : undefined,
          category: category !== undefined ? category.trim() : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        },
        authorUser
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Association logo not found',
        });
        return;
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      logger.error('Error in AssociationLogoController.updateLogo', 'AssociationLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update association logo',
      });
    }
  }

  /**
   * DELETE /api/admin/association-logos/:id
   * Admin: Delete an association logo
   */
  async deleteLogo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await associationLogoRepository.deleteLogo(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Association logo not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Association logo deleted successfully',
      });
    } catch (err: any) {
      logger.error('Error in AssociationLogoController.deleteLogo', 'AssociationLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to delete association logo',
      });
    }
  }

  /**
   * PATCH /api/admin/association-logos/reorder
   * Admin: Reorder association logos
   */
  async reorderLogos(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;

      if (!Array.isArray(items)) {
        res.status(400).json({
          success: false,
          error: 'Array of items with id and displayOrder is required',
        });
        return;
      }

      await associationLogoRepository.reorderLogos(items);

      res.json({
        success: true,
        message: 'Association logos reordered successfully',
      });
    } catch (err: any) {
      logger.error('Error in AssociationLogoController.reorderLogos', 'AssociationLogoCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to reorder association logos',
      });
    }
  }
}

export const associationLogoController = new AssociationLogoController();
