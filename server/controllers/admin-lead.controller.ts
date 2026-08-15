import { Request, Response } from 'express';
import { leadRepository, LeadStatus } from '../repositories/lead.repository';
import { logger } from '../utils/logger';

const VALID_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'CLOSED'];

export class AdminLeadController {
  /**
   * GET /api/admin/leads
   * Returns list of leads with filters, pagination, and summary stats
   */
  async getLeads(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, service, dateRange, page, limit, sortBy, sortOrder } = req.query;

      const result = await leadRepository.getLeads({
        search: search as string,
        status: status as string,
        service: service as string,
        dateRange: dateRange as 'all' | 'today' | '7d' | '30d',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as 'createdAt' | 'fullName' | 'status',
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        data: result.leads,
        total: result.total,
        stats: result.stats,
      });
    } catch (err: any) {
      logger.error('Error in AdminLeadController.getLeads', 'AdminLeadCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leads from repository',
      });
    }
  }

  /**
   * GET /api/admin/leads/stats
   * Returns aggregate lead counts (Total, New, Contacted, In Progress, Converted, Closed)
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await leadRepository.getLeadStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (err: any) {
      logger.error('Error in AdminLeadController.getStats', 'AdminLeadCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate lead statistics',
      });
    }
  }

  /**
   * GET /api/admin/leads/:id
   * Returns details for a single lead
   */
  async getLeadById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const lead = await leadRepository.getLeadById(id);

      if (!lead) {
        res.status(404).json({
          success: false,
          error: 'Lead record not found',
        });
        return;
      }

      res.json({
        success: true,
        data: lead,
      });
    } catch (err: any) {
      logger.error(`Error in AdminLeadController.getLeadById for ${req.params.id}`, 'AdminLeadCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve lead details',
      });
    }
  }

  /**
   * PATCH /api/admin/leads/:id/status
   * Updates workflow status
   */
  async updateLeadStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
        return;
      }

      const updatedBy = (req as any).user?.fullName || (req as any).user?.email || 'Admin';
      const updated = await leadRepository.updateLeadStatus(id, status.toUpperCase() as LeadStatus, updatedBy);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Lead record not found',
        });
        return;
      }

      logger.info(`Lead ${id} status updated to ${status.toUpperCase()} by ${updatedBy}`, 'AdminLeadCtrl');

      res.json({
        success: true,
        message: 'Lead status updated successfully',
        data: updated,
      });
    } catch (err: any) {
      logger.error(`Error in AdminLeadController.updateLeadStatus for ${req.params.id}`, 'AdminLeadCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update lead status',
      });
    }
  }

  /**
   * PATCH /api/admin/leads/:id/notes
   * Updates internal admin notes
   */
  async updateLeadNotes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (notes === undefined || notes === null) {
        res.status(400).json({
          success: false,
          error: 'Notes content is required',
        });
        return;
      }

      const updatedBy = (req as any).user?.fullName || (req as any).user?.email || 'Admin';
      const updated = await leadRepository.updateLeadNotes(id, String(notes), updatedBy);

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Lead record not found',
        });
        return;
      }

      logger.info(`Admin notes updated for lead ${id} by ${updatedBy}`, 'AdminLeadCtrl');

      res.json({
        success: true,
        message: 'Internal admin notes saved',
        data: updated,
      });
    } catch (err: any) {
      logger.error(`Error in AdminLeadController.updateLeadNotes for ${req.params.id}`, 'AdminLeadCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to save admin notes',
      });
    }
  }

  /**
   * DELETE /api/admin/leads/:id
   * Deletes a lead record
   */
  async deleteLead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await leadRepository.deleteLead(id);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Lead not found or already deleted',
        });
        return;
      }

      logger.info(`Lead ${id} deleted by ${(req as any).user?.email || 'Admin'}`, 'AdminLeadCtrl');

      res.json({
        success: true,
        message: 'Lead record removed successfully',
      });
    } catch (err: any) {
      logger.error(`Error in AdminLeadController.deleteLead for ${req.params.id}`, 'AdminLeadCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to delete lead record',
      });
    }
  }
}

export const adminLeadController = new AdminLeadController();
