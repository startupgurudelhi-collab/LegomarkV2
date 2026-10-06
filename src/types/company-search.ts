/**
 * Types for Company Name Search & MCA Rule 8 Compliance
 */

export type EntityType =
  | 'private_limited'
  | 'llp'
  | 'opc'
  | 'public_limited'
  | 'section_8';

export interface RuleCheckResult {
  id: string;
  title: string;
  passed: boolean;
  severity: 'success' | 'warning' | 'error';
  description: string;
  mcaReference?: string;
}

export interface SimilarNameResult {
  name: string;
  similarity: number; // 0-100 percentage
  status: 'registered' | 'trademark_conflict' | 'phonetic_match';
  entityType?: string;
  cin?: string;
  companyStatus?: string;
  roc?: string;
  source?: 'mca_api' | 'local_heuristic';
}

export interface NameSearchRequest {
  name: string;
  entityType?: EntityType;
  activityCategory?: string;
}

export interface BrandPresenceSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface BrandEntityFound {
  name: string;
  description: string;
  url?: string;
  usageStrength: 'strong' | 'moderate' | 'weak';
}

export interface OnlineBrandPresenceResult {
  riskLevel: 'low' | 'medium' | 'high';
  findingSummary: string;
  hasCommercialUsage: boolean;
  brandsFound: BrandEntityFound[];
  sources: BrandPresenceSource[];
  status: 'completed' | 'no_evidence' | 'unavailable';
}

export interface CombinedAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  mcaRisk: 'low' | 'medium' | 'high';
  brandRisk: 'low' | 'medium' | 'high';
  guidance: string;
}

export interface NameSearchResponse {
  query: string;
  entityType: EntityType;
  normalizedName: string;
  fullProposedName: string;
  isAvailable: boolean;
  availabilityScore: number; // 0–100 (Overall Combined Score: 70% MCA + 30% Web Brand)
  overallScore?: number; // 0–100 Overall Combined Name Strength Score
  mcaScore?: number; // 0–100 MCA Rule 8 Assessment Score (70% weight)
  brandScore?: number; // 0–100 Online Brand Presence Score (30% weight)
  summary: string;
  checks: RuleCheckResult[];
  prohibitedWordsFound: string[];
  similarRegisteredNames: SimilarNameResult[];
  mcaRegisteredNames?: SimilarNameResult[];
  heuristicRegisteredNames?: SimilarNameResult[];
  mcaApiStatus?: 'connected' | 'no_records' | 'error' | 'unconfigured';
  mcaSource?: 'live_mca_api' | 'local_heuristic';
  onlineBrandPresence?: OnlineBrandPresenceResult;
  combinedAssessment?: CombinedAssessment;
  timestamp: string;
}
