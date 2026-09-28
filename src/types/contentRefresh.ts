/**
 * Types for LACS Module #11: SEO Content Refresh / Update Suggestions
 */

export type RefreshUrgencyLevel = 'CRITICAL' | 'RECOMMENDED' | 'FRESH';

export type RefreshSignalKey =
  | 'DAYS_SINCE_UPDATE'
  | 'OUTDATED_YEAR_MENTION'
  | 'META_TAG_DEFICIT'
  | 'INTERNAL_LINK_HEALTH'
  | 'MISSING_AUTHORITY_LINK'
  | 'TRAFFIC_VISIBILITY_BOOST';

export interface RefreshSignal {
  key: RefreshSignalKey;
  points: number;
  title: string;
  description: string;
}

export interface ContentRefreshCandidate {
  id: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: string | null;
  updatedAt: string | null;
  daysSinceUpdate: number;
  urgencyScore: number;
  urgencyLevel: RefreshUrgencyLevel;
  totalPageViews: number;
  inboundLinkCount: number;
  isOrphaned: boolean;
  hasAuthorityLink: boolean;
  signals: RefreshSignal[];
}

export interface ContentRefreshSummary {
  totalArticles: number;
  criticalCount: number;
  recommendedCount: number;
  freshCount: number;
  averageUrgencyScore: number;
}

export interface ContentRefreshScanResult {
  success: boolean;
  summary: ContentRefreshSummary;
  candidates: ContentRefreshCandidate[];
  scannedAt: string;
}
