import { Request, Response } from 'express';
import { companySearchService } from '../services/company-search.service';
import { EntityType } from '../../src/types/company-search';
import { getDatabase } from '../config/database';
import { companyNameSearches } from '../../db/schema/company-search.schema';
import { logger } from '../utils/logger';

export class CompanySearchController {
  /**
   * POST /api/company-search/check
   * Evaluates proposed company name against MCA Rule 8 guidelines
   */
  async searchName(req: Request, res: Response): Promise<void> {
    try {
      const { name, entityType, activityCategory } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Company name is required for verification.',
        });
        return;
      }

      const validEntityTypes: EntityType[] = [
        'private_limited',
        'llp',
        'opc',
        'public_limited',
        'section_8',
      ];

      const selectedEntity: EntityType = validEntityTypes.includes(entityType)
        ? entityType
        : 'private_limited';

      const result = await companySearchService.evaluateName(
        name,
        selectedEntity,
        activityCategory
      );

      // Non-blocking persistence into search audit table
      try {
        const clientIp =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.socket.remoteAddress;

        const db = getDatabase();
        await db.insert(companyNameSearches).values({
          searchQuery: name.trim(),
          proposedName: result.fullProposedName,
          entityType: selectedEntity,
          isAvailable: result.isAvailable,
          availabilityScore: result.availabilityScore,
          ruleChecks: result.checks as any,
          similarNamesFound: result.similarRegisteredNames as any,
          ipAddress: clientIp,
        });
      } catch (dbErr) {
        // Non-fatal logging if database is offline or unmigrated
        logger.warn('Could not record company name search query to database (non-blocking)', 'CompanySearchController', dbErr);
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error evaluating company name availability', 'CompanySearchController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to check company name availability',
      });
    }
  }
}

export const companySearchController = new CompanySearchController();
