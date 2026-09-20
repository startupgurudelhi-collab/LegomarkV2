export interface KeywordClusterResult {
  topic: string;
  targetService?: string;
  searchIntent: {
    primaryIntent: string; // e.g., 'Commercial', 'Informational', 'Transactional', 'Navigational'
    explanation: string;
    targetAudience: string;
  };
  primaryKeyword: {
    keyword: string;
    estimatedCompetition?: 'Low' | 'Medium' | 'High';
    rationale?: string;
  };
  secondaryKeywords: Array<{
    keyword: string;
    relevance?: string;
  }>;
  longTailKeywords: Array<{
    keyword: string;
    userQueryContext?: string;
  }>;
  questionKeywords: Array<{
    question: string;
    intentType?: string;
  }>;
  summary?: string;
}

export interface GenerateKeywordClusterInput {
  topic: string;
  targetService?: string;
}
