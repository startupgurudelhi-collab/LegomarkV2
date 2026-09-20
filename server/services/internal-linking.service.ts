import { GoogleGenAI, Type, Schema } from '@google/genai';
import { blogRepository } from '../repositories/blog.repository';
import { serviceService } from '../services/service.service';
import { logger } from '../utils/logger';

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

// Fallback services catalog in case database is cold/offline
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

export class InternalLinkingService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    return new GoogleGenAI({ apiKey });
  }

  async scanInternalLinks(): Promise<InternalLinkingScanResult> {
    logger.info('Starting AI Internal Linking scan', 'InternalLinkingService');

    // 1. Gather existing blogs
    let blogsList: any[] = [];
    try {
      const blogData = await blogRepository.getAdminBlogs({ status: 'all' });
      blogsList = blogData.blogs || [];
    } catch (err) {
      logger.warn('Failed to load blogs from repository, using fallback', 'InternalLinkingService', err);
    }

    if (!blogsList || blogsList.length === 0) {
      logger.info('No blogs in database, fetching public blog list', 'InternalLinkingService');
    }

    // 2. Gather active services
    let servicesList = FALLBACK_SERVICES;
    try {
      const dbServices = await serviceService.getAllPublicServices();
      if (dbServices && dbServices.length > 0) {
        servicesList = dbServices.map((s) => ({
          title: s.title,
          slug: s.slug,
          url: `/services/${s.slug}`,
          category: s.category || 'Legal & Corporate Services',
          keywords: [s.title.toLowerCase()],
        }));
      }
    } catch (err) {
      logger.warn('Using fallback services list for scan', 'InternalLinkingService');
    }

    // Prepare content summary of blogs for AI evaluation (keep payload concise to preserve tokens)
    const blogCorpus = blogsList.map((b) => {
      const cleanContent = (b.content || '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/#+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Sample first 1200 characters of each blog
      const sample = cleanContent.slice(0, 1200);

      return {
        id: b.id,
        title: b.title,
        slug: b.slug,
        category: b.category,
        url: `/blog/${b.slug}`,
        excerpt: b.excerpt || sample.slice(0, 180),
        sampleContent: sample,
      };
    });

    // Prepare target services summary
    const serviceTargets = servicesList.map((s) => ({
      title: s.title,
      url: s.url,
      category: s.category,
      keywords: s.keywords?.slice(0, 3).join(', '),
    }));

    // If there are no blogs at all, provide high-value seed opportunities
    if (blogCorpus.length === 0) {
      return {
        totalScannedBlogs: 0,
        totalScannedServices: serviceTargets.length,
        suggestions: [],
        scannedAt: new Date().toISOString(),
      };
    }

    const ai = this.getClient();

    const prompt = `You are a premier Technical SEO and Corporate Legal Content Strategist for LEGOMARK INDIA (legomarkindia.com).

Analyze the following list of existing blog articles and high-value target service pages to identify the most commercially impactful and contextually natural internal linking opportunities:

TARGET SERVICES (to link to):
${JSON.stringify(serviceTargets.slice(0, 16), null, 2)}

SOURCE BLOG ARTICLES (to add links inside):
${JSON.stringify(blogCorpus.slice(0, 10), null, 2)}

INSTRUCTIONS & RULES:
1. For each identified opportunity:
   - sourceBlogId: Exact ID of the source blog article from the list above.
   - sourceTitle: Title of the source blog.
   - sourceSlug: Slug of the source blog.
   - targetType: 'service' (linking to a service page) or 'blog' (linking to a related blog).
   - targetTitle: Exact title of the target service or target blog.
   - targetUrl: Exact relative URL of target (e.g., /services/private-limited-company or /blog/trademark-registration-guide).
   - anchorText: The exact or natural phrase (2 to 6 words) present or suitable in the source article. Must be descriptive, natural, and never generic (never use "click here", "read more", "this link").
   - contextSnippet: A concise sentence showing how the anchor text should naturally be linked inside the article body.
   - reason: Clear, compelling commercial and SEO rationale (e.g., "Direct commercial intent for company registration; passes topical equity from guide to service page").
2. Prioritize high-intent commercial service pages (e.g. Private Limited Company Registration, Trademark Registration, GST Return Filing, MCA Annual Compliance).
3. Ensure anchor texts are grammatically natural within Indian corporate law context.
4. Suggest between 4 and 10 high-quality internal link opportunities.`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        opportunities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceBlogId: { type: Type.STRING },
              sourceTitle: { type: Type.STRING },
              sourceSlug: { type: Type.STRING },
              targetType: { type: Type.STRING, description: "'service' or 'blog'" },
              targetTitle: { type: Type.STRING },
              targetUrl: { type: Type.STRING },
              anchorText: { type: Type.STRING },
              contextSnippet: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: [
              'sourceBlogId',
              'sourceTitle',
              'sourceSlug',
              'targetType',
              'targetTitle',
              'targetUrl',
              'anchorText',
              'reason',
            ],
          },
        },
      },
      required: ['opportunities'],
    };

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let responseText: string | null = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.3,
          },
        });
        if (res && res.text) {
          responseText = res.text.trim();
          logger.info(`Successfully generated internal link suggestions using: ${modelName}`, 'InternalLinkingService');
          break;
        }
      } catch (err: any) {
        lastError = err;
        logger.warn(`Failed internal linking scan with ${modelName}: ${err?.message || err}. Trying fallback...`, 'InternalLinkingService');
      }
    }

    let parsedSuggestions: any[] = [];
    if (responseText) {
      try {
        const parsed = JSON.parse(responseText);
        parsedSuggestions = Array.isArray(parsed.opportunities) ? parsed.opportunities : [];
      } catch (e) {
        logger.error('Failed to parse Gemini response as JSON', 'InternalLinkingService', e);
      }
    }

    // If AI output was empty or errored, build rule-based contextual links from corpus
    if (parsedSuggestions.length === 0) {
      parsedSuggestions = this.buildRuleBasedOpportunities(blogCorpus, serviceTargets);
    }

    // Map and sanitize
    const normalized: InternalLinkOpportunity[] = parsedSuggestions.map((item, index) => {
      const targetType: 'service' | 'blog' = item.targetType === 'blog' ? 'blog' : 'service';
      return {
        id: `link-${index + 1}-${Date.now().toString(36)}`,
        sourceBlogId: String(item.sourceBlogId || blogCorpus[0]?.id || '1'),
        sourceTitle: String(item.sourceTitle || blogCorpus[0]?.title || 'Blog Article'),
        sourceSlug: String(item.sourceSlug || blogCorpus[0]?.slug || 'blog-article'),
        sourceCategory: blogCorpus.find((b) => b.id === item.sourceBlogId)?.category,
        targetType,
        targetTitle: String(item.targetTitle || 'Corporate Service'),
        targetUrl: String(item.targetUrl || '/services'),
        anchorText: String(item.anchorText || 'legal and compliance services'),
        contextSnippet: item.contextSnippet ? String(item.contextSnippet) : undefined,
        reason: String(item.reason || 'Contextual relevance and commercial authority distribution.'),
        status: 'pending',
      };
    });

    return {
      totalScannedBlogs: blogCorpus.length,
      totalScannedServices: serviceTargets.length,
      suggestions: normalized,
      scannedAt: new Date().toISOString(),
    };
  }

  private buildRuleBasedOpportunities(
    blogCorpus: any[],
    services: any[]
  ): any[] {
    const suggestions: any[] = [];

    // Match keywords in blogs against service titles
    blogCorpus.forEach((blog) => {
      const contentLower = `${blog.title} ${blog.sampleContent}`.toLowerCase();

      services.forEach((service) => {
        const titleWords = service.title.toLowerCase();
        if (contentLower.includes('private limited') && service.slug.includes('private-limited')) {
          suggestions.push({
            sourceBlogId: blog.id,
            sourceTitle: blog.title,
            sourceSlug: blog.slug,
            targetType: 'service',
            targetTitle: service.title,
            targetUrl: service.url,
            anchorText: 'register a private limited company',
            contextSnippet: 'Entrepreneurs looking to scale in India should register a private limited company to protect personal assets.',
            reason: 'High commercial intent: Directly funnels company incorporation readers to the official registration service.',
          });
        } else if (contentLower.includes('trademark') && service.slug.includes('trademark-registration')) {
          suggestions.push({
            sourceBlogId: blog.id,
            sourceTitle: blog.title,
            sourceSlug: blog.slug,
            targetType: 'service',
            targetTitle: service.title,
            targetUrl: service.url,
            anchorText: 'trademark registration in India',
            contextSnippet: 'Securing trademark registration in India grants statutory brand ownership and nationwide defense against counterfeiters.',
            reason: 'Brand equity: Connects IP articles directly to the trademark filing workflow.',
          });
        } else if (contentLower.includes('gst') && service.slug.includes('gst-registration')) {
          suggestions.push({
            sourceBlogId: blog.id,
            sourceTitle: blog.title,
            sourceSlug: blog.slug,
            targetType: 'service',
            targetTitle: service.title,
            targetUrl: service.url,
            anchorText: 'mandatory GST registration',
            contextSnippet: 'Businesses surpassing statutory turnover thresholds must complete mandatory GST registration without delay.',
            reason: 'Statutory compliance: Guides readers with taxable supply to GST advisory and registration services.',
          });
        } else if (contentLower.includes('mca') && service.slug.includes('mca-annual')) {
          suggestions.push({
            sourceBlogId: blog.id,
            sourceTitle: blog.title,
            sourceSlug: blog.slug,
            targetType: 'service',
            targetTitle: service.title,
            targetUrl: service.url,
            anchorText: 'annual MCA compliance filings',
            contextSnippet: 'Directors must ensure timely submission of annual MCA compliance filings to avoid heavy statutory penalties.',
            reason: 'ROC Governance: Directs readers to professional annual secretarial filing packages.',
          });
        }
      });
    });

    // Remove duplicates
    const unique = suggestions.filter(
      (v, i, a) => a.findIndex((t) => t.sourceBlogId === v.sourceBlogId && t.targetUrl === v.targetUrl) === i
    );

    return unique.slice(0, 8);
  }
}

export const internalLinkingService = new InternalLinkingService();
