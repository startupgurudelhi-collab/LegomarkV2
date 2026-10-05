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

export interface NameSearchResponse {
  query: string;
  entityType: EntityType;
  normalizedName: string;
  fullProposedName: string;
  isAvailable: boolean;
  availabilityScore: number; // 0–100
  summary: string;
  checks: RuleCheckResult[];
  prohibitedWordsFound: string[];
  similarRegisteredNames: SimilarNameResult[];
  mcaRegisteredNames?: SimilarNameResult[];
  heuristicRegisteredNames?: SimilarNameResult[];
  mcaApiStatus?: 'connected' | 'no_records' | 'error' | 'unconfigured';
  mcaSource?: 'live_mca_api' | 'local_heuristic';
  timestamp: string;
}
