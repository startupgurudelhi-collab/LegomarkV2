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

interface MemoryPageViewRecord {
  id: string;
  date: string;
  path: string;
  visitorHash: string;
  referrer: string | null;
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
}

export const analyticsRepository = new AnalyticsRepository();
