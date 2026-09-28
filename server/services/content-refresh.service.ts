import { blogRepository } from '../repositories/blog.repository';
import { orphanPageService } from './orphan-page.service';
import { analyticsRepository } from '../repositories/analytics.repository';
import { logger } from '../utils/logger';
import {
  ContentRefreshCandidate,
  ContentRefreshScanResult,
  RefreshSignal,
  RefreshUrgencyLevel,
} from '../../src/types/contentRefresh';
import { CURATED_AUTHORITY_SOURCES } from '../../src/config/authoritySources';

export class ContentRefreshService {
  /**
   * Analyzes all published articles against 6 deterministic freshness, authority,
   * link-equity, and visibility signals to generate an actionable refresh report.
   */
  public async analyzeContentRefresh(): Promise<ContentRefreshScanResult> {
    const startTime = Date.now();
    logger.info('Starting SEO content refresh & update scan...', 'ContentRefreshService');

    try {
      // 1. Fetch published blogs from DB/repository
      const blogData = await blogRepository.getAdminBlogs({ status: 'published' });
      const publishedBlogs = (blogData.blogs || []).filter((b) => b.isPublished);

      if (publishedBlogs.length === 0) {
        return {
          success: true,
          summary: {
            totalArticles: 0,
            criticalCount: 0,
            recommendedCount: 0,
            freshCount: 0,
            averageUrgencyScore: 0,
          },
          candidates: [],
          scannedAt: new Date().toISOString(),
        };
      }

      // 2. Fetch orphan page data and analytics concurrently
      const [orphanScan, analyticsSummary] = await Promise.all([
        orphanPageService.scanOrphanPages().catch((err) => {
          logger.warn(`Orphan page scan failed during refresh audit: ${err?.message || err}`, 'ContentRefreshService');
          return { pages: [] };
        }),
        analyticsRepository.getAnalyticsStats().catch((err) => {
          logger.warn(`Analytics stats failed during refresh audit: ${err?.message || err}`, 'ContentRefreshService');
          return { topPages: [] };
        }),
      ]);

      // 3. Build lookup maps
      // Inbound link count & status per blog slug
      const orphanMap = new Map<string, { inboundCount: number; status: 'orphaned' | 'low_links' | 'healthy' }>();
      (orphanScan.pages || []).forEach((p: any) => {
        if (p.type === 'blog') {
          orphanMap.set(p.slug.toLowerCase(), {
            inboundCount: p.incomingLinkCount || 0,
            status: p.status || 'healthy',
          });
        }
      });

      // Page view counts per blog path
      const viewsMap = new Map<string, number>();
      (analyticsSummary.topPages || []).forEach((item: any) => {
        const cleanPath = (item.path || '').toLowerCase();
        viewsMap.set(cleanPath, Number(item.views) || 0);
      });

      // Calculate traffic cutoff for top 20%
      const blogViewCounts = publishedBlogs.map((b) => {
        const p1 = `/resources/blog/${b.slug.toLowerCase()}`;
        const p2 = `/blog/${b.slug.toLowerCase()}`;
        return Math.max(viewsMap.get(p1) || 0, viewsMap.get(p2) || 0);
      });
      blogViewCounts.sort((a, b) => b - a);

      // Top 20% cutoff threshold
      const top20Index = Math.max(0, Math.floor(blogViewCounts.length * 0.2));
      const top20ViewsThreshold = blogViewCounts.length > 0 && blogViewCounts[top20Index] > 0
        ? blogViewCounts[top20Index]
        : 999999; // fallback if no traffic yet

      const now = Date.now();
      const currentYear = 2026;
      const candidates: ContentRefreshCandidate[] = [];

      // 4. Evaluate each published blog
      for (const blog of publishedBlogs) {
        const signals: RefreshSignal[] = [];
        let totalSignalPoints = 0;

        const slugLower = blog.slug.toLowerCase();
        const contentStr = blog.content || '';
        const titleStr = blog.title || '';
        const lastUpdated = blog.updatedAt || blog.publishedAt || blog.createdAt;
        const daysSinceUpdate = Math.max(
          0,
          Math.floor((now - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
        );

        // --- SIGNAL 1: Temporal Stagnation (Days Since Update) ---
        if (daysSinceUpdate > 180) {
          const pts = 25;
          signals.push({
            key: 'DAYS_SINCE_UPDATE',
            points: pts,
            title: 'Severely Stagnant Content',
            description: `Content has not been revised in ${daysSinceUpdate} days (> 180 days threshold).`,
          });
          totalSignalPoints += pts;
        } else if (daysSinceUpdate >= 90) {
          const pts = 15;
          signals.push({
            key: 'DAYS_SINCE_UPDATE',
            points: pts,
            title: 'Aging Content',
            description: `Content last updated ${daysSinceUpdate} days ago (90–180 days window).`,
          });
          totalSignalPoints += pts;
        } else if (daysSinceUpdate >= 45) {
          const pts = 5;
          signals.push({
            key: 'DAYS_SINCE_UPDATE',
            points: pts,
            title: 'Moderate Freshness Gap',
            description: `Content last updated ${daysSinceUpdate} days ago (45–89 days window).`,
          });
          totalSignalPoints += pts;
        }

        // --- SIGNAL 2: Outdated Statutory Years ---
        // Matches past calendar years 2020 through 2025 (since current year is 2026)
        const pastYearRegex = /\b(202[0-5])\b/g;
        const titleYearMatches = titleStr.match(pastYearRegex);
        const contentYearMatches = contentStr.match(pastYearRegex);

        if (titleYearMatches && titleYearMatches.length > 0) {
          const uniqueYears = Array.from(new Set(titleYearMatches)).join(', ');
          const pts = 25;
          signals.push({
            key: 'OUTDATED_YEAR_MENTION',
            points: pts,
            title: 'Outdated Year in Headline',
            description: `Title references outdated statutory year(s): "${uniqueYears}". Current compliance cycle is ${currentYear}.`,
          });
          totalSignalPoints += pts;
        } else if (contentYearMatches && contentYearMatches.length > 0) {
          const uniqueYears = Array.from(new Set(contentYearMatches)).slice(0, 3).join(', ');
          const pts = 15;
          signals.push({
            key: 'OUTDATED_YEAR_MENTION',
            points: pts,
            title: 'Outdated Year References in Body',
            description: `Article content cites prior regulatory year(s): "${uniqueYears}". Ensure compliance rules reflect ${currentYear}.`,
          });
          totalSignalPoints += pts;
        }

        // --- SIGNAL 3: Metadata Deficits ---
        let metaPoints = 0;
        const metaDesc = (blog.metaDescription || '').trim();
        const seoTitle = (blog.seoTitle || '').trim();

        if (!metaDesc) {
          metaPoints += 10;
          signals.push({
            key: 'META_TAG_DEFICIT',
            points: 10,
            title: 'Missing Meta Description',
            description: 'Search engine snippet description is missing; search engines will auto-generate text.',
          });
        } else if (metaDesc.length < 100 || metaDesc.length > 175) {
          metaPoints += 5;
          signals.push({
            key: 'META_TAG_DEFICIT',
            points: 5,
            title: 'Non-Optimal Meta Description Length',
            description: `Meta description is ${metaDesc.length} chars (optimal search snippet length: 120–160 chars).`,
          });
        }

        if (!seoTitle || seoTitle.toLowerCase() === titleStr.toLowerCase()) {
          metaPoints += 5;
          signals.push({
            key: 'META_TAG_DEFICIT',
            points: 5,
            title: 'Missing Custom SEO Title Tag',
            description: 'Article lacks an optimized SERP title tag distinct from the main article H1.',
          });
        }
        totalSignalPoints += Math.min(15, metaPoints);

        // --- SIGNAL 4: Internal Link Equity ---
        const orphanInfo = orphanMap.get(slugLower);
        const inboundCount = orphanInfo ? orphanInfo.inboundCount : 0;
        const isOrphaned = orphanInfo ? orphanInfo.status === 'orphaned' : inboundCount === 0;

        if (isOrphaned || inboundCount === 0) {
          const pts = 15;
          signals.push({
            key: 'INTERNAL_LINK_HEALTH',
            points: pts,
            title: 'Orphaned Page (0 Inbound Links)',
            description: 'Page has zero inbound internal links from other blog or service pages.',
          });
          totalSignalPoints += pts;
        } else if (inboundCount === 1) {
          const pts = 8;
          signals.push({
            key: 'INTERNAL_LINK_HEALTH',
            points: pts,
            title: 'Low Link Equity (1 Inbound Link)',
            description: 'Page receives only 1 incoming internal link across the website architecture.',
          });
          totalSignalPoints += pts;
        }

        // --- SIGNAL 5: Statutory Authority Citation Gap ---
        // Only triggers when a curated authority source is functionally relevant to this category or statutory keywords
        const relevantAuthority = CURATED_AUTHORITY_SOURCES.find((src) => {
          const categoryMatches = src.primaryCategories.some(
            (c) => c.toLowerCase() === (blog.category || '').toLowerCase()
          );
          if (categoryMatches) return true;
          return src.statutoryKeywords.some((kw) => titleStr.toLowerCase().includes(kw));
        });

        const hasAuthorityLink = /https?:\/\/[^\s"'<>]*(?:\.gov\.in|\.nic\.in|\.rbi\.org\.in)/i.test(contentStr);

        if (relevantAuthority && !hasAuthorityLink) {
          const pts = 10;
          signals.push({
            key: 'MISSING_AUTHORITY_LINK',
            points: pts,
            title: 'Missing Official Statutory Citation',
            description: `Article in "${blog.category}" lacks official citations to relevant regulatory portals (${relevantAuthority.sourceName} - ${relevantAuthority.domain}).`,
          });
          totalSignalPoints += pts;
        }

        // --- SIGNAL 6: Traffic Visibility Boost ---
        const p1 = `/resources/blog/${slugLower}`;
        const p2 = `/blog/${slugLower}`;
        const views = Math.max(viewsMap.get(p1) || 0, viewsMap.get(p2) || 0);

        if (views > 0 && views >= top20ViewsThreshold) {
          const pts = 10;
          signals.push({
            key: 'TRAFFIC_VISIBILITY_BOOST',
            points: pts,
            title: 'High Traffic Exposure',
            description: `Page ranks in top 20% of blog traffic (${views} views), multiplying the SEO impact of stale content.`,
          });
          totalSignalPoints += pts;
        }

        // --- Composite Urgency Score (0 - 100) ---
        const urgencyScore = Math.min(100, totalSignalPoints);
        let urgencyLevel: RefreshUrgencyLevel = 'FRESH';
        if (urgencyScore >= 70) {
          urgencyLevel = 'CRITICAL';
        } else if (urgencyScore >= 40) {
          urgencyLevel = 'RECOMMENDED';
        }

        candidates.push({
          id: String(blog.id),
          title: blog.title,
          slug: blog.slug,
          category: blog.category || 'General',
          publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : null,
          updatedAt: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : null,
          daysSinceUpdate,
          urgencyScore,
          urgencyLevel,
          totalPageViews: views,
          inboundLinkCount: inboundCount,
          isOrphaned,
          hasAuthorityLink,
          signals,
        });
      }

      // Sort by urgency score descending by default
      candidates.sort((a, b) => b.urgencyScore - a.urgencyScore);

      const criticalCount = candidates.filter((c) => c.urgencyLevel === 'CRITICAL').length;
      const recommendedCount = candidates.filter((c) => c.urgencyLevel === 'RECOMMENDED').length;
      const freshCount = candidates.filter((c) => c.urgencyLevel === 'FRESH').length;
      const totalScore = candidates.reduce((acc, c) => acc + c.urgencyScore, 0);
      const averageUrgencyScore = candidates.length > 0 ? Math.round(totalScore / candidates.length) : 0;

      logger.info(
        `Content refresh scan completed in ${Date.now() - startTime}ms. Total: ${candidates.length} (Critical: ${criticalCount}, Recommended: ${recommendedCount}, Fresh: ${freshCount})`,
        'ContentRefreshService'
      );

      return {
        success: true,
        summary: {
          totalArticles: candidates.length,
          criticalCount,
          recommendedCount,
          freshCount,
          averageUrgencyScore,
        },
        candidates,
        scannedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to analyze content refresh', 'ContentRefreshService', error);
      throw error;
    }
  }
}

export const contentRefreshService = new ContentRefreshService();
