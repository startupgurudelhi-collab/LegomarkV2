import { getDatabase, pingDatabase } from '../config/database';
import {
  websitePageViews,
  websiteDailyUniqueVisitors,
  WebsitePageView,
  WebsiteDailyUniqueVisitor,
} from '../../db/schema/index';
import { sql, desc, gte, lte, eq, and, count } from 'drizzle-orm';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface RecordPageViewInput {
  path: string;
  visitorHash: string;
  referrer?: string | null;
  dateStr: string; // 'YYYY-MM-DD'
  sessionId?: string | null;
  isLandingPage?: boolean;
}

export interface AnalyticsDailyStat {
  date: string;
  label: string; // e.g., 'Mon, Sep 10'
  uniqueVisitors: number;
  pageViews: number;
}

export interface AnalyticsPageStat {
  path: string;
  views: number;
  percentage: number;
}

export interface AnalyticsReferrerStat {
  referrer: string;
  count: number;
}

export interface AnalyticsPeriodMetric {
  uniqueVisitors: number;
  pageViews: number;
}

export interface AnalyticsSummaryStats {
  today: AnalyticsPeriodMetric;
  yesterday: AnalyticsPeriodMetric;
  last7Days: AnalyticsPeriodMetric;
  last30Days: AnalyticsPeriodMetric;
  totalAllTime: AnalyticsPeriodMetric;
  dailyTrend: AnalyticsDailyStat[];
  topPages: AnalyticsPageStat[];
  topReferrers: AnalyticsReferrerStat[];
  generatedAt: string;
}

// ==========================================
// LACS Module #17: SEO Analytics Definitions
// ==========================================

export type CanonicalSearchEngine =
  | 'Google'
  | 'Bing'
  | 'Yahoo'
  | 'DuckDuckGo'
  | 'Ecosia'
  | 'Baidu'
  | 'Yandex'
  | 'Other Search';

export interface SeoSearchEngineDistribution {
  engine: CanonicalSearchEngine;
  sessions: number;
  percentage: number;
}

export interface SeoOrganicLandingPage {
  path: string;
  organicSessions: number;
  uniqueOrganicVisitors: number;
  percentage: number;
  dominantEngine: CanonicalSearchEngine;
  contentType: 'blog' | 'service' | 'core';
}

export interface SeoContentTypeTraffic {
  contentType: 'blog' | 'service' | 'core';
  label: string;
  organicSessions: number;
  totalSessions: number;
  organicSharePercentage: number;
}

export interface SeoDailyOrganicTrend {
  date: string;
  label: string;
  organicLandings: number;
  totalLandings: number;
  organicSharePercentage: number;
}

export interface SeoAnalyticsSummaryStats {
  periodDays: number;
  startDate: string;
  endDate: string;
  organicLandings: {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    totalPeriod: number;
  };
  totalLandings: {
    today: number;
    yesterday: number;
    last7Days: number;
    last30Days: number;
    totalPeriod: number;
  };
  organicSharePercentage: number;
  searchEngineDistribution: SeoSearchEngineDistribution[];
  topLandingPages: SeoOrganicLandingPage[];
  contentTypeTraffic: SeoContentTypeTraffic[];
  dailyOrganicTrend: SeoDailyOrganicTrend[];
  generatedAt: string;
}

/**
 * Classifies a sanitized referrer into a recognized organic search engine.
 * Supports Google, Bing, Yahoo, DuckDuckGo, Ecosia, Baidu, and Yandex.
 */
export function matchSearchEngine(referrer?: string | null): CanonicalSearchEngine | null {
  if (!referrer || typeof referrer !== 'string') return null;
  const ref = referrer.toLowerCase().trim();

  if (ref.includes('google.') || ref.startsWith('google.') || ref.includes('.google.')) {
    return 'Google';
  }
  if (ref.includes('bing.') || ref.startsWith('bing.') || ref.includes('.bing.')) {
    return 'Bing';
  }
  if (ref.includes('yahoo.') || ref.startsWith('yahoo.') || ref.includes('.yahoo.')) {
    return 'Yahoo';
  }
  if (ref.includes('duckduckgo.') || ref.startsWith('duckduckgo.')) {
    return 'DuckDuckGo';
  }
  if (ref.includes('ecosia.') || ref.startsWith('ecosia.')) {
    return 'Ecosia';
  }
  if (ref.includes('baidu.') || ref.startsWith('baidu.')) {
    return 'Baidu';
  }
  if (ref.includes('yandex.') || ref.startsWith('yandex.')) {
    return 'Yandex';
  }
  if (ref.includes('search.') || ref.includes('/search')) {
    return 'Other Search';
  }

  return null;
}

export function isOrganicSearchReferrer(referrer?: string | null): boolean {
  return matchSearchEngine(referrer) !== null;
}

/**
 * Categorizes a page route according to website architecture.
 */
export function classifyContentType(path: string): 'blog' | 'service' | 'core' {
  if (!path) return 'core';
  const p = path.toLowerCase().trim();
  if (p.startsWith('/blog') || p.startsWith('/resources/blog')) {
    return 'blog';
  }
  if (p.startsWith('/services')) {
    return 'service';
  }
  return 'core';
}

interface MemoryPageViewRecord {
  id: string;
  date: string;
  path: string;
  visitorHash: string;
  referrer: string | null;
  sessionId: string | null;
  isLandingPage: boolean;
  createdAt: Date;
}

class AnalyticsRepository {
  // In-memory fallback structures for zero-failure resilience
  private memoryPageViews: MemoryPageViewRecord[] = [];
  private memoryDailyVisitors: Set<string> = new Set(); // Key: `${date}:${visitorHash}`

  /**
   * Helper to format a Date as YYYY-MM-DD in local/server date
   */
  public formatDateKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Record an incoming page view and update daily unique visitor state
   */
  async recordPageView(input: RecordPageViewInput): Promise<void> {
    const memoryRecord: MemoryPageViewRecord = {
      id: crypto.randomUUID(),
      date: input.dateStr,
      path: input.path,
      visitorHash: input.visitorHash,
      referrer: input.referrer || null,
      sessionId: input.sessionId ? input.sessionId.slice(0, 64) : null,
      isLandingPage: Boolean(input.isLandingPage),
      createdAt: new Date(),
    };

    // Always update in-memory store for instantaneous availability and fallback
    this.memoryPageViews.push(memoryRecord);
    this.memoryDailyVisitors.add(`${input.dateStr}:${input.visitorHash}`);

    // Prevent unbounded memory growth by retaining last 50,000 page view events
    if (this.memoryPageViews.length > 50000) {
      this.memoryPageViews = this.memoryPageViews.slice(-40000);
    }

    const isConnected = await pingDatabase();
    if (isConnected) {
      try {
        const db = getDatabase();
        // 1. Insert page view
        await db.insert(websitePageViews).values({
          id: memoryRecord.id,
          date: input.dateStr,
          path: input.path,
          visitorHash: input.visitorHash,
          referrer: input.referrer || null,
          sessionId: memoryRecord.sessionId,
          isLandingPage: memoryRecord.isLandingPage,
          createdAt: memoryRecord.createdAt,
        });

        // 2. Register daily unique visitor (ignore conflict if already visited today)
        await db
          .insert(websiteDailyUniqueVisitors)
          .values({
            id: crypto.randomUUID(),
            date: input.dateStr,
            visitorHash: input.visitorHash,
            firstVisitAt: memoryRecord.createdAt,
          })
          .onConflictDoNothing();
      } catch (err: any) {
        logger.warn(
          `Analytics database recording failed; retained in memory store (${err?.message || err})`,
          'AnalyticsRepo'
        );
      }
    }
  }

  /**
   * Retrieve aggregate analytics dashboard data
   */
  async getAnalyticsStats(): Promise<AnalyticsSummaryStats> {
    const now = new Date();
    const todayStr = this.formatDateKey(now);

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = this.formatDateKey(yesterdayDate);

    const sevenDaysAgoDate = new Date(now);
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
    const sevenDaysAgoStr = this.formatDateKey(sevenDaysAgoDate);

    const thirtyDaysAgoDate = new Date(now);
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 29);
    const thirtyDaysAgoStr = this.formatDateKey(thirtyDaysAgoDate);

    const isConnected = await pingDatabase();

    if (isConnected) {
      try {
        const db = getDatabase();

        // 1. Unique visitors and page views queries by period
        const [todayPvRes, todayUvRes] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(websitePageViews)
            .where(eq(websitePageViews.date, todayStr)),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(websiteDailyUniqueVisitors)
            .where(eq(websiteDailyUniqueVisitors.date, todayStr)),
        ]);

        const [yesterdayPvRes, yesterdayUvRes] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(websitePageViews)
            .where(eq(websitePageViews.date, yesterdayStr)),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(websiteDailyUniqueVisitors)
            .where(eq(websiteDailyUniqueVisitors.date, yesterdayStr)),
        ]);

        const [sevenDaysPvRes, sevenDaysUvRes] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(websitePageViews)
            .where(gte(websitePageViews.date, sevenDaysAgoStr)),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(websiteDailyUniqueVisitors)
            .where(gte(websiteDailyUniqueVisitors.date, sevenDaysAgoStr)),
        ]);

        const [thirtyDaysPvRes, thirtyDaysUvRes] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(websitePageViews)
            .where(gte(websitePageViews.date, thirtyDaysAgoStr)),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(websiteDailyUniqueVisitors)
            .where(gte(websiteDailyUniqueVisitors.date, thirtyDaysAgoStr)),
        ]);

        const [totalPvRes, totalUvRes] = await Promise.all([
          db.select({ count: sql<number>`count(*)::int` }).from(websitePageViews),
          db.select({ count: sql<number>`count(*)::int` }).from(websiteDailyUniqueVisitors),
        ]);

        // Daily trend query (last 30 days grouped by date)
        const dailyTrendPvRes = await db
          .select({
            date: websitePageViews.date,
            pageViews: sql<number>`count(*)::int`,
          })
          .from(websitePageViews)
          .where(gte(websitePageViews.date, thirtyDaysAgoStr))
          .groupBy(websitePageViews.date)
          .orderBy(websitePageViews.date);

        const dailyTrendUvRes = await db
          .select({
            date: websiteDailyUniqueVisitors.date,
            uniqueVisitors: sql<number>`count(*)::int`,
          })
          .from(websiteDailyUniqueVisitors)
          .where(gte(websiteDailyUniqueVisitors.date, thirtyDaysAgoStr))
          .groupBy(websiteDailyUniqueVisitors.date)
          .orderBy(websiteDailyUniqueVisitors.date);

        const uvMap = new Map<string, number>();
        for (const row of dailyTrendUvRes) {
          uvMap.set(row.date, Number(row.uniqueVisitors) || 0);
        }

        const pvMap = new Map<string, number>();
        for (const row of dailyTrendPvRes) {
          pvMap.set(row.date, Number(row.pageViews) || 0);
        }

        // Generate complete 30-day sequence so charts have no gaps
        const dailyTrend: AnalyticsDailyStat[] = [];
        const iterDate = new Date(thirtyDaysAgoDate);
        while (iterDate <= now) {
          const dStr = this.formatDateKey(iterDate);
          const label = iterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyTrend.push({
            date: dStr,
            label,
            uniqueVisitors: uvMap.get(dStr) || 0,
            pageViews: pvMap.get(dStr) || 0,
          });
          iterDate.setDate(iterDate.getDate() + 1);
        }

        // Top 10 visited pages
        const topPagesRes = await db
          .select({
            path: websitePageViews.path,
            views: sql<number>`count(*)::int`,
          })
          .from(websitePageViews)
          .groupBy(websitePageViews.path)
          .orderBy(desc(sql`count(*)`))
          .limit(10);

        const totalViewsCount = Number(totalPvRes[0]?.count) || 1;
        const topPages: AnalyticsPageStat[] = topPagesRes.map((r) => ({
          path: r.path,
          views: Number(r.views) || 0,
          percentage: Math.round(((Number(r.views) || 0) / Math.max(totalViewsCount, 1)) * 100),
        }));

        // Top 5 referrers
        const topReferrersRes = await db
          .select({
            referrer: websitePageViews.referrer,
            count: sql<number>`count(*)::int`,
          })
          .from(websitePageViews)
          .where(sql`${websitePageViews.referrer} is not null and ${websitePageViews.referrer} != ''`)
          .groupBy(websitePageViews.referrer)
          .orderBy(desc(sql`count(*)`))
          .limit(5);

        const topReferrers: AnalyticsReferrerStat[] = topReferrersRes.map((r) => ({
          referrer: r.referrer || 'Direct / Bookmark',
          count: Number(r.count) || 0,
        }));

        return {
          today: {
            uniqueVisitors: Number(todayUvRes[0]?.count) || 0,
            pageViews: Number(todayPvRes[0]?.count) || 0,
          },
          yesterday: {
            uniqueVisitors: Number(yesterdayUvRes[0]?.count) || 0,
            pageViews: Number(yesterdayPvRes[0]?.count) || 0,
          },
          last7Days: {
            uniqueVisitors: Number(sevenDaysUvRes[0]?.count) || 0,
            pageViews: Number(sevenDaysPvRes[0]?.count) || 0,
          },
          last30Days: {
            uniqueVisitors: Number(thirtyDaysUvRes[0]?.count) || 0,
            pageViews: Number(thirtyDaysPvRes[0]?.count) || 0,
          },
          totalAllTime: {
            uniqueVisitors: Number(totalUvRes[0]?.count) || 0,
            pageViews: Number(totalPvRes[0]?.count) || 0,
          },
          dailyTrend,
          topPages,
          topReferrers,
          generatedAt: new Date().toISOString(),
        };
      } catch (err: any) {
        logger.warn(
          `Failed to load analytics from database, using memory fallback store (${err?.message || err})`,
          'AnalyticsRepo'
        );
      }
    }

    // Memory fallback computation
    return this.calculateMemoryStats(
      todayStr,
      yesterdayStr,
      sevenDaysAgoStr,
      thirtyDaysAgoStr,
      thirtyDaysAgoDate,
      now
    );
  }

  private calculateMemoryStats(
    todayStr: string,
    yesterdayStr: string,
    sevenDaysAgoStr: string,
    thirtyDaysAgoStr: string,
    thirtyDaysAgoDate: Date,
    now: Date
  ): AnalyticsSummaryStats {
    const todayPvs = this.memoryPageViews.filter((p) => p.date === todayStr);
    const yesterdayPvs = this.memoryPageViews.filter((p) => p.date === yesterdayStr);
    const sevenDaysPvs = this.memoryPageViews.filter((p) => p.date >= sevenDaysAgoStr);
    const thirtyDaysPvs = this.memoryPageViews.filter((p) => p.date >= thirtyDaysAgoStr);

    const getUvsForFilter = (predicate: (key: string) => boolean): number => {
      let count = 0;
      for (const key of this.memoryDailyVisitors) {
        if (predicate(key)) count++;
      }
      return count;
    };

    const todayUvs = getUvsForFilter((k) => k.startsWith(`${todayStr}:`));
    const yesterdayUvs = getUvsForFilter((k) => k.startsWith(`${yesterdayStr}:`));
    const sevenDaysUvs = getUvsForFilter((k) => {
      const datePart = k.split(':')[0];
      return datePart >= sevenDaysAgoStr;
    });
    const thirtyDaysUvs = getUvsForFilter((k) => {
      const datePart = k.split(':')[0];
      return datePart >= thirtyDaysAgoStr;
    });

    // 30-day sequence
    const dailyTrend: AnalyticsDailyStat[] = [];
    const iterDate = new Date(thirtyDaysAgoDate);
    while (iterDate <= now) {
      const dStr = this.formatDateKey(iterDate);
      const label = iterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const pvs = this.memoryPageViews.filter((p) => p.date === dStr).length;
      const uvs = getUvsForFilter((k) => k.startsWith(`${dStr}:`));
      dailyTrend.push({
        date: dStr,
        label,
        uniqueVisitors: uvs,
        pageViews: pvs,
      });
      iterDate.setDate(iterDate.getDate() + 1);
    }

    // Top pages
    const pageCountMap = new Map<string, number>();
    for (const p of this.memoryPageViews) {
      pageCountMap.set(p.path, (pageCountMap.get(p.path) || 0) + 1);
    }

    const sortedPages = Array.from(pageCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const totalViews = this.memoryPageViews.length || 1;
    const topPages: AnalyticsPageStat[] = sortedPages.map(([path, views]) => ({
      path,
      views,
      percentage: Math.round((views / Math.max(totalViews, 1)) * 100),
    }));

    // Top referrers
    const referrerMap = new Map<string, number>();
    for (const p of this.memoryPageViews) {
      if (p.referrer) {
        referrerMap.set(p.referrer, (referrerMap.get(p.referrer) || 0) + 1);
      }
    }
    const topReferrers: AnalyticsReferrerStat[] = Array.from(referrerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));

    return {
      today: { uniqueVisitors: todayUvs, pageViews: todayPvs.length },
      yesterday: { uniqueVisitors: yesterdayUvs, pageViews: yesterdayPvs.length },
      last7Days: { uniqueVisitors: sevenDaysUvs, pageViews: sevenDaysPvs.length },
      last30Days: { uniqueVisitors: thirtyDaysUvs, pageViews: thirtyDaysPvs.length },
      totalAllTime: {
        uniqueVisitors: this.memoryDailyVisitors.size,
        pageViews: this.memoryPageViews.length,
      },
      dailyTrend,
      topPages,
      topReferrers,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieve specialized SEO analytics dashboard data (LACS Module #17)
   * Evaluates strictly organic landing-page sessions and search acquisitions.
   */
  async getSeoAnalyticsStats(rangeDays: number = 30): Promise<SeoAnalyticsSummaryStats> {
    const days = Math.max(1, Math.min(365, Number(rangeDays) || 30));
    const now = new Date();
    const todayStr = this.formatDateKey(now);

    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = this.formatDateKey(yesterdayDate);

    const sevenDaysAgoDate = new Date(now);
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 6);
    const sevenDaysAgoStr = this.formatDateKey(sevenDaysAgoDate);

    const thirtyDaysAgoDate = new Date(now);
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 29);
    const thirtyDaysAgoStr = this.formatDateKey(thirtyDaysAgoDate);

    const startDateDate = new Date(now);
    startDateDate.setDate(startDateDate.getDate() - (days - 1));
    const startDateStr = this.formatDateKey(startDateDate);

    const isConnected = await pingDatabase();
    if (isConnected) {
      try {
        const db = getDatabase();
        const landingRows = await db
          .select({
            id: websitePageViews.id,
            date: websitePageViews.date,
            path: websitePageViews.path,
            visitorHash: websitePageViews.visitorHash,
            referrer: websitePageViews.referrer,
          })
          .from(websitePageViews)
          .where(eq(websitePageViews.isLandingPage, true));

        return this.processSeoAnalyticsData(
          landingRows,
          days,
          todayStr,
          yesterdayStr,
          sevenDaysAgoStr,
          thirtyDaysAgoStr,
          startDateStr,
          now,
          startDateDate
        );
      } catch (err: any) {
        logger.warn(
          `Failed to load SEO analytics from database, falling back to memory store (${err?.message || err})`,
          'AnalyticsRepo'
        );
      }
    }

    // In-memory fallback
    const memoryLandings = this.memoryPageViews.filter((p) => p.isLandingPage);
    return this.processSeoAnalyticsData(
      memoryLandings,
      days,
      todayStr,
      yesterdayStr,
      sevenDaysAgoStr,
      thirtyDaysAgoStr,
      startDateStr,
      now,
      startDateDate
    );
  }

  private processSeoAnalyticsData(
    landingRows: { date: string; path: string; visitorHash: string; referrer: string | null }[],
    days: number,
    todayStr: string,
    yesterdayStr: string,
    sevenDaysAgoStr: string,
    thirtyDaysAgoStr: string,
    startDateStr: string,
    now: Date,
    startDateDate: Date
  ): SeoAnalyticsSummaryStats {
    let organicToday = 0;
    let organicYesterday = 0;
    let organic7Days = 0;
    let organic30Days = 0;
    let organicTotalPeriod = 0;

    let totalToday = 0;
    let totalYesterday = 0;
    let total7Days = 0;
    let total30Days = 0;
    let totalTotalPeriod = 0;

    const engineMap = new Map<CanonicalSearchEngine, number>();
    const pathMap = new Map<
      string,
      {
        path: string;
        organicSessions: number;
        uniqueVisitors: Set<string>;
        engineCounts: Map<CanonicalSearchEngine, number>;
        contentType: 'blog' | 'service' | 'core';
      }
    >();

    const contentTotals = {
      blog: { organic: 0, total: 0 },
      service: { organic: 0, total: 0 },
      core: { organic: 0, total: 0 },
    };

    const dailyMap = new Map<string, { organic: number; total: number }>();

    // Pre-populate chronological timeline sequence
    const iterDate = new Date(startDateDate);
    while (iterDate <= now) {
      const dStr = this.formatDateKey(iterDate);
      dailyMap.set(dStr, { organic: 0, total: 0 });
      iterDate.setDate(iterDate.getDate() + 1);
    }

    for (const row of landingRows) {
      const engine = matchSearchEngine(row.referrer);
      const isOrganic = engine !== null;
      const cType = classifyContentType(row.path);

      // Total landings counts by period
      if (row.date === todayStr) totalToday++;
      if (row.date === yesterdayStr) totalYesterday++;
      if (row.date >= sevenDaysAgoStr) total7Days++;
      if (row.date >= thirtyDaysAgoStr) total30Days++;
      if (row.date >= startDateStr) totalTotalPeriod++;

      // Organic landings counts by period
      if (isOrganic) {
        if (row.date === todayStr) organicToday++;
        if (row.date === yesterdayStr) organicYesterday++;
        if (row.date >= sevenDaysAgoStr) organic7Days++;
        if (row.date >= thirtyDaysAgoStr) organic30Days++;
        if (row.date >= startDateStr) organicTotalPeriod++;
      }

      // Range-filtered aggregations
      if (row.date >= startDateStr) {
        // Daily trend
        const dayStat = dailyMap.get(row.date);
        if (dayStat) {
          dayStat.total++;
          if (isOrganic) dayStat.organic++;
        }

        // Content type traffic
        contentTotals[cType].total++;
        if (isOrganic) {
          contentTotals[cType].organic++;

          // Search engine distribution
          if (engine) {
            engineMap.set(engine, (engineMap.get(engine) || 0) + 1);
          }

          // Top landing pages
          let pageRecord = pathMap.get(row.path);
          if (!pageRecord) {
            pageRecord = {
              path: row.path,
              organicSessions: 0,
              uniqueVisitors: new Set(),
              engineCounts: new Map(),
              contentType: cType,
            };
            pathMap.set(row.path, pageRecord);
          }
          pageRecord.organicSessions++;
          if (row.visitorHash) pageRecord.uniqueVisitors.add(row.visitorHash);
          if (engine) {
            pageRecord.engineCounts.set(engine, (pageRecord.engineCounts.get(engine) || 0) + 1);
          }
        }
      }
    }

    // Organic share percentage for the requested range
    const organicSharePercentage =
      totalTotalPeriod > 0
        ? Math.round((organicTotalPeriod / totalTotalPeriod) * 1000) / 10
        : 0;

    // Search Engine Distribution sorted descending
    const searchEngineDistribution: SeoSearchEngineDistribution[] = Array.from(engineMap.entries())
      .map(([engine, sessions]) => ({
        engine,
        sessions,
        percentage:
          organicTotalPeriod > 0
            ? Math.round((sessions / organicTotalPeriod) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    // Top Landing Pages sorted descending (top 20)
    const topLandingPages: SeoOrganicLandingPage[] = Array.from(pathMap.values())
      .sort((a, b) => b.organicSessions - a.organicSessions)
      .slice(0, 20)
      .map((entry) => {
        let dominantEngine: CanonicalSearchEngine = 'Google';
        let maxCount = -1;
        for (const [eng, count] of entry.engineCounts.entries()) {
          if (count > maxCount) {
            maxCount = count;
            dominantEngine = eng;
          }
        }
        return {
          path: entry.path,
          organicSessions: entry.organicSessions,
          uniqueOrganicVisitors: entry.uniqueVisitors.size,
          percentage:
            organicTotalPeriod > 0
              ? Math.round((entry.organicSessions / organicTotalPeriod) * 1000) / 10
              : 0,
          dominantEngine,
          contentType: entry.contentType,
        };
      });

    // Content Type Traffic
    const contentTypeTraffic: SeoContentTypeTraffic[] = [
      {
        contentType: 'blog',
        label: 'Blog & Knowledge Base',
        organicSessions: contentTotals.blog.organic,
        totalSessions: contentTotals.blog.total,
        organicSharePercentage:
          contentTotals.blog.total > 0
            ? Math.round((contentTotals.blog.organic / contentTotals.blog.total) * 1000) / 10
            : 0,
      },
      {
        contentType: 'service',
        label: 'Commercial Service Landing Pages',
        organicSessions: contentTotals.service.organic,
        totalSessions: contentTotals.service.total,
        organicSharePercentage:
          contentTotals.service.total > 0
            ? Math.round((contentTotals.service.organic / contentTotals.service.total) * 1000) / 10
            : 0,
      },
      {
        contentType: 'core',
        label: 'Corporate & Core Pages',
        organicSessions: contentTotals.core.organic,
        totalSessions: contentTotals.core.total,
        organicSharePercentage:
          contentTotals.core.total > 0
            ? Math.round((contentTotals.core.organic / contentTotals.core.total) * 1000) / 10
            : 0,
      },
    ];

    // Daily Trend
    const dailyOrganicTrend: SeoDailyOrganicTrend[] = Array.from(dailyMap.entries()).map(
      ([date, stat]) => {
        const parts = date.split('-');
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          date,
          label,
          organicLandings: stat.organic,
          totalLandings: stat.total,
          organicSharePercentage:
            stat.total > 0 ? Math.round((stat.organic / stat.total) * 1000) / 10 : 0,
        };
      }
    );

    return {
      periodDays: days,
      startDate: startDateStr,
      endDate: todayStr,
      organicLandings: {
        today: organicToday,
        yesterday: organicYesterday,
        last7Days: organic7Days,
        last30Days: organic30Days,
        totalPeriod: organicTotalPeriod,
      },
      totalLandings: {
        today: totalToday,
        yesterday: totalYesterday,
        last7Days: total7Days,
        last30Days: total30Days,
        totalPeriod: totalTotalPeriod,
      },
      organicSharePercentage,
      searchEngineDistribution,
      topLandingPages,
      contentTypeTraffic,
      dailyOrganicTrend,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();
