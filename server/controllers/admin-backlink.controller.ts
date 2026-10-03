import { Request, Response } from 'express';
import {
  backlinkOpportunityService,
  BacklinkOpportunityOptions,
  BacklinkOutreachType,
  BacklinkPriority,
} from '../services/backlink-opportunity.service';
import { logger } from '../utils/logger';

export class AdminBacklinkController {
  /**
   * GET /api/admin/backlinks/opportunities
   * Returns prioritized backlink opportunity candidates based on GSC + catalog data.
   */
  async getOpportunities(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const minImpressions = req.query.minImpressions
        ? parseInt(req.query.minImpressions as string, 10)
        : undefined;
      const onlyStrikingDistance = req.query.onlyStrikingDistance === 'true';

      const validTypes: BacklinkOutreachType[] = [
        'striking_distance',
        'resource_guide',
        'statutory_citation',
        'commercial_intent',
        'unlinked_brand_mention',
      ];
      const outreachType = validTypes.includes(req.query.outreachType as any)
        ? (req.query.outreachType as BacklinkOutreachType)
        : undefined;

      const validPriorities: BacklinkPriority[] = ['HIGH', 'MEDIUM', 'LOW'];
      const priority = validPriorities.includes(req.query.priority as any)
        ? (req.query.priority as BacklinkPriority)
        : undefined;

      const options: BacklinkOpportunityOptions = {
        days: !isNaN(days!) ? days : undefined,
        limit: !isNaN(limit!) ? limit : undefined,
        minImpressions: !isNaN(minImpressions!) ? minImpressions : undefined,
        onlyStrikingDistance: onlyStrikingDistance ? true : undefined,
        outreachType,
        priority,
      };

      const result = await backlinkOpportunityService.generateOpportunities(options);

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Failed to generate backlink opportunities', 'AdminBacklinkController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate backlink opportunities',
      });
    }
  }
}

export const adminBacklinkController = new AdminBacklinkController();
