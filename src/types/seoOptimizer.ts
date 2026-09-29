export interface SeoDimensionAudit {
  score: number;
  maxScore: number;
  status: 'good' | 'warning' | 'critical';
  title: string;
  summary: string;
  currentValue?: string;
  recommendedValue?: string;
  details: string[];
}

export interface SeoRecommendation {
  id: string;
  dimension:
    | 'SEO Title'
    | 'Meta Description'
    | 'Focus Keyword'
    | 'Keyword Usage'
    | 'H1/H2/H3 Structure'
    | 'Content Length'
    | 'Readability'
    | 'Internal Links'
    | 'Image/Alt Text'
    | 'URL Slug'
    | 'FAQ Opportunities';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedAction: string;
  currentValue?: string;
  recommendedValue?: string;
}

export interface FaqOpportunity {
  question: string;
  suggestedAnswerOutline: string;
  intentRationale: string;
  relevance: 'High' | 'Medium';
}

export interface HeadingItem {
  level: number;
  text: string;
  hasKeyword?: boolean;
}

export interface LinkItem {
  text: string;
  href: string;
  isInternal: boolean;
  isGenericAnchor: boolean;
}

export interface ImageAuditItem {
  src: string;
  alt: string;
  hasAlt: boolean;
  isFilenameAlt: boolean;
}

export interface SeoAnalysisResult {
  legomarkScore: number; // 0 to 100
  scoreGrade: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical';
  diagnosticDisclaimer: string;
  analyzedAt: string;
  article: {
    id?: string;
    title: string;
    slug: string;
    category: string;
    author: string;
    isPublished: boolean;
  };
  focusKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  dimensions: {
    seoTitle: SeoDimensionAudit;
    metaDescription: SeoDimensionAudit;
    focusKeyword: SeoDimensionAudit;
    keywordUsage: SeoDimensionAudit;
    headingStructure: SeoDimensionAudit;
    contentLength: SeoDimensionAudit;
    readability: SeoDimensionAudit;
    internalLinks: SeoDimensionAudit;
    imagesAlt: SeoDimensionAudit;
    urlSlug: SeoDimensionAudit;
    faqOpportunities: SeoDimensionAudit;
  };
  metrics: {
    wordCount: number;
    characterCount: number;
    readingTimeMinutes: number;
    fleschReadingEase: number;
    readabilityLevel: string;
    headings: HeadingItem[];
    h1Count: number;
    h2Count: number;
    h3Count: number;
    links: LinkItem[];
    internalLinkCount: number;
    externalLinkCount: number;
    images: ImageAuditItem[];
    imageCount: number;
    missingAltCount: number;
    keywordDensityPercent: number;
    keywordOccurrences: number;
    hasFeaturedImage: boolean;
  };
  recommendations: SeoRecommendation[];
  faqOpportunities: FaqOpportunity[];
  suggestedInternalLinkTargets: Array<{
    serviceTitle: string;
    serviceSlug: string;
    recommendedAnchorText: string;
    context: string;
  }>;
}

export interface AnalyzeBlogSeoInput {
  blogId?: string;
  blog?: any;
  focusKeyword?: string;
}

export interface ArticleDeterministicAudit {
  articleId?: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  publishedAt?: string | null;
  score: number;
  grade: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical';
  wordCount: number;
  readingTimeMinutes: number;
  fleschScore: number;
  readabilityLevel: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  internalLinkCount: number;
  externalLinkCount: number;
  imageCount: number;
  missingAltCount: number;
  hasFeaturedImage: boolean;
  focusKeyword: string;
  keywordDensityPercent: number;
  keywordOccurrences: number;
  dimensions: {
    seoTitle: SeoDimensionAudit;
    metaDescription: SeoDimensionAudit;
    focusKeyword: SeoDimensionAudit;
    keywordUsage: SeoDimensionAudit;
    headingStructure: SeoDimensionAudit;
    contentLength: SeoDimensionAudit;
    readability: SeoDimensionAudit;
    internalLinks: SeoDimensionAudit;
    imagesAlt: SeoDimensionAudit;
    urlSlug: SeoDimensionAudit;
    faqOpportunities: SeoDimensionAudit;
  };
  criticalIssuesCount: number;
  warningsCount: number;
  recommendations: SeoRecommendation[];
}

export interface CatalogSeoAuditResult {
  auditedAt: string;
  totalArticles: number;
  averageScore: number;
  gradeDistribution: {
    excellent: number;
    good: number;
    needsImprovement: number;
    critical: number;
  };
  dimensionSummaries: {
    [key: string]: {
      averageScore: number;
      maxScore: number;
      criticalCount: number;
      warningCount: number;
      goodCount: number;
    };
  };
  catalogIssuesSummary: {
    missingMetaDescriptionCount: number;
    shortTitleCount: number;
    thinContentCount: number;
    missingAltCount: number;
    zeroInternalLinksCount: number;
    missingFaqSectionCount: number;
  };
  articles: ArticleDeterministicAudit[];
}
