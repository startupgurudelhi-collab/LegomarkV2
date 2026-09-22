import { GoogleGenAI, Type, Schema } from '@google/genai';
import { blogRepository } from '../repositories/blog.repository';
import { serviceService } from '../services/service.service';
import { logger } from '../utils/logger';

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

const FALLBACK_SERVICES = [
  {
    title: 'Private Limited Company Registration',
    slug: 'private-limited-company',
    url: '/services/private-limited-company',
    category: 'Company Registration',
    keywords: ['private limited company', 'pvt ltd registration', 'incorporate company', 'spicce+'],
  },
  {
    title: 'Limited Liability Partnership (LLP) Registration',
    slug: 'limited-liability-partnership-llp',
    url: '/services/limited-liability-partnership-llp',
    category: 'Company Registration',
    keywords: ['llp registration', 'limited liability partnership', 'llp agreement', 'form 11'],
  },
  {
    title: 'One Person Company (OPC) Registration',
    slug: 'one-person-company-opc',
    url: '/services/one-person-company-opc',
    category: 'Company Registration',
    keywords: ['opc registration', 'one person company', 'solo entrepreneur', 'nominee director'],
  },
  {
    title: 'Section 8 (NGO / Non-Profit) Company',
    slug: 'section-8-company',
    url: '/services/section-8-company',
    category: 'Company Registration',
    keywords: ['section 8 company', 'ngo registration', 'non-profit incorporation', '12a 80g'],
  },
  {
    title: 'GST Registration',
    slug: 'gst-registration',
    url: '/services/gst-registration',
    category: 'Taxation & GST',
    keywords: ['gst registration', 'gstin application', 'gst number', 'goods and services tax'],
  },
  {
    title: 'GST Return Filing (GSTR-1 & GSTR-3B)',
    slug: 'gst-return-filing',
    url: '/services/gst-return-filing',
    category: 'Taxation & GST',
    keywords: ['gstr-3b', 'gstr-1', 'gst monthly return', 'gst return filing'],
  },
  {
    title: 'GST Annual Return (GSTR-9 & 9C)',
    slug: 'gst-annual-return-gstr-9',
    url: '/services/gst-annual-return-gstr-9',
    category: 'Taxation & GST',
    keywords: ['gstr-9', 'gstr-9c', 'gst annual audit', 'annual reconciliation'],
  },
  {
    title: 'Income Tax Return (ITR) Filing',
    slug: 'income-tax-return-itr-filing',
    url: '/services/income-tax-return-itr-filing',
    category: 'Taxation & GST',
    keywords: ['itr filing', 'income tax return', 'itr-6 corporate', 'tax audit'],
  },
  {
    title: 'TDS Return Filing',
    slug: 'tds-return-filing',
    url: '/services/tds-return-filing',
    category: 'Taxation & GST',
    keywords: ['tds return', 'form 24q', 'form 26q', 'tax deducted at source'],
  },
  {
    title: 'Trademark Registration & Protection',
    slug: 'trademark-registration',
    url: '/services/trademark-registration',
    category: 'Trademark & IP',
    keywords: ['trademark registration', 'tm application', 'brand protection', 'tm-a form'],
  },
  {
    title: 'Trademark Objection Reply & Hearing',
    slug: 'trademark-objection-reply',
    url: '/services/trademark-objection-reply',
    category: 'Trademark & IP',
    keywords: ['trademark objection', 'examination report reply', 'section 9 11', 'tm hearing'],
  },
  {
    title: 'MCA Annual Return & Compliance (AOC-4 & MGT-7)',
    slug: 'mca-annual-compliance',
    url: '/services/mca-annual-compliance',
    category: 'Compliance & ROC',
    keywords: ['aoc-4', 'mgt-7', 'mca annual filing', 'director kyc'],
  },
  {
    title: 'Director KYC (DIR-3 KYC)',
    slug: 'dir-3-kyc-director-compliance',
    url: '/services/dir-3-kyc-director-compliance',
    category: 'Compliance & ROC',
    keywords: ['dir-3 kyc', 'director identification number', 'din deactivation'],
  },
  {
    title: 'FSSAI Food License Registration',
    slug: 'fssai-food-license',
    url: '/services/fssai-food-license',
    category: 'FSSAI & Licensing',
    keywords: ['fssai license', 'food safety permit', 'state fssai', 'foscos registration'],
  },
  {
    title: 'MSME / Udyam Registration',
    slug: 'msme-udyam-registration',
    url: '/services/msme-udyam-registration',
    category: 'FSSAI & Licensing',
    keywords: ['udyam registration', 'msme certificate', 'priority sector lending'],
  },
  {
    title: 'Corporate Legal & Structural Advisory',
    slug: 'corporate-legal-advisory',
    url: '/services/corporate-legal-advisory',
    category: 'Corporate Advisory',
    keywords: ['shareholders agreement', 'term sheet', 'due diligence', 'corporate secretarial'],
  },
];

export class OrphanPageService {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  async scanOrphanPages(): Promise<OrphanPageScanResult> {
    logger.info('Starting AI Orphan Page scan across blogs & services', 'OrphanPageService');

    // 1. Fetch all blogs (published and drafts)
    let blogsList: any[] = [];
    try {
      const blogData = await blogRepository.getAdminBlogs({ status: 'all' });
      blogsList = blogData.blogs || [];
    } catch (err) {
      logger.warn('Failed to load blogs for orphan page detection', 'OrphanPageService', err);
    }

    // 2. Fetch all services
    let servicesList: any[] = FALLBACK_SERVICES;
    try {
      const dbServices = await serviceService.getAllPublicServices();
      if (dbServices && dbServices.length > 0) {
        servicesList = dbServices.map((s) => ({
          title: s.title,
          slug: s.slug,
          url: `/services/${s.slug}`,
          category: s.category || 'Legal & Corporate Services',
          keywords: [s.title.toLowerCase(), s.slug.replace(/-/g, ' ')],
        }));
      }
    } catch (err) {
      logger.warn('Using fallback services list for orphan page scan', 'OrphanPageService');
    }

    // Build list of all pages to inspect
    const allPages: Array<{
      id: string;
      title: string;
      slug: string;
      url: string;
      type: 'blog' | 'service';
      publicationStatus: 'published' | 'draft' | 'active';
      category: string;
      content: string;
      author?: string;
      excerpt?: string;
    }> = [];

    // Add blogs
    blogsList.forEach((b) => {
      allPages.push({
        id: String(b.id),
        title: b.title || 'Untitled Article',
        slug: b.slug,
        url: `/blog/${b.slug}`,
        type: 'blog',
        publicationStatus: b.isPublished ? 'published' : 'draft',
        category: b.category || 'Legal & Corporate',
        content: b.content || '',
        author: b.author,
        excerpt: b.excerpt,
      });
    });

    // Add services
    servicesList.forEach((s, idx) => {
      allPages.push({
        id: `service-${s.slug || idx}`,
        title: s.title,
        slug: s.slug,
        url: s.url || `/services/${s.slug}`,
        type: 'service',
        publicationStatus: 'active',
        category: s.category || 'Corporate Services',
        content: '',
      });
    });

    // 3. Construct Link Graph
    // Detect links inside each blog content to another page
    const incomingLinkMap = new Map<string, IncomingLinkInfo[]>();
    allPages.forEach((p) => {
      incomingLinkMap.set(p.url, []);
      incomingLinkMap.set(`/blog/${p.slug}`, []);
      incomingLinkMap.set(`/services/${p.slug}`, []);
    });

    // Scan links across all blogs
    blogsList.forEach((sourceBlog) => {
      const content = sourceBlog.content || '';
      const sourceUrl = `/blog/${sourceBlog.slug}`;

      // Search for references to other pages
      allPages.forEach((target) => {
        // Prevent self-linking count
        if (target.url === sourceUrl) return;

        // Match patterns:
        // Markdown [text](/url) or (https://.../url) or <a href="/url"> or raw path
        const escapedSlug = target.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const targetPathPattern = new RegExp(
          `(\\(|["'])(https?://[^"'/)]+)?(/blog/${escapedSlug}|/services/${escapedSlug}|/${escapedSlug})([#?"']|\\))`,
          'i'
        );

        if (targetPathPattern.test(content)) {
          const list = incomingLinkMap.get(target.url) || [];
          if (!list.some((l) => l.sourceUrl === sourceUrl)) {
            list.push({
              sourceTitle: sourceBlog.title,
              sourceUrl,
              sourceType: 'blog',
            });
            incomingLinkMap.set(target.url, list);
          }
        }
      });
    });

    // 4. Assemble Page Items with status and candidate linking sources
    const items: OrphanPageItem[] = allPages.map((page) => {
      const links = incomingLinkMap.get(page.url) || [];
      const linkCount = links.length;

      let status: 'orphaned' | 'low_links' | 'healthy' = 'healthy';
      if (linkCount === 0) {
        status = 'orphaned';
      } else if (linkCount <= 1) {
        status = 'low_links';
      }

      // Identify potential existing pages that could link to it
      const potentialSources: PotentialLinkSource[] = [];

      // Look at other blogs with matching or related categories
      blogsList.forEach((b) => {
        if (b.slug === page.slug) return;
        // Don't suggest a source that already links to it
        if (links.some((l) => l.sourceUrl === `/blog/${b.slug}`)) return;

        let relevance = 0;
        let suggestedAnchor = page.title;
        let reason = '';

        const bText = `${b.title} ${b.category} ${b.content || ''}`.toLowerCase();
        const pWords = page.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

        // Check category match
        if (b.category && page.category && b.category.toLowerCase() === page.category.toLowerCase()) {
          relevance += 3;
        }

        // Check word overlap
        const matchingWords = pWords.filter((w) => bText.includes(w));
        relevance += matchingWords.length;

        if (relevance > 0 || potentialSources.length < 2) {
          if (page.type === 'service') {
            suggestedAnchor = page.title.replace(/\b(Registration|Filing|Services?)\b/gi, '').trim() || page.title;
            reason = `High topical relevance in ${b.category}; funnels educational readership directly into commercial ${page.title}.`;
          } else {
            suggestedAnchor = page.title.length > 35 ? page.title.slice(0, 35) + '...' : page.title;
            reason = `Thematic alignment with ${b.title}; passes topical equity and strengthens internal blog clustering.`;
          }

          potentialSources.push({
            sourceId: String(b.id),
            sourceTitle: b.title,
            sourceUrl: `/blog/${b.slug}`,
            suggestedAnchorText: suggestedAnchor,
            relevanceReason: reason,
          });
        }
      });

      // Sort potential sources and limit to top 3
      const topPotentialSources = potentialSources.slice(0, 3);

      // Generate suggested action
      let suggestedAction = '';
      if (status === 'orphaned') {
        if (topPotentialSources.length > 0) {
          suggestedAction = `CRITICAL ORPHAN: Zero incoming links found. Add at least 2 internal links from "${topPotentialSources[0].sourceTitle}" and other related ${page.category} articles using anchor "${topPotentialSources[0].suggestedAnchorText}".`;
        } else {
          suggestedAction = `CRITICAL ORPHAN: Add contextual links from high-authority pillar articles in ${page.category} to allow search crawlers and users to discover this page.`;
        }
      } else if (status === 'low_links') {
        if (topPotentialSources.length > 0) {
          suggestedAction = `LOW LINK EQUITY: Only 1 incoming link detected. Boost topical distribution by linking from "${topPotentialSources[0].sourceTitle}" with anchor "${topPotentialSources[0].suggestedAnchorText}".`;
        } else {
          suggestedAction = `LOW LINK EQUITY: Add 1-2 additional contextual links from related guides to solidify topic cluster hierarchy.`;
        }
      } else {
        suggestedAction = `HEALTHY: Well-integrated in internal link architecture (${linkCount} inbound links detected). Maintain anchor text naturalness.`;
      }

      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        url: page.url,
        type: page.type,
        publicationStatus: page.publicationStatus,
        category: page.category,
        incomingLinkCount: linkCount,
        incomingLinks: links,
        status,
        suggestedAction,
        potentialSources: topPotentialSources,
        contentSample: page.content ? page.content.slice(0, 200) : undefined,
        rawContent: page.content,
        author: page.author,
        excerpt: page.excerpt,
      };
    });

    // Sort: Orphaned first, then Low Links, then Healthy
    items.sort((a, b) => {
      const order = { orphaned: 0, low_links: 1, healthy: 2 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return a.incomingLinkCount - b.incomingLinkCount;
    });

    // Summary stats
    const totalBlogs = allPages.filter((p) => p.type === 'blog').length;
    const totalServices = allPages.filter((p) => p.type === 'service').length;
    const orphanedCount = items.filter((i) => i.status === 'orphaned').length;
    const lowLinksCount = items.filter((i) => i.status === 'low_links').length;
    const healthyCount = items.filter((i) => i.status === 'healthy').length;

    return {
      summary: {
        totalPages: items.length,
        totalBlogs,
        totalServices,
        orphanedCount,
        lowLinksCount,
        healthyCount,
      },
      pages: items,
      scannedAt: new Date().toISOString(),
    };
  }
}

export const orphanPageService = new OrphanPageService();
