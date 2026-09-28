/**
 * Types for AI Authority Link Suggestions V1
 */

export type AuthorityCategory =
  | 'MCA'
  | 'GST'
  | 'Income Tax'
  | 'IP India'
  | 'FSSAI'
  | 'RBI'
  | 'DGFT'
  | 'MSME'
  | 'Labor & PF';

export interface AuthoritySource {
  id: string;
  sourceName: string;
  authorityCategory: AuthorityCategory;
  domain: string;
  targetUrl: string;
  isGovernmentPortal: boolean;
  defaultAnchorText: string;
  primaryCategories: string[];
  statutoryKeywords: string[];
  rationaleTemplate: string;
  contextSnippetTemplate: string;
  recommendedPlacement: string;
}

export interface AuthorityLinkSuggestion {
  id: string;
  sourceName: string;
  authorityCategory: AuthorityCategory;
  domain: string;
  targetUrl: string;
  isGovernmentPortal: boolean;
  suggestedAnchorText: string;
  relevanceReason: string;
  contextSnippet: string;
  placementRecommendation: string;
  relevanceScore: number;
}
