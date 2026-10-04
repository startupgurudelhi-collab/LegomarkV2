import { eq, desc, and } from 'drizzle-orm';
import crypto from 'crypto';
import { getDatabase, pingDatabase } from '../config/database';
import {
  trackedBacklinks,
  TrackedBacklink,
  NewTrackedBacklink,
  TrackedBacklinkStatus,
  TrackedBacklinkLinkType,
} from '../../db/schema/index';
import { logger } from '../utils/logger';

export interface BacklinkTrackerFilterOptions {
  status?: TrackedBacklinkStatus;
  targetUrl?: string;
  sourceDomain?: string;
  linkType?: TrackedBacklinkLinkType;
  search?: string;
}

export interface TrackedBacklinksSummaryStats {
  total: number;
  active: number;
  pending: number;
  lost: number;
  broken: number;
  dofollow: number;
  nofollow: number;
  verified: number;
}

/**
 * LACS Module #22: Backlink Tracker Repository
 * Handles persistent storage and fallback in-memory state for external tracked backlinks.
 * Starts empty and stores only backlinks explicitly created by the admin.
 */
export class BacklinkTrackerRepository {
  private fallbackStore: TrackedBacklink[] = [];

  /**
   * Retrieves all tracked backlinks, optionally filtered.
   */
  async getAll(options: BacklinkTrackerFilterOptions = {}): Promise<TrackedBacklink[]> {
    const dbStatus = await pingDatabase();
    let records: TrackedBacklink[] = [];

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        records = await db
          .select()
          .from(trackedBacklinks)
          .orderBy(desc(trackedBacklinks.createdAt));

        this.fallbackStore = records;
      } catch (err) {
        logger.error('Error fetching tracked backlinks from database', 'BacklinkTrackerRepo', err);
        records = [...this.fallbackStore];
      }
    } else {
      records = [...this.fallbackStore];
    }

    // Apply filtering
    if (options.status) {
      records = records.filter((r) => r.status === options.status);
    }
    if (options.linkType) {
      records = records.filter((r) => r.linkType === options.linkType);
    }
    if (options.targetUrl && options.targetUrl.trim() !== '') {
      const target = options.targetUrl.trim().toLowerCase();
      records = records.filter((r) => r.targetUrl.toLowerCase().includes(target));
    }
    if (options.sourceDomain && options.sourceDomain.trim() !== '') {
      const domain = options.sourceDomain.trim().toLowerCase();
      records = records.filter((r) => r.sourceDomain.toLowerCase().includes(domain));
    }
    if (options.search && options.search.trim() !== '') {
      const q = options.search.trim().toLowerCase();
      records = records.filter(
        (r) =>
          r.sourceUrl.toLowerCase().includes(q) ||
          r.targetUrl.toLowerCase().includes(q) ||
          r.sourceDomain.toLowerCase().includes(q) ||
          (r.anchorText && r.anchorText.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    return records;
  }

  /**
   * Retrieves a single tracked backlink by its unique UUID.
   */
  async getById(id: string): Promise<TrackedBacklink | null> {
    const cleanId = id.trim();
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(trackedBacklinks)
          .where(eq(trackedBacklinks.id, cleanId))
          .limit(1);

        if (rows && rows.length > 0) {
          return rows[0];
        }
      } catch (err) {
        logger.error(`Error fetching tracked backlink by ID [${cleanId}]`, 'BacklinkTrackerRepo', err);
      }
    }

    const fallback = this.fallbackStore.find((r) => r.id === cleanId);
    return fallback || null;
  }

  /**
   * Persists a new tracked backlink record.
   */
  async create(input: NewTrackedBacklink): Promise<TrackedBacklink> {
    const now = new Date();
    const id = input.id || crypto.randomUUID();

    const record: TrackedBacklink = {
      id,
      sourceUrl: input.sourceUrl.trim(),
      sourceDomain: input.sourceDomain ? input.sourceDomain.trim().toLowerCase() : this.extractDomain(input.sourceUrl),
      targetUrl: input.targetUrl.trim(),
      anchorText: input.anchorText ? input.anchorText.trim() : null,
      linkType: input.linkType || 'dofollow',
      status: input.status || 'active',
      httpStatus: input.httpStatus !== undefined ? input.httpStatus : null,
      isVerified: input.isVerified !== undefined ? input.isVerified : false,
      lastCheckedAt: input.lastCheckedAt || null,
      outreachType: input.outreachType || null,
      opportunityId: input.opportunityId || null,
      notes: input.notes || null,
      createdAt: input.createdAt || now,
      updatedAt: input.updatedAt || now,
    };

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db.insert(trackedBacklinks).values(record).returning();
        if (rows && rows.length > 0) {
          this.fallbackStore.unshift(rows[0]);
          return rows[0];
        }
      } catch (err) {
        logger.error('Error inserting tracked backlink to database', 'BacklinkTrackerRepo', err);
      }
    }

    this.fallbackStore.unshift(record);
    return record;
  }

  /**
   * Updates an existing tracked backlink by ID.
   */
  async update(id: string, patch: Partial<NewTrackedBacklink>): Promise<TrackedBacklink | null> {
    const cleanId = id.trim();
    const now = new Date();

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .update(trackedBacklinks)
          .set({
            ...patch,
            updatedAt: now,
          })
          .where(eq(trackedBacklinks.id, cleanId))
          .returning();

        if (rows && rows.length > 0) {
          const idx = this.fallbackStore.findIndex((r) => r.id === cleanId);
          if (idx !== -1) {
            this.fallbackStore[idx] = rows[0];
          } else {
            this.fallbackStore.unshift(rows[0]);
          }
          return rows[0];
        }
      } catch (err) {
        logger.error(`Error updating tracked backlink [${cleanId}] in database`, 'BacklinkTrackerRepo', err);
      }
    }

    const idx = this.fallbackStore.findIndex((r) => r.id === cleanId);
    if (idx === -1) return null;

    const existing = this.fallbackStore[idx];
    const updated: TrackedBacklink = {
      ...existing,
      ...patch,
      updatedAt: now,
    };
    this.fallbackStore[idx] = updated;
    return updated;
  }

  /**
   * Deletes a tracked backlink record by ID.
   */
  async delete(id: string): Promise<boolean> {
    const cleanId = id.trim();
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        await db.delete(trackedBacklinks).where(eq(trackedBacklinks.id, cleanId));
      } catch (err) {
        logger.error(`Error deleting tracked backlink [${cleanId}] from database`, 'BacklinkTrackerRepo', err);
      }
    }

    const initialLength = this.fallbackStore.length;
    this.fallbackStore = this.fallbackStore.filter((r) => r.id !== cleanId);
    return this.fallbackStore.length < initialLength;
  }

  /**
   * Computes aggregate summary statistics across all tracked backlinks.
   */
  async getSummary(): Promise<TrackedBacklinksSummaryStats> {
    const all = await this.getAll();
    return {
      total: all.length,
      active: all.filter((r) => r.status === 'active').length,
      pending: all.filter((r) => r.status === 'pending').length,
      lost: all.filter((r) => r.status === 'lost').length,
      broken: all.filter((r) => r.status === 'broken').length,
      dofollow: all.filter((r) => r.linkType === 'dofollow').length,
      nofollow: all.filter((r) => r.linkType === 'nofollow' || r.linkType === 'ugc' || r.linkType === 'sponsored').length,
      verified: all.filter((r) => r.isVerified).length,
    };
  }

  /**
   * Helper to extract clean hostname domain from full URL.
   */
  private extractDomain(urlStr: string): string {
    try {
      const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return parsed.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return urlStr.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0].toLowerCase();
    }
  }
}

export const backlinkTrackerRepository = new BacklinkTrackerRepository();
