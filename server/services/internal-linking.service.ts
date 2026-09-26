import { GoogleGenAI, Type, Schema } from '@google/genai';
import { blogRepository } from '../repositories/blog.repository';
import { serviceRepository } from '../repositories/service.repository';
import { logger } from '../utils/logger';

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

export class InternalLinkingService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Scan internal links dynamically across ALL active services and blogs
   */
  async scanInternalLinks(): Promise<InternalLinkingScanResult> {
    logger.info('Starting Dynamic AI Internal Linking scan', 'InternalLinkingService');

    // 1. Read existing blogs dynamically from PostgreSQL
    let blogsList: any[] = [];
    try {
      const blogData = await blogRepository.getAdminBlogs({ status: 'all' });
      blogsList = blogData.blogs || [];
    } catch (err) {
      logger.warn('Failed to load blogs from repository for internal linking', 'InternalLinkingService', err);
    }

    // 2. Read ALL currently active services dynamically from PostgreSQL
    let rawServices: any[] = [];
    try {
      rawServices = await serviceRepository.getAllPublicServices();
    } catch (err) {
      logger.error('Failed to load active services from repository', 'InternalLinkingService', err);
    }

    const servicesList = (rawServices || []).map((s) => ({
      id: String(s.id),
      title: s.title,
      slug: s.slug,
      url: `/services/${s.slug}`,
      category: s.category || 'Corporate Services',
      shortDesc: s.shortDesc || '',
      fullDesc: s.fullDesc || '',
      features: Array.isArray(s.features) ? s.features : [],
    }));

    logger.info(
      `Loaded ${blogsList.length} blogs and ${servicesList.length} active services dynamically`,
      'InternalLinkingService'
    );

    // 3. Build unified Inbound Link Audit (Orphan / Low Link Detection)
    const allPages: Array<{
      id: string;
      title: string;
      slug: string;
      url: string;
      type: 'service' | 'blog';
      category: string;
      content: string;
    }> = [];

    // Map blogs
    blogsList.forEach((b) => {
      allPages.push({
        id: String(b.id),
        title: b.title || 'Untitled Blog',
        slug: b.slug,
        url: `/blog/${b.slug}`,
        type: 'blog',
        category: b.category || 'Legal & Tax Insights',
        content: b.content || '',
      });
    });

    // Map services
    servicesList.forEach((s) => {
      const serviceContent = `${s.shortDesc} ${s.fullDesc} ${s.features.join(' ')}`;
      allPages.push({
        id: s.id,
        title: s.title,
        slug: s.slug,
        url: s.url,
        type: 'service',
        category: s.category,
        content: serviceContent,
      });
    });

    // Construct inbound link map
    const incomingLinkMap = new Map<
      string,
      Array<{ sourceTitle: string; sourceUrl: string; sourceType: 'service' | 'blog' }>
    >();

    allPages.forEach((p) => {
      incomingLinkMap.set(p.url, []);
      incomingLinkMap.set(`/${p.type === 'service' ? 'services' : 'blog'}/${p.slug}`, []);
    });

    // Scan links across all pages
    allPages.forEach((sourcePage) => {
      const content = sourcePage.content || '';
      if (!content) return;

      allPages.forEach((targetPage) => {
        // Prevent self-linking count
        if (targetPage.url === sourcePage.url || targetPage.slug === sourcePage.slug) return;

        const escapedSlug = targetPage.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match patterns:
        // Markdown [text](/url) or (https://.../url) or <a href="/url"> or relative link
        const targetPattern = new RegExp(
          `(\\(|["'])(https?://[^"'/)]+)?(/(services|blog)/${escapedSlug}|/${escapedSlug})([#?"']|\\))`,
          'i'
        );

        if (targetPattern.test(content)) {
          const list = incomingLinkMap.get(targetPage.url) || [];
          if (!list.some((l) => l.sourceUrl === sourcePage.url)) {
            list.push({
              sourceTitle: sourcePage.title,
              sourceUrl: sourcePage.url,
              sourceType: sourcePage.type,
            });
            incomingLinkMap.set(targetPage.url, list);
          }
        }
      });
    });

    // Compute orphan audit items
    const auditPages: InboundLinkAuditItem[] = allPages.map((page) => {
      const links = incomingLinkMap.get(page.url) || [];
      const linkCount = links.length;

      let status: 'orphaned' | 'low_links' | 'healthy' = 'healthy';
      if (linkCount === 0) {
        status = 'orphaned';
      } else if (linkCount === 1) {
        status = 'low_links';
      }

      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        url: page.url,
        type: page.type,
        category: page.category,
        incomingLinkCount: linkCount,
        status,
        incomingSources: links,
      };
    });

    const orphanedCount = auditPages.filter((p) => p.status === 'orphaned').length;
    const lowLinksCount = auditPages.filter((p) => p.status === 'low_links').length;
    const healthyCount = auditPages.filter((p) => p.status === 'healthy').length;

    const inboundAudit = {
      summary: {
        totalPages: auditPages.length,
        totalServices: servicesList.length,
        totalBlogs: blogsList.length,
        orphanedCount,
        lowLinksCount,
        healthyCount,
      },
      pages: auditPages,
    };

    // 4. Prepare Corpus for AI Link Suggestion
    const blogCorpus = blogsList.map((b) => {
      const cleanContent = (b.content || '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/#+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const sample = cleanContent.slice(0, 1000);
      return {
        id: String(b.id),
        title: b.title,
        slug: b.slug,
        category: b.category,
        url: `/blog/${b.slug}`,
        sampleContent: sample,
      };
    });

    const serviceTargets = servicesList.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      url: s.url,
      category: s.category,
      shortDesc: s.shortDesc?.slice(0, 150),
    }));

    // If both services and blogs are empty, return early
    if (servicesList.length === 0 && blogCorpus.length === 0) {
      return {
        totalScannedBlogs: 0,
        totalScannedServices: 0,
        suggestions: [],
        scannedAt: new Date().toISOString(),
        inboundAudit,
      };
    }

    let parsedSuggestions: any[] = [];

    // 5. Query Gemini AI for 3 Types of Internal Links
    try {
      const ai = this.getClient();

      const prompt = `You are the Senior Technical SEO and Commercial Legal Content Strategist for LEGOMARK INDIA (legomarkindia.com).

Analyze the following DYNAMIC database of active corporate services and existing blog articles to find the most impactful, natural internal linking opportunities:

ALL ACTIVE SERVICES (${serviceTargets.length} services currently live):
${JSON.stringify(serviceTargets, null, 2)}

EXISTING BLOG ARTICLES (${blogCorpus.length} articles):
${JSON.stringify(blogCorpus.slice(0, 12), null, 2)}

CRITICAL REQUIREMENTS:
Generate recommendations across THREE link types:
1. "service_to_service":
   - Source is an active Service page.
   - Target is a complementary/prerequisite Service page (e.g., Company Registration linking to GST Registration or MCA Compliance; Trademark Registration linking to Trademark Objection Reply; Section 8 linking to 12A/80G NGO Compliance).
   - Anchor text: specific, commercial, natural (e.g. "mandatory GST registration", "MCA annual secretarial compliance").
   - Reason: explain cross-sell and regulatory progression for Indian founders.

2. "blog_to_service":
   - Source is a Blog article.
   - Target is an active Service page.
   - Anchor text: natural phrase in the guide pointing to official professional filing assistance.
   - Reason: funneling informational search intent into commercial advisory.

3. "blog_to_blog":
   - Source is a Blog article.
   - Target is another related Blog article.
   - Anchor text: contextual keyword phrase linking related guides (e.g. Pvt Ltd vs LLP guide linking to Director KYC guide).
   - Reason: building topical clusters and passing link equity.

RULES:
- Never use generic anchor text like "click here", "read more", "this link". Anchor text must be 2 to 6 words.
- Provide between 6 and 14 high-quality opportunities.
- Prioritize pages with low inbound links or high commercial value.`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          opportunities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                linkType: {
                  type: Type.STRING,
                  description: "'service_to_service', 'blog_to_service', or 'blog_to_blog'",
                },
                sourceType: { type: Type.STRING, description: "'service' or 'blog'" },
                sourceId: { type: Type.STRING },
                sourceTitle: { type: Type.STRING },
                sourceSlug: { type: Type.STRING },
                sourceUrl: { type: Type.STRING },
                targetType: { type: Type.STRING, description: "'service' or 'blog'" },
                targetTitle: { type: Type.STRING },
                targetSlug: { type: Type.STRING },
                targetUrl: { type: Type.STRING },
                anchorText: { type: Type.STRING },
                contextSnippet: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: [
                'linkType',
                'sourceType',
                'sourceTitle',
                'sourceSlug',
                'sourceUrl',
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
            logger.info(
              `Successfully generated internal link opportunities using: ${modelName}`,
              'InternalLinkingService'
            );
            break;
          }
        } catch (err: any) {
          logger.warn(
            `Internal linking scan with ${modelName} error (${err?.message || err}). Trying fallback...`,
            'InternalLinkingService'
          );
        }
      }

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          parsedSuggestions = Array.isArray(parsed.opportunities) ? parsed.opportunities : [];
        } catch (e) {
          logger.error('Failed to parse Gemini internal linking response', 'InternalLinkingService', e);
        }
      }
    } catch (aiErr) {
      logger.warn(
        'Gemini AI scan failed or skipped, using dynamic rule-based generation',
        'InternalLinkingService'
      );
    }

    // 6. If AI output was empty or lacked all 3 types, generate dynamic rule-based opportunities
    if (parsedSuggestions.length === 0) {
      parsedSuggestions = this.buildDynamicRuleBasedOpportunities(servicesList, blogCorpus);
    } else {
      // Ensure we have representation from all 3 types
      const hasS2S = parsedSuggestions.some((s) => s.linkType === 'service_to_service');
      const hasB2S = parsedSuggestions.some((s) => s.linkType === 'blog_to_service');
      const hasB2B = parsedSuggestions.some((s) => s.linkType === 'blog_to_blog');

      if (!hasS2S || !hasB2S || (!hasB2B && blogCorpus.length > 1)) {
        const supplemental = this.buildDynamicRuleBasedOpportunities(servicesList, blogCorpus);
        parsedSuggestions.push(...supplemental);
      }
    }

    // 7. Sanitize & Normalize opportunities
    const normalized: InternalLinkOpportunity[] = [];
    const seenCombos = new Set<string>();

    parsedSuggestions.forEach((item, index) => {
      const linkType: InternalLinkType =
        item.linkType === 'service_to_service'
          ? 'service_to_service'
          : item.linkType === 'blog_to_blog'
          ? 'blog_to_blog'
          : 'blog_to_service';

      const sourceType: 'service' | 'blog' =
        linkType === 'service_to_service' ? 'service' : 'blog';
      const targetType: 'service' | 'blog' =
        linkType === 'blog_to_blog' ? 'blog' : 'service';

      // Find matching source entity
      let sourceItem: any = null;
      if (sourceType === 'service') {
        sourceItem =
          servicesList.find((s) => s.slug === item.sourceSlug || s.id === item.sourceId) ||
          servicesList[0];
      } else {
        sourceItem =
          blogCorpus.find((b) => b.slug === item.sourceSlug || b.id === item.sourceId) ||
          blogCorpus[0];
      }

      if (!sourceItem) return;

      // Find matching target entity
      let targetItem: any = null;
      if (targetType === 'service') {
        targetItem =
          servicesList.find((s) => s.slug === item.targetSlug || s.title === item.targetTitle) ||
          servicesList.find((s) => s.slug !== sourceItem.slug) ||
          servicesList[0];
      } else {
        targetItem =
          blogCorpus.find((b) => b.slug === item.targetSlug || b.title === item.targetTitle) ||
          blogCorpus.find((b) => b.slug !== sourceItem.slug) ||
          blogCorpus[0];
      }

      if (!targetItem || targetItem.slug === sourceItem.slug) return;

      const comboKey = `${sourceItem.slug}-->${targetItem.slug}`;
      if (seenCombos.has(comboKey)) return;
      seenCombos.add(comboKey);

      const sourceUrl =
        sourceType === 'service' ? `/services/${sourceItem.slug}` : `/blog/${sourceItem.slug}`;
      const targetUrl =
        targetType === 'service' ? `/services/${targetItem.slug}` : `/blog/${targetItem.slug}`;

      normalized.push({
        id: `link-${index + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        linkType,
        sourceType,
        sourceId: sourceItem.id,
        sourceBlogId: sourceType === 'blog' ? sourceItem.id : undefined,
        sourceTitle: sourceItem.title,
        sourceSlug: sourceItem.slug,
        sourceUrl,
        sourceCategory: sourceItem.category,
        targetType,
        targetId: targetItem.id,
        targetTitle: targetItem.title,
        targetSlug: targetItem.slug,
        targetUrl,
        anchorText: item.anchorText || `${targetItem.title} services`,
        contextSnippet:
          item.contextSnippet ||
          `Businesses undertaking ${sourceItem.title} frequently require [${item.anchorText || targetItem.title}](${targetUrl}) to maintain regulatory compliance.`,
        reason:
          item.reason ||
          `Contextual authority and commercial alignment between ${sourceItem.title} and ${targetItem.title}.`,
        status: 'pending',
      });
    });

    return {
      totalScannedBlogs: blogCorpus.length,
      totalScannedServices: servicesList.length,
      suggestions: normalized,
      scannedAt: new Date().toISOString(),
      inboundAudit,
    };
  }

  /**
   * Dynamic rule-based linking across ALL active services and blogs
   */
  private buildDynamicRuleBasedOpportunities(
    services: any[],
    blogs: any[]
  ): any[] {
    const suggestions: any[] = [];

    // A. Service → Service links
    // Link related corporate services based on business lifecycle progression
    if (services.length > 1) {
      for (let i = 0; i < services.length; i++) {
        const source = services[i];

        // Find a complementary target service
        const target = services.find((t) => {
          if (t.slug === source.slug) return false;
          // Match by category or complementary workflows
          if (source.category && t.category && source.category === t.category) return true;
          if (
            (source.slug.includes('company') || source.slug.includes('llp')) &&
            (t.slug.includes('gst') || t.slug.includes('compliance') || t.slug.includes('trademark'))
          ) {
            return true;
          }
          if (source.slug.includes('trademark') && t.slug.includes('objection')) return true;
          if (source.slug.includes('gst') && t.slug.includes('return')) return true;
          return false;
        }) || services[(i + 1) % services.length];

        if (target && target.slug !== source.slug) {
          suggestions.push({
            linkType: 'service_to_service',
            sourceType: 'service',
            sourceId: source.id,
            sourceTitle: source.title,
            sourceSlug: source.slug,
            sourceUrl: `/services/${source.slug}`,
            targetType: 'service',
            targetTitle: target.title,
            targetSlug: target.slug,
            targetUrl: `/services/${target.slug}`,
            anchorText: target.title,
            contextSnippet: `Post-incorporation compliance requires completing [${target.title}](/services/${target.slug}) to begin official commercial operations.`,
            reason: `Cross-sell lifecycle: Clients registering ${source.title} immediately need ${target.title}.`,
          });
        }

        if (suggestions.length >= 4) break;
      }
    }

    // B. Blog → Service links
    // Match blog topics to active services
    blogs.forEach((blog) => {
      const blogText = `${blog.title} ${blog.sampleContent}`.toLowerCase();

      services.forEach((service) => {
        const titleTokens = service.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const matchesToken = titleTokens.some((t: string) => blogText.includes(t));

        if (matchesToken) {
          suggestions.push({
            linkType: 'blog_to_service',
            sourceType: 'blog',
            sourceId: blog.id,
            sourceTitle: blog.title,
            sourceSlug: blog.slug,
            sourceUrl: `/blog/${blog.slug}`,
            targetType: 'service',
            targetTitle: service.title,
            targetSlug: service.slug,
            targetUrl: `/services/${service.slug}`,
            anchorText: `professional ${service.title}`,
            contextSnippet: `For complete statutory assistance and hassle-free filing, consult Legomark for [professional ${service.title}](/services/${service.slug}).`,
            reason: `Commercial intent: Directly funnels readers seeking information on ${service.title} to the practice area package.`,
          });
        }
      });
    });

    // C. Blog → Blog links
    // Connect related articles within same category
    if (blogs.length > 1) {
      for (let i = 0; i < blogs.length; i++) {
        const b1 = blogs[i];
        const b2 =
          blogs.find((b, idx) => idx !== i && b.category === b1.category) ||
          blogs[(i + 1) % blogs.length];

        if (b2 && b2.slug !== b1.slug) {
          suggestions.push({
            linkType: 'blog_to_blog',
            sourceType: 'blog',
            sourceId: b1.id,
            sourceTitle: b1.title,
            sourceSlug: b1.slug,
            sourceUrl: `/blog/${b1.slug}`,
            targetType: 'blog',
            targetTitle: b2.title,
            targetSlug: b2.slug,
            targetUrl: `/blog/${b2.slug}`,
            anchorText: b2.title.slice(0, 45),
            contextSnippet: `To deepen your regulatory understanding, also read our detailed analysis on [${b2.title}](/blog/${b2.slug}).`,
            reason: `Topical Cluster: Passes topical authority and reduces bounce rate between related ${b1.category} guides.`,
          });
        }

        if (suggestions.filter((s) => s.linkType === 'blog_to_blog').length >= 3) break;
      }
    }

    return suggestions;
  }
}

export const internalLinkingService = new InternalLinkingService();
