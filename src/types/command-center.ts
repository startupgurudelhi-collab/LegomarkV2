/**
 * LACS Module #23: Command Center Types
 * Synthesizes health metrics, KPIs, priority action queues, and module telemetry.
 */

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

export interface LacsCommandCenterKpis {
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
}

export interface LacsCommandCenterOverview {
  generatedAt: string;
  healthIndex: LacsCommandCenterHealthIndex;
  kpis: LacsCommandCenterKpis;
  priorityActions: LacsActionItem[];
  moduleStatuses: LacsModuleStatus[];
}
