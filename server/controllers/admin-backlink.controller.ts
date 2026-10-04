import { Request, Response } from 'express';
import {
  backlinkOpportunityService,
  BacklinkOpportunityOptions,
  BacklinkOutreachType,
  BacklinkPriority,
} from '../services/backlink-opportunity.service';
import {
  backlinkTrackerRepository,
  BacklinkTrackerFilterOptions,
} from '../repositories/backlink-tracker.repository';
import { backlinkVerificationService } from '../services/backlink-verification.service';
import {
  TrackedBacklinkStatus,
  TrackedBacklinkLinkType,
  NewTrackedBacklink,
} from '../../db/schema/index';
import { logger } from '../utils/logger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

function isValidHttpUrl(urlString: unknown): boolean {
  if (typeof urlString !== 'string' || !urlString.trim()) return false;
  try {
    const parsed = new URL(urlString.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidTargetUrl(urlString: unknown): boolean {
  if (typeof urlString !== 'string' || !urlString.trim()) return false;
  const trimmed = urlString.trim();
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const VALID_STATUSES: TrackedBacklinkStatus[] = ['active', 'lost', 'pending', 'broken'];
const VALID_LINK_TYPES: TrackedBacklinkLinkType[] = ['dofollow', 'nofollow', 'ugc', 'sponsored'];

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

  /**
   * GET /api/admin/backlinks/tracked
   * Retrieves tracked backlinks, optional filtering, and aggregate summary.
   */
  async getTracked(req: Request, res: Response): Promise<void> {
    try {
      const { status, linkType, targetUrl, sourceDomain, search } = req.query;

      if (status && !VALID_STATUSES.includes(status as any)) {
        res.status(400).json({
          success: false,
          error: `Invalid status filter. Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
        return;
      }

      if (linkType && !VALID_LINK_TYPES.includes(linkType as any)) {
        res.status(400).json({
          success: false,
          error: `Invalid linkType filter. Allowed values: ${VALID_LINK_TYPES.join(', ')}`,
        });
        return;
      }

      const filterOptions: BacklinkTrackerFilterOptions = {
        status: status ? (status as TrackedBacklinkStatus) : undefined,
        linkType: linkType ? (linkType as TrackedBacklinkLinkType) : undefined,
        targetUrl: typeof targetUrl === 'string' ? targetUrl : undefined,
        sourceDomain: typeof sourceDomain === 'string' ? sourceDomain : undefined,
        search: typeof search === 'string' ? search : undefined,
      };

      const backlinks = await backlinkTrackerRepository.getAll(filterOptions);
      const summary = await backlinkTrackerRepository.getSummary();

      res.json({
        success: true,
        data: {
          backlinks,
          summary,
        },
      });
    } catch (err: any) {
      logger.error('Failed to get tracked backlinks', 'AdminBacklinkController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to retrieve tracked backlinks',
      });
    }
  }

  /**
   * POST /api/admin/backlinks/tracked
   * Creates a new tracked backlink record.
   */
  async createTracked(req: Request, res: Response): Promise<void> {
    try {
      const {
        sourceUrl,
        targetUrl,
        sourceDomain,
        anchorText,
        linkType,
        status,
        outreachType,
        opportunityId,
        notes,
      } = req.body;

      if (!sourceUrl || typeof sourceUrl !== 'string' || !sourceUrl.trim()) {
        res.status(400).json({
          success: false,
          error: 'sourceUrl is required and cannot be empty',
        });
        return;
      }

      if (!isValidHttpUrl(sourceUrl)) {
        res.status(400).json({
          success: false,
          error: 'sourceUrl must be a valid HTTP or HTTPS URL',
        });
        return;
      }

      if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
        res.status(400).json({
          success: false,
          error: 'targetUrl is required and cannot be empty',
        });
        return;
      }

      if (!isValidTargetUrl(targetUrl)) {
        res.status(400).json({
          success: false,
          error: 'targetUrl must be a valid HTTP/HTTPS URL or root-relative path starting with /',
        });
        return;
      }

      if (linkType && !VALID_LINK_TYPES.includes(linkType)) {
        res.status(400).json({
          success: false,
          error: `Invalid linkType. Allowed values: ${VALID_LINK_TYPES.join(', ')}`,
        });
        return;
      }

      if (status && !VALID_STATUSES.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
        return;
      }

      const record = await backlinkTrackerRepository.create({
        sourceUrl: sourceUrl.trim(),
        targetUrl: targetUrl.trim(),
        sourceDomain: typeof sourceDomain === 'string' && sourceDomain.trim() ? sourceDomain.trim() : undefined,
        anchorText: typeof anchorText === 'string' && anchorText.trim() ? anchorText.trim() : null,
        linkType: linkType || 'dofollow',
        status: status || 'active',
        outreachType: typeof outreachType === 'string' && outreachType.trim() ? outreachType.trim() : null,
        opportunityId: typeof opportunityId === 'string' && opportunityId.trim() ? opportunityId.trim() : null,
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      });

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (err: any) {
      logger.error('Failed to create tracked backlink', 'AdminBacklinkController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to create tracked backlink',
      });
    }
  }

  /**
   * PUT /api/admin/backlinks/tracked/:id
   * Updates an existing tracked backlink by ID.
   */
  async updateTracked(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid backlink ID format. Expected a valid UUID.',
        });
        return;
      }

      const existing = await backlinkTrackerRepository.getById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Tracked backlink with ID "${id}" not found`,
        });
        return;
      }

      const {
        sourceUrl,
        targetUrl,
        sourceDomain,
        anchorText,
        linkType,
        status,
        httpStatus,
        isVerified,
        outreachType,
        opportunityId,
        notes,
      } = req.body;

      if (sourceUrl !== undefined) {
        if (!isValidHttpUrl(sourceUrl)) {
          res.status(400).json({
            success: false,
            error: 'sourceUrl must be a valid HTTP or HTTPS URL',
          });
          return;
        }
      }

      if (targetUrl !== undefined) {
        if (!isValidTargetUrl(targetUrl)) {
          res.status(400).json({
            success: false,
            error: 'targetUrl must be a valid HTTP/HTTPS URL or root-relative path starting with /',
          });
          return;
        }
      }

      if (linkType !== undefined && !VALID_LINK_TYPES.includes(linkType)) {
        res.status(400).json({
          success: false,
          error: `Invalid linkType. Allowed values: ${VALID_LINK_TYPES.join(', ')}`,
        });
        return;
      }

      if (status !== undefined && !VALID_STATUSES.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
        });
        return;
      }

      const patch: Partial<NewTrackedBacklink> = {};
      if (sourceUrl !== undefined) patch.sourceUrl = sourceUrl.trim();
      if (targetUrl !== undefined) patch.targetUrl = targetUrl.trim();
      if (sourceDomain !== undefined) patch.sourceDomain = sourceDomain.trim();
      if (anchorText !== undefined) patch.anchorText = anchorText ? anchorText.trim() : null;
      if (linkType !== undefined) patch.linkType = linkType;
      if (status !== undefined) patch.status = status;
      if (httpStatus !== undefined) patch.httpStatus = typeof httpStatus === 'number' ? httpStatus : null;
      if (isVerified !== undefined) patch.isVerified = Boolean(isVerified);
      if (outreachType !== undefined) patch.outreachType = outreachType ? outreachType.trim() : null;
      if (opportunityId !== undefined) patch.opportunityId = opportunityId ? opportunityId.trim() : null;
      if (notes !== undefined) patch.notes = notes ? notes.trim() : null;

      const updated = await backlinkTrackerRepository.update(id, patch);

      res.json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      logger.error(`Failed to update tracked backlink [${req.params.id}]`, 'AdminBacklinkController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to update tracked backlink',
      });
    }
  }

  /**
   * DELETE /api/admin/backlinks/tracked/:id
   * Deletes a tracked backlink by ID.
   */
  async deleteTracked(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid backlink ID format. Expected a valid UUID.',
        });
        return;
      }

      const existing = await backlinkTrackerRepository.getById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Tracked backlink with ID "${id}" not found`,
        });
        return;
      }

      await backlinkTrackerRepository.delete(id);

      res.json({
        success: true,
        data: {
          id,
          deleted: true,
        },
      });
    } catch (err: any) {
      logger.error(`Failed to delete tracked backlink [${req.params.id}]`, 'AdminBacklinkController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete tracked backlink',
      });
    }
  }

  /**
   * POST /api/admin/backlinks/tracked/:id/verify
   * Triggers live crawler verification for a single tracked backlink.
   */
  async verifyTracked(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid backlink ID format. Expected a valid UUID.',
        });
        return;
      }

      const existing = await backlinkTrackerRepository.getById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Tracked backlink with ID "${id}" not found`,
        });
        return;
      }

      const verified = await backlinkVerificationService.verifyBacklink(id);

      res.json({
        success: true,
        data: verified,
      });
    } catch (err: any) {
      logger.error(`Failed to verify tracked backlink [${req.params.id}]`, 'AdminBacklinkController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to verify tracked backlink',
      });
    }
  }

  /**
   * POST /api/admin/backlinks/tracked/verify-all
   * Triggers batch verification across tracked backlinks within specified limits (1–100).
   */
  async verifyAllTracked(req: Request, res: Response): Promise<void> {
    try {
      let limit = 50;
      const rawLimit = req.body?.limit ?? req.query?.limit;

      if (rawLimit !== undefined) {
        const parsed = typeof rawLimit === 'number' ? rawLimit : parseInt(String(rawLimit), 10);
        if (isNaN(parsed) || parsed < 1 || parsed > 100) {
          res.status(400).json({
            success: false,
            error: 'Verification batch limit must be an integer between 1 and 100.',
          });
          return;
        }
        limit = parsed;
      }

      const summary = await backlinkVerificationService.verifyAll(limit);

      res.json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      logger.error('Failed to run batch backlink verification', 'AdminBacklinkController', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to complete batch backlink verification',
      });
    }
  }
}

export const adminBacklinkController = new AdminBacklinkController();
