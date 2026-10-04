import { seoOptimizerService } from './seo-optimizer.service';
import { gscService } from './gsc.service';
import { backlinkOpportunityService } from './backlink-opportunity.service';
import { backlinkTrackerRepository } from '../repositories/backlink-tracker.repository';
import { analyticsRepository } from '../repositories/analytics.repository';
import { logger } from '../utils/logger';

export interface HealthIndexComponent {
  id: 'onPageSeo' | 'serpPerformance' | 'organicTraffic' | 'backlinks';
  name: string;
  sourceModule: string;
  score: number;
  effectiveWeight: number; // 0.0 to 1.0 (sums to 1.0 across active components)
  isAvailable: boolean;
  statusLabel: string;
  keyMetricLabel: string;
  keyMetricValue: string;
}

export interface LacsCommandCenterHealthIndex {
  score: number; // 0–100 composite
  grade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  status: string;
  components: {
    onPageSeo: HealthIndexComponent;
    serpPerformance: HealthIndexComponent;
    organicTraffic: HealthIndexComponent;
    backlinks: HealthIndexComponent;
  };
}

export interface LacsActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  sourceModule: string;
  category: 'on_page' | 'backlink_opportunity' | 'tracked_link' | 'serp';
  targetUrl?: string;
  actionText: string;
  actionSection: string;
}

export interface LacsModuleStatus {
  moduleId: string;
  name: string;
  badge: string;
  status: 'connected' | 'active' | 'warning' | 'unconfigured' | 'pending';
  headline: string;
  subtext: string;
  primaryMetric: {
    label: string;
    value: string | number;
  };
  navigationSection: string;
}

export interface LacsCommandCenterOverview {
  generatedAt: string;
  healthIndex: LacsCommandCenterHealthIndex;
  kpis: {
    catalogAvgScore: number | null;
    totalArticlesAudited: number;
    gscConnected: boolean;
    gscClicks28d: number | null;
    gscImpressions28d: number | null;
    gscAvgPosition28d: number | null;
    organicSharePercentage: number | null;
    totalOrganicLandings30d: number;
    backlinkOpportunitiesCount: number;
    strikingDistanceCount: number;
    trackedBacklinksTotal: number;
    trackedBacklinksActive: number;
    trackedBacklinksLostOrBroken: number;
    trackedBacklinksDofollowPct: number;
  };
  priorityActions: LacsActionItem[];
  moduleStatuses: LacsModuleStatus[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * LACS Module #23: Command Center Backend Aggregator Service
 * Synthesizes read-only metrics from Modules #17, #18, #19, #21, and #22.
 * Uses Promise.allSettled and strictly reads cached summaries without triggering heavy processing.
 */
export class LacsCommandCenterService {
  /**
   * Generates the consolidated Command Center overview.
   */
  async getOverview(): Promise<LacsCommandCenterOverview> {
    const timestamp = new Date().toISOString();

    // 1. Fetch read-only data concurrently across all modules with Promise.allSettled
    const [
      catalogAuditSettled,
      gscConnectionSettled,
      gscAnalyticsSettled,
      opportunitiesSettled,
      trackedBacklinksSettled,
      seoAnalyticsSettled,
    ] = await Promise.allSettled([
      // #18: Strictly read saved audit from system_metadata (no crawl/audit triggered)
      seoOptimizerService.getCatalogAudit(),
      // #19: Read GSC connection metadata
      gscService.getConnectionStatus(),
      // #19: Query GSC 28-day analytics if connected, otherwise null
      gscService.querySearchAnalytics({ days: 28 }).catch(() => null),
      // #21: Deterministic catalog backlink opportunities
      backlinkOpportunityService.generateOpportunities({ limit: 5 }),
      // #22: Tracked backlinks summary stats
      backlinkTrackerRepository.getSummary(),
      // #17: Read-only organic SEO landing stats (30 days)
      analyticsRepository.getSeoAnalyticsStats(30),
    ]);

    // Extract settled results safely
    const catalogAudit =
      catalogAuditSettled.status === 'fulfilled' ? catalogAuditSettled.value : null;
    const gscConnection =
      gscConnectionSettled.status === 'fulfilled' ? gscConnectionSettled.value : null;
    const gscAnalytics =
      gscAnalyticsSettled.status === 'fulfilled' ? gscAnalyticsSettled.value : null;
    const opportunitiesResult =
      opportunitiesSettled.status === 'fulfilled' ? opportunitiesSettled.value : null;
    const trackedBacklinks =
      trackedBacklinksSettled.status === 'fulfilled'
        ? trackedBacklinksSettled.value
        : {
            total: 0,
            active: 0,
            pending: 0,
            lost: 0,
            broken: 0,
            dofollow: 0,
            nofollow: 0,
            verified: 0,
          };
    const seoAnalytics =
      seoAnalyticsSettled.status === 'fulfilled' ? seoAnalyticsSettled.value : null;

    // 2. Compute Individual Component Scores (0–100)

    // Component 1: On-Page SEO Quality (#18)
    const onPageAvailable = Boolean(catalogAudit && catalogAudit.totalArticles > 0);
    const onPageScore = onPageAvailable
      ? clamp(Math.round(catalogAudit!.averageScore), 0, 100)
      : 70; // neutral fallback when uninitialized

    // Component 2: SERP Performance (#19)
    const isGscConnected = Boolean(gscConnection?.isConnected && gscConnection?.selectedProperty);
    const hasGscMetrics = Boolean(
      gscAnalytics &&
        gscAnalytics.summary &&
        typeof gscAnalytics.summary.impressions === 'number' &&
        gscAnalytics.summary.impressions > 0
    );
    const serpAvailable = isGscConnected && hasGscMetrics;

    let serpScore = 0;
    if (serpAvailable && gscAnalytics?.summary) {
      const avgPos = gscAnalytics.summary.position || 25;
      const ctr = gscAnalytics.summary.ctr || 0.02;
      // Position 1.0 -> 100, Position 10.0 -> 82, Position 20.0 -> 61, Position 50+ -> 0
      const posScore = clamp(100 - ((avgPos - 1.0) * 100) / 49.0, 0, 100);
      // CTR 5% -> 100
      const ctrScore = clamp((ctr / 0.05) * 100, 0, 100);
      serpScore = clamp(Math.round(0.75 * posScore + 0.25 * ctrScore), 0, 100);
    }

    // Component 3: Organic Traffic Acquisition (#17)
    const hasTrafficData = Boolean(
      seoAnalytics &&
        seoAnalytics.totalLandings &&
        seoAnalytics.totalLandings.totalPeriod > 0
    );
    const trafficAvailable = hasTrafficData;

    let organicScore = 0;
    if (trafficAvailable && seoAnalytics) {
      if (seoAnalytics.organicLandings.totalPeriod === 0) {
        organicScore = 0;
      } else {
        // 50% organic share -> 100 score
        organicScore = clamp(
          Math.round((seoAnalytics.organicSharePercentage / 50.0) * 100),
          0,
          100
        );
      }
    }

    // Component 4: Backlinks Health & Equity (#22)
    const backlinksAvailable = trackedBacklinks.total > 0;
    let backlinksScore = 0;
    if (backlinksAvailable) {
      const uptimeRate = (trackedBacklinks.active / trackedBacklinks.total) * 100;
      const dofollowPct = (trackedBacklinks.dofollow / trackedBacklinks.total) * 100;
      const verifiedPct = (trackedBacklinks.verified / trackedBacklinks.total) * 100;
      const equityRate = 0.6 * dofollowPct + 0.4 * verifiedPct;
      const volScale = clamp(0.5 + 0.5 * (trackedBacklinks.total / 10), 0.5, 1.0);
      backlinksScore = clamp(
        Math.round(volScale * (0.7 * uptimeRate + 0.3 * equityRate)),
        0,
        100
      );
    }

    // 3. Dynamic Weight Redistribution
    // Baseline Weights: OnPage: 0.35, SERP: 0.30, Organic: 0.20, Backlinks: 0.15
    const baselineWeights = {
      onPageSeo: onPageAvailable ? 0.35 : 0,
      serpPerformance: serpAvailable ? 0.3 : 0,
      organicTraffic: trafficAvailable ? 0.2 : 0,
      backlinks: backlinksAvailable ? 0.15 : 0,
    };

    const totalAvailableWeight =
      baselineWeights.onPageSeo +
      baselineWeights.serpPerformance +
      baselineWeights.organicTraffic +
      baselineWeights.backlinks;

    // Effective weights normalized to sum to 1.0
    const effectiveWeights = {
      onPageSeo: totalAvailableWeight > 0 ? baselineWeights.onPageSeo / totalAvailableWeight : 0.35,
      serpPerformance: totalAvailableWeight > 0 ? baselineWeights.serpPerformance / totalAvailableWeight : 0,
      organicTraffic: totalAvailableWeight > 0 ? baselineWeights.organicTraffic / totalAvailableWeight : 0,
      backlinks: totalAvailableWeight > 0 ? baselineWeights.backlinks / totalAvailableWeight : 0,
    };

    // Composite Health Score
    let compositeScore = 70; // baseline when no data exists
    if (totalAvailableWeight > 0) {
      compositeScore = clamp(
        Math.round(
          onPageScore * effectiveWeights.onPageSeo +
            serpScore * effectiveWeights.serpPerformance +
            organicScore * effectiveWeights.organicTraffic +
            backlinksScore * effectiveWeights.backlinks
        ),
        0,
        100
      );
    }

    // Grade assignment
    let grade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL' = 'GOOD';
    let statusText = 'Solid SEO foundation with balanced growth telemetry.';
    if (compositeScore >= 90) {
      grade = 'EXCELLENT';
      statusText = 'Optimal on-page health, active rankings, and verified link profile.';
    } else if (compositeScore >= 75) {
      grade = 'GOOD';
      statusText = 'Healthy SEO baseline with active SERP striking-distance opportunities.';
    } else if (compositeScore >= 50) {
      grade = 'NEEDS_IMPROVEMENT';
      statusText = 'Moderate SEO gaps detected. Prioritize on-page audits and link acquisition.';
    } else {
      grade = 'CRITICAL';
      statusText = 'Critical SEO issues or low visibility require immediate attention.';
    }

    const healthIndex: LacsCommandCenterHealthIndex = {
      score: compositeScore,
      grade,
      status: statusText,
      components: {
        onPageSeo: {
          id: 'onPageSeo',
          name: 'On-Page SEO Quality',
          sourceModule: 'LACS #18',
          score: onPageScore,
          effectiveWeight: Math.round(effectiveWeights.onPageSeo * 100) / 100,
          isAvailable: onPageAvailable,
          statusLabel: onPageAvailable ? 'Catalog Audited' : 'Audit Pending',
          keyMetricLabel: 'Catalog Avg Score',
          keyMetricValue: onPageAvailable ? `${catalogAudit!.averageScore}/100` : 'Not run',
        },
        serpPerformance: {
          id: 'serpPerformance',
          name: 'SERP Visibility & Rankings',
          sourceModule: 'LACS #19',
          score: serpScore,
          effectiveWeight: Math.round(effectiveWeights.serpPerformance * 100) / 100,
          isAvailable: serpAvailable,
          statusLabel: serpAvailable ? 'Active Ranking Data' : isGscConnected ? 'Awaiting Data' : 'GSC Unlinked',
          keyMetricLabel: 'Average SERP Position',
          keyMetricValue: serpAvailable ? `#${gscAnalytics!.summary.position.toFixed(1)}` : 'N/A',
        },
        organicTraffic: {
          id: 'organicTraffic',
          name: 'Organic Search Acquisition',
          sourceModule: 'LACS #17',
          score: organicScore,
          effectiveWeight: Math.round(effectiveWeights.organicTraffic * 100) / 100,
          isAvailable: trafficAvailable,
          statusLabel: trafficAvailable ? 'Active Landings' : 'No Traffic Data',
          keyMetricLabel: 'Organic Traffic Share',
          keyMetricValue: trafficAvailable ? `${seoAnalytics!.organicSharePercentage}%` : '0%',
        },
        backlinks: {
          id: 'backlinks',
          name: 'Backlink Authority & Uptime',
          sourceModule: 'LACS #22',
          score: backlinksScore,
          effectiveWeight: Math.round(effectiveWeights.backlinks * 100) / 100,
          isAvailable: backlinksAvailable,
          statusLabel: backlinksAvailable ? `${trackedBacklinks.active} Active Links` : 'Tracker Empty',
          keyMetricLabel: 'Live Retention Rate',
          keyMetricValue: backlinksAvailable
            ? `${Math.round((trackedBacklinks.active / trackedBacklinks.total) * 100)}%`
            : '0%',
        },
      },
    };

    // 4. Extract Key Performance Indicators (KPIs)
    const trackedDofollowPct =
      trackedBacklinks.total > 0
        ? Math.round((trackedBacklinks.dofollow / trackedBacklinks.total) * 100)
        : 0;

    const kpis = {
      catalogAvgScore: catalogAudit?.averageScore ?? null,
      totalArticlesAudited: catalogAudit?.totalArticles ?? 0,
      gscConnected: isGscConnected,
      gscClicks28d: gscAnalytics?.summary?.clicks ?? null,
      gscImpressions28d: gscAnalytics?.summary?.impressions ?? null,
      gscAvgPosition28d: gscAnalytics?.summary?.position ?? null,
      organicSharePercentage: seoAnalytics?.organicSharePercentage ?? null,
      totalOrganicLandings30d: seoAnalytics?.organicLandings?.totalPeriod ?? 0,
      backlinkOpportunitiesCount: opportunitiesResult?.candidates?.length ?? 0,
      strikingDistanceCount: opportunitiesResult?.summary?.strikingDistanceCount ?? 0,
      trackedBacklinksTotal: trackedBacklinks.total,
      trackedBacklinksActive: trackedBacklinks.active,
      trackedBacklinksLostOrBroken: trackedBacklinks.lost + trackedBacklinks.broken,
      trackedBacklinksDofollowPct: trackedDofollowPct,
    };

    // 5. Generate Dynamic Consolidated Priority Actions
    const priorityActions: LacsActionItem[] = [];

    // Action A: Striking Distance Targets (from #21)
    if (opportunitiesResult && opportunitiesResult.candidates && opportunitiesResult.candidates.length > 0) {
      const strikingCandidate = opportunitiesResult.candidates.find(
        (c) => c.outreachType === 'striking_distance' || c.priority === 'HIGH'
      );
      if (strikingCandidate) {
        priorityActions.push({
          id: 'action-striking-distance',
          title: `Elevate "${strikingCandidate.targetTitle}" (SERP Striking Distance)`,
          description: `Page ranks in high-opportunity range. Acquire targeted inbound links using recommended anchors to advance onto Google Page 1.`,
          priority: 'HIGH',
          sourceModule: 'LACS #21',
          category: 'backlink_opportunity',
          targetUrl: strikingCandidate.targetUrl,
          actionText: 'View Opportunity',
          actionSection: 'backlinks',
        });
      }
    }

    // Action B: Broken or Lost Backlinks (from #22)
    const lostOrBrokenCount = trackedBacklinks.lost + trackedBacklinks.broken;
    if (lostOrBrokenCount > 0) {
      priorityActions.push({
        id: 'action-reclaim-backlinks',
        title: `Reclaim ${lostOrBrokenCount} Inactive/Broken Backlink${lostOrBrokenCount > 1 ? 's' : ''}`,
        description: `Crawler detected lost or broken external backlinks. Review crawler diagnostics and reach out to publishing webmasters to restore link equity.`,
        priority: 'HIGH',
        sourceModule: 'LACS #22',
        category: 'tracked_link',
        actionText: 'Manage Backlinks',
        actionSection: 'tracked-backlinks',
      });
    } else if (trackedBacklinks.total === 0) {
      priorityActions.push({
        id: 'action-seed-tracker',
        title: 'Seed Initial Inbound Backlinks for Tracking',
        description: 'No external backlinks are currently monitored. Add live media citations, guest posts, or directories to monitor uptime.',
        priority: 'MEDIUM',
        sourceModule: 'LACS #22',
        category: 'tracked_link',
        actionText: 'Add First Backlink',
        actionSection: 'tracked-backlinks',
      });
    }

    // Action C: On-Page Catalog Issues (from #18)
    if (catalogAudit && catalogAudit.catalogIssuesSummary) {
      const issues = catalogAudit.catalogIssuesSummary;
      if (issues.missingMetaDescriptionCount > 0) {
        priorityActions.push({
          id: 'action-meta-descriptions',
          title: `Remediate ${issues.missingMetaDescriptionCount} Articles Missing Meta Descriptions`,
          description: `Audit identified articles without unique meta descriptions, impacting SERP snippet presentation and CTR.`,
          priority: 'MEDIUM',
          sourceModule: 'LACS #18',
          category: 'on_page',
          actionText: 'Review Catalog SEO',
          actionSection: 'orphan-detector',
        });
      } else if (issues.thinContentCount > 0) {
        priorityActions.push({
          id: 'action-thin-content',
          title: `Expand ${issues.thinContentCount} Thin Articles (< 600 words)`,
          description: `Comprehensive long-form legal guides perform substantially better in statutory ranking signals.`,
          priority: 'MEDIUM',
          sourceModule: 'LACS #18',
          category: 'on_page',
          actionText: 'Review Articles',
          actionSection: 'orphan-detector',
        });
      }
    } else if (!catalogAudit) {
      priorityActions.push({
        id: 'action-run-audit',
        title: 'Run Initial Catalog-wide SEO Audit',
        description: 'Perform a baseline 11-dimension evaluation across all published catalog articles to identify ranking bottlenecks.',
        priority: 'HIGH',
        sourceModule: 'LACS #18',
        category: 'on_page',
        actionText: 'Run Audit',
        actionSection: 'orphan-detector',
      });
    }

    // Action D: GSC Configuration (from #19)
    if (!isGscConnected) {
      priorityActions.push({
        id: 'action-connect-gsc',
        title: 'Connect Google Search Console',
        description: 'Authorize GSC OAuth to stream real-time Google search clicks, query impressions, and striking-distance SERP signals.',
        priority: 'MEDIUM',
        sourceModule: 'LACS #19',
        category: 'serp',
        actionText: 'Connect GSC',
        actionSection: 'analytics',
      });
    }

    // 6. Assemble Module Statuses (Telemetry for #17–#22)
    const moduleStatuses: LacsModuleStatus[] = [
      {
        moduleId: 'lacs-18',
        name: 'Catalog SEO Health Audit',
        badge: 'LACS #18',
        status: onPageAvailable ? 'active' : 'pending',
        headline: onPageAvailable
          ? `${catalogAudit!.totalArticles} Articles Evaluated (Score: ${catalogAudit!.averageScore}/100)`
          : 'Baseline Audit Pending',
        subtext: onPageAvailable
          ? `Audited ${new Date(catalogAudit!.auditedAt).toLocaleDateString()}`
          : 'Run catalog audit to generate on-page benchmark',
        primaryMetric: {
          label: 'Catalog Score',
          value: onPageAvailable ? `${catalogAudit!.averageScore}/100` : 'Pending',
        },
        navigationSection: 'orphan-detector',
      },
      {
        moduleId: 'lacs-19',
        name: 'Google Search Console (GSC)',
        badge: 'LACS #19',
        status: serpAvailable ? 'connected' : isGscConnected ? 'warning' : 'unconfigured',
        headline: serpAvailable
          ? `${gscConnection?.selectedProperty} (Active 28d Stream)`
          : isGscConnected
          ? `${gscConnection?.selectedProperty} (Awaiting Impressions)`
          : 'OAuth Integration Unlinked',
        subtext: serpAvailable
          ? `${(gscAnalytics?.summary?.clicks || 0).toLocaleString()} clicks • ${(gscAnalytics?.summary?.impressions || 0).toLocaleString()} impressions`
          : 'Connect GSC to stream live search performance',
        primaryMetric: {
          label: '28d Clicks',
          value: serpAvailable ? (gscAnalytics?.summary?.clicks || 0).toLocaleString() : 'N/A',
        },
        navigationSection: 'analytics',
      },
      {
        moduleId: 'lacs-21',
        name: 'Backlink Opportunities',
        badge: 'LACS #21',
        status: 'active',
        headline: `${kpis.backlinkOpportunitiesCount} Acquisition Candidates Identified`,
        subtext: `${kpis.strikingDistanceCount} striking distance targets in positions 5.0–20.0`,
        primaryMetric: {
          label: 'Striking Targets',
          value: kpis.strikingDistanceCount,
        },
        navigationSection: 'backlinks',
      },
      {
        moduleId: 'lacs-22',
        name: 'Backlink Tracker & Crawler',
        badge: 'LACS #22',
        status: trackedBacklinks.total > 0 ? (lostOrBrokenCount > 0 ? 'warning' : 'active') : 'pending',
        headline: `${trackedBacklinks.active} Active Monitored Link${trackedBacklinks.active === 1 ? '' : 's'}`,
        subtext:
          trackedBacklinks.total > 0
            ? `${trackedBacklinks.dofollow} dofollow (${trackedDofollowPct}%) • ${lostOrBrokenCount} lost/broken`
            : 'Autonomous SSRF verification crawler ready',
        primaryMetric: {
          label: 'Tracked Total',
          value: trackedBacklinks.total,
        },
        navigationSection: 'tracked-backlinks',
      },
      {
        moduleId: 'lacs-17',
        name: 'Organic Search Analytics',
        badge: 'LACS #17',
        status: trafficAvailable ? 'active' : 'pending',
        headline: trafficAvailable
          ? `${seoAnalytics!.organicSharePercentage}% Organic Traffic Share`
          : 'Landing Tracking Active',
        subtext: trafficAvailable
          ? `${seoAnalytics!.organicLandings.totalPeriod} organic search sessions in 30 days`
          : 'Search referrer session attribution ready',
        primaryMetric: {
          label: 'Organic Landings',
          value: seoAnalytics?.organicLandings?.totalPeriod ?? 0,
        },
        navigationSection: 'analytics',
      },
      {
        moduleId: 'lacs-20',
        name: 'Live In-Editor SEO Meter',
        badge: 'LACS #20',
        status: 'active',
        headline: 'Embedded Instant Evaluator (~400ms Debounce)',
        subtext: 'Real-time 11-dimension scoring in Blog CMS editor',
        primaryMetric: {
          label: 'Integration',
          value: 'Active in CMS',
        },
        navigationSection: 'blogs',
      },
    ];

    return {
      generatedAt: timestamp,
      healthIndex,
      kpis,
      priorityActions,
      moduleStatuses,
    };
  }
}

export const lacsCommandCenterService = new LacsCommandCenterService();
