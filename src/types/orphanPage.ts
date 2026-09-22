export interface PotentialLinkSource {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  suggestedAnchorText: string;
  relevanceReason: string;
}

export interface IncomingLinkInfo {
  sourceTitle: string;
  sourceUrl: string;
  sourceType: 'blog' | 'service';
}

export interface OrphanPageItem {
  id: string;
  title: string;
  slug: string;
  url: string;
  type: 'blog' | 'service';
  publicationStatus: 'published' | 'draft' | 'active';
  category: string;
  incomingLinkCount: number;
  incomingLinks: IncomingLinkInfo[];
  status: 'orphaned' | 'low_links' | 'healthy';
  suggestedAction: string;
  potentialSources: PotentialLinkSource[];
  contentSample?: string;
  rawContent?: string;
  author?: string;
  excerpt?: string;
}

export interface OrphanPageScanResult {
  summary: {
    totalPages: number;
    totalBlogs: number;
    totalServices: number;
    orphanedCount: number;
    lowLinksCount: number;
    healthyCount: number;
  };
  pages: OrphanPageItem[];
  scannedAt: string;
}
