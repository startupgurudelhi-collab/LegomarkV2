export type InternalLinkType = 'service_to_service' | 'blog_to_service' | 'blog_to_blog';

export interface InternalLinkOpportunity {
  id: string;
  linkType: InternalLinkType;
  sourceType: 'service' | 'blog';
  sourceId: string;
  sourceBlogId?: string; // backward compatibility
  sourceTitle: string;
  sourceSlug: string;
  sourceUrl: string;
  sourceCategory?: string;
  targetType: 'service' | 'blog';
  targetId?: string;
  targetTitle: string;
  targetSlug: string;
  targetUrl: string;
  anchorText: string;
  contextSnippet?: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface InboundLinkAuditItem {
  id: string;
  title: string;
  slug: string;
  url: string;
  type: 'service' | 'blog';
  category: string;
  incomingLinkCount: number;
  status: 'orphaned' | 'low_links' | 'healthy';
  incomingSources: Array<{
    sourceTitle: string;
    sourceUrl: string;
    sourceType: 'service' | 'blog';
  }>;
}

export interface InboundLinkAuditSummary {
  totalPages: number;
  totalServices: number;
  totalBlogs: number;
  orphanedCount: number;
  lowLinksCount: number;
  healthyCount: number;
}

export interface InternalLinkingScanResult {
  totalScannedBlogs: number;
  totalScannedServices: number;
  suggestions: InternalLinkOpportunity[];
  scannedAt: string;
  inboundAudit?: {
    summary: InboundLinkAuditSummary;
    pages: InboundLinkAuditItem[];
  };
}
