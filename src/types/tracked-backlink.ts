/**
 * LACS Module #22: Tracked Backlinks Types
 * Interfaces and types for backlink tracking, verification status, and CRUD operations.
 */

export type TrackedBacklinkStatus = 'active' | 'lost' | 'pending' | 'broken';
export type TrackedBacklinkLinkType = 'dofollow' | 'nofollow' | 'ugc' | 'sponsored';

export interface TrackedBacklink {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string | null;
  linkType: TrackedBacklinkLinkType;
  status: TrackedBacklinkStatus;
  httpStatus: number | null;
  isVerified: boolean;
  lastCheckedAt: string | null;
  outreachType: string | null;
  opportunityId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface TrackedBacklinksFilterOptions {
  status?: TrackedBacklinkStatus;
  linkType?: TrackedBacklinkLinkType;
  targetUrl?: string;
  sourceDomain?: string;
  search?: string;
}

export interface TrackedBacklinksResponseData {
  backlinks: TrackedBacklink[];
  summary: TrackedBacklinksSummaryStats;
}

export interface CreateTrackedBacklinkInput {
  sourceUrl: string;
  targetUrl: string;
  sourceDomain?: string;
  anchorText?: string;
  linkType?: TrackedBacklinkLinkType;
  status?: TrackedBacklinkStatus;
  outreachType?: string;
  opportunityId?: string;
  notes?: string;
}

export interface UpdateTrackedBacklinkInput {
  sourceUrl?: string;
  targetUrl?: string;
  sourceDomain?: string;
  anchorText?: string;
  linkType?: TrackedBacklinkLinkType;
  status?: TrackedBacklinkStatus;
  notes?: string;
}

export interface BatchVerificationSummary {
  processed: number;
  active: number;
  lost: number;
  broken: number;
}
