import crypto from 'crypto';
import { analyticsRepository, AnalyticsSummaryStats } from '../repositories/analytics.repository';
import { logger } from '../utils/logger';

// Server-side salt used for one-way SHA-256 hashing.
// Because the date string is incorporated into the digest, hashes naturally rotate every 24 hours.
const ANALYTICS_SALT = process.env.ANALYTICS_SALT || 'legomark_analytics_secure_salt_2026';

export interface TrackVisitPayload {
  path: string;
  visitorId?: string | null;
  referrer?: string | null;
}

export class AnalyticsService {
  /**
   * Generates an anonymous, privacy-safe 64-character hex hash.
   * Incorporates a daily salt and current date so hashes change every 24 hours.
   * Absolutely NO personal information or persistent user identity is recorded.
   */
  public generateDailyVisitorHash(visitorId: string, dateStr: string): string {
    const rawInput = `${ANALYTICS_SALT}:${dateStr}:${visitorId.trim()}`;
    return crypto.createHash('sha256').update(rawInput).digest('hex');
  }

  /**
   * Determines if a path is eligible for public visitor analytics tracking.
   * Strictly excludes admin panels, API calls, and static file requests.
   */
  public isTrackablePath(rawPath: string): boolean {
    if (!rawPath || typeof rawPath !== 'string') return false;
    const path = rawPath.trim().toLowerCase();

    // Exclude admin routes, API endpoints, and internal assets
    if (
      path.startsWith('/admin') ||
      path.startsWith('/api') ||
      path.startsWith('/@') ||
      path.startsWith('/src') ||
      path.startsWith('/node_modules')
    ) {
      return false;
    }

    // Exclude static asset extensions
    const staticExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.gif',
      '.svg',
      '.ico',
      '.css',
      '.js',
      '.map',
      '.woff',
      '.woff2',
      '.ttf',
      '.xml',
      '.json',
    ];
    if (staticExtensions.some((ext) => path.endsWith(ext))) {
      return false;
    }

    return true;
  }

  /**
   * Sanitizes and normalizes the referrer string.
   * Strips tracking query parameters (UTMs, tokens) to preserve visitor privacy.
   */
  public sanitizeReferrer(rawReferrer?: string | null): string | null {
    if (!rawReferrer || typeof rawReferrer !== 'string') return null;

    try {
      const trimmed = rawReferrer.trim();
      if (!trimmed) return null;

      // If full URL, extract hostname + path, omitting query parameters and hashes
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        // Exclude self-referrals from same host
        const host = url.hostname.replace(/^www\./, '');
        if (host.includes('legomark') || host === 'localhost' || host === '127.0.0.1') {
          return null;
        }
        return `${host}${url.pathname === '/' ? '' : url.pathname}`.slice(0, 255);
      }

      return trimmed.slice(0, 255);
    } catch {
      return null;
    }
  }

  /**
   * Records an anonymous public website page visit
   */
  async trackVisit(payload: TrackVisitPayload): Promise<{ success: boolean; skipped?: boolean }> {
    try {
      if (!this.isTrackablePath(payload.path)) {
        return { success: true, skipped: true };
      }

      const today = new Date();
      const dateStr = analyticsRepository.formatDateKey(today);

      // Fallback random ID if client failed to provide one
      const rawVisitorId = payload.visitorId?.trim() || crypto.randomUUID();
      const visitorHash = this.generateDailyVisitorHash(rawVisitorId, dateStr);

      const normalizedPath = payload.path.trim().slice(0, 255);
      const sanitizedReferrer = this.sanitizeReferrer(payload.referrer);

      await analyticsRepository.recordPageView({
        path: normalizedPath,
        visitorHash,
        referrer: sanitizedReferrer,
        dateStr,
      });

      return { success: true };
    } catch (err: any) {
      logger.warn(`Non-blocking analytics tracking error: ${err?.message || err}`, 'AnalyticsService');
      // Always succeed to never disrupt caller
      return { success: true, skipped: true };
    }
  }

  /**
   * Returns aggregated dashboard analytics
   */
  async getDashboardStats(): Promise<AnalyticsSummaryStats> {
    return analyticsRepository.getAnalyticsStats();
  }
}

export const analyticsService = new AnalyticsService();
