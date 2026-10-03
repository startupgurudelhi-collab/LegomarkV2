/**
 * LACS Module #21: Backlink Opportunities & SERP Elevation Types
 * Derived deterministically from Google Search Console and catalog architecture.
 */

export type BacklinkOutreachType =
  | 'striking_distance'
  | 'resource_guide'
  | 'statutory_citation'
  | 'commercial_intent'
  | 'unlinked_brand_mention';

export type BacklinkPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BacklinkGscMetric {
  primaryQuery: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  isStrikingDistance: boolean; // Position between 5.0 and 20.0
  secondaryQueries?: string[];
}

export interface BacklinkOutreachStrategy {
  angle: string;
  targetProspectType: string;
  suggestedSubjectLine: string;
  pitchTemplate: string;
}

export interface BacklinkOpportunityCandidate {
  id: string;
  targetUrl: string;
  canonicalUrl: string;
  targetTitle: string;
  targetType: 'blog' | 'service';
  category: string;
  outreachType: BacklinkOutreachType;
  priority: BacklinkPriority;
  priorityScore: number;
  rationale: string;
  gscMetrics?: BacklinkGscMetric;
  recommendedAnchors: string[];
  outreachStrategy: BacklinkOutreachStrategy;
  contentExcerpt?: string;
  publishedAt?: string;
}

export interface BacklinkOpportunitySummary {
  totalCandidates: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  strikingDistanceCount: number;
  byOutreachType: Record<BacklinkOutreachType, number>;
  gscConnected: boolean;
  selectedProperty: string | null;
  gscDataAvailable: boolean;
  totalGscImpressionsAnalyzed: number;
}

export interface BacklinkOpportunityResult {
  summary: BacklinkOpportunitySummary;
  candidates: BacklinkOpportunityCandidate[];
  generatedAt: string;
}

export interface BacklinkOpportunityFilterOptions {
  days?: number;
  outreachType?: BacklinkOutreachType;
  priority?: BacklinkPriority;
  onlyStrikingDistance?: boolean;
  minImpressions?: number;
  limit?: number;
}
