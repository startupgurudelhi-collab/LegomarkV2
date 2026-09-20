export interface InternalLinkOpportunity {
  id: string;
  sourceBlogId: string;
  sourceTitle: string;
  sourceSlug: string;
  sourceCategory?: string;
  targetType: 'service' | 'blog';
  targetTitle: string;
  targetUrl: string;
  anchorText: string;
  contextSnippet?: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface InternalLinkingScanResult {
  totalScannedBlogs: number;
  totalScannedServices: number;
  suggestions: InternalLinkOpportunity[];
  scannedAt: string;
}
