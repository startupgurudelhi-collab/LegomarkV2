import { blogRepository } from '../repositories/blog.repository';
import { serviceService } from './service.service';
import { gscService, GscPageRow, GscQueryRow, GscSearchAnalyticsResult } from './gsc.service';
import { gscRepository } from '../repositories/gsc.repository';
import { logger } from '../utils/logger';

export type BacklinkOutreachType =
  | 'striking_distance'
  | 'resource_guide'
  | 'statutory_citation'
  | 'commercial_intent'
  | 'unlinked_brand_mention';

export type BacklinkPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BacklinkGscMetric {
  primaryQuery: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  isStrikingDistance: boolean; // Position between 5.0 and 20.0
  secondaryQueries?: string[];
}

export interface BacklinkOutreachStrategy {
  angle: string;
  targetProspectType: string;
  suggestedSubjectLine: string;
  pitchTemplate: string;
}

export interface BacklinkOpportunityCandidate {
  id: string;
  targetUrl: string;
  canonicalUrl: string;
  targetTitle: string;
  targetType: 'blog' | 'service';
  category: string;
  outreachType: BacklinkOutreachType;
  priority: BacklinkPriority;
  priorityScore: number; // Deterministic numerical score (0-100)
  rationale: string;
  gscMetrics?: BacklinkGscMetric;
  recommendedAnchors: string[];
  outreachStrategy: BacklinkOutreachStrategy;
  contentExcerpt?: string;
  publishedAt?: string;
}

export interface BacklinkOpportunityOptions {
  days?: number;
  outreachType?: BacklinkOutreachType;
  priority?: BacklinkPriority;
  onlyStrikingDistance?: boolean;
  minImpressions?: number;
  limit?: number;
}

export interface BacklinkOpportunityResult {
  summary: {
    totalCandidates: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
    strikingDistanceCount: number;
    byOutreachType: Record<BacklinkOutreachType, number>;
    gscConnected: boolean;
    selectedProperty: string | null;
    gscDataAvailable: boolean;
    totalGscImpressionsAnalyzed: number;
  };
  candidates: BacklinkOpportunityCandidate[];
  generatedAt: string;
}

// Fallback baseline services matching canonical live /services/... routes
const FALLBACK_SERVICE_TARGETS = [
  {
    title: 'Private Limited Company Registration',
    slug: 'private-limited-company-registration',
    category: 'Company Registration',
    excerpt: 'Fast-track MCA SPICe+ incorporation with DIN, DSC, PAN, TAN, and Certificate of Incorporation.',
    keywords: ['private limited company registration', 'pvt ltd incorporation india', 'mca spice+ company registration'],
  },
  {
    title: 'LLP Registration',
    slug: 'llp-registration',
    category: 'Company Registration',
    excerpt: 'Incorporation of LLP with FiLLiP MCA filing, LLP Agreement drafting, and Form 11 compliance.',
    keywords: ['llp registration india', 'limited liability partnership incorporation', 'fillip mca portal'],
  },
  {
    title: 'Partnership Registration',
    slug: 'partnership-registration',
    category: 'Company Registration',
    excerpt: 'Partnership deed drafting, notary attestation, and Registrar of Firms (ROF) registration.',
    keywords: ['partnership registration india', 'partnership deed drafting', 'rof registration'],
  },
  {
    title: 'Section 8 / NGO Registration',
    slug: 'section-8-ngo-registration',
    category: 'Company Registration',
    excerpt: 'Non-profit company incorporation with Central Government license, 12A, and 80G tax exemptions.',
    keywords: ['section 8 company registration', 'ngo incorporation india', 'non profit company mca license'],
  },
  {
    title: 'GST Registration',
    slug: 'gst-registration',
    category: 'Taxation & GST',
    excerpt: 'Statutory GSTIN registration, threshold advisory, and monthly/quarterly GSTR compliance.',
    keywords: ['gst registration online', 'gstin application for businesses', 'gst compliance services'],
  },
  {
    title: 'GST Return Filing',
    slug: 'gst-return-filing',
    category: 'Taxation & GST',
    excerpt: 'Timely filing of GSTR-1, GSTR-3B, and annual GSTR-9 returns with input tax credit reconciliation.',
    keywords: ['gst return filing', 'gstr-1 gstr-3b filing', 'gst compliance'],
  },
  {
    title: 'GST Refund',
    slug: 'gst-refund',
    category: 'Taxation & GST',
    excerpt: 'Statutory assistance in claiming accumulated ITC, inverted duty refund, and export GST refunds.',
    keywords: ['gst refund online', 'accumulated itc refund', 'export gst refund'],
  },
  {
    title: 'Income Tax Return / ITR',
    slug: 'income-tax-return-itr',
    category: 'Taxation & GST',
    excerpt: 'Corporate and individual tax computation, advance tax planning, and statutory ITR-1 to ITR-7 filing.',
    keywords: ['income tax return filing', 'itr corporate filing', 'tax computation india'],
  },
  {
    title: 'Audit-related Services',
    slug: 'audit-related-services',
    category: 'Taxation & GST',
    excerpt: 'Statutory audit facilitation, tax audit under Section 44AB, and internal corporate compliance reviews.',
    keywords: ['statutory audit services', 'tax audit 44ab', 'corporate compliance audit'],
  },
  {
    title: 'Trademark Registration',
    slug: 'trademark-registration',
    category: 'Trademark & IP',
    excerpt: 'Comprehensive TM search, Class 1-45 filing under Trademark Act 1999, and IP protection.',
    keywords: ['trademark registration online', 'brand name registration india', 'tm application filing'],
  },
  {
    title: 'Trademark Protection',
    slug: 'trademark-protection',
    category: 'Trademark & IP',
    excerpt: 'Trademark watch services, opposition handling, and defense against brand infringement.',
    keywords: ['trademark protection', 'brand infringement defense', 'tm opposition'],
  },
  {
    title: 'ROC Filing',
    slug: 'roc-filing',
    category: 'Compliance & ROC',
    excerpt: 'Mandatory annual ROC returns, AOC-4, MGT-7, and event-based director/share capital filings.',
    keywords: ['roc filing services', 'aoc-4 mgt-7 filing', 'mca compliance'],
  },
  {
    title: 'Annual Compliance',
    slug: 'annual-compliance',
    category: 'Compliance & ROC',
    excerpt: 'Comprehensive annual corporate secretarial package for Private Limited and LLP entities.',
    keywords: ['annual corporate compliance', 'pvt ltd annual compliance', 'statutory maintenance'],
  },
  {
    title: 'FSSAI License / Registration',
    slug: 'fssai-license-registration',
    category: 'FSSAI & Licensing',
    excerpt: 'FoSCoS registration, State & Central food business licensing for manufacturers and cloud kitchens.',
    keywords: ['fssai license registration', 'foscos food license apply', 'food business permit fssai'],
  },
  {
    title: 'Other Business Licenses / Registrations',
    slug: 'other-business-licenses-registrations',
    category: 'FSSAI & Licensing',
    excerpt: 'Shop & Establishment, MSME Udyam, Import Export Code (IEC), and Trade Licenses.',
    keywords: ['business licenses india', 'msme udyam registration', 'iec code registration'],
  },
  {
    title: 'Advisory & Secretarial Consultation',
    slug: 'advisory-secretarial-consultation',
    category: 'Corporate Advisory',
    excerpt: 'Board restructuring, shareholder agreements, corporate governance, and investment readiness advisory.',
    keywords: ['corporate advisory consultation', 'secretarial legal advisory', 'board restructuring'],
  },
];

/**
 * LACS Module #21: Deterministic Backlink Opportunity Engine
 *
 * Integrates real Google Search Console Search Analytics with published
 * catalog data (blogs & public services) to isolate high-leverage backlink candidates.
 *
 * Prioritizes "striking distance" pages (positions 5.0–20.0 with meaningful impressions)
 * where acquiring high-quality external links yields maximum organic ranking gains.
 *
 * Adheres strictly to the invariant: No invented domain authority metrics or external sites.
 */
export class BacklinkOpportunityService {
  private readonly defaultBaseDomain = 'https://legomarkindia.com';

  /**
   * Generates prioritized backlink opportunity candidates from real catalog + GSC data.
   */
  public async generateOpportunities(
    options: BacklinkOpportunityOptions = {}
  ): Promise<BacklinkOpportunityResult> {
    logger.info('Generating deterministic backlink opportunities (LACS #21)...', 'BacklinkOpportunityService');

    // 1. Check GSC connection state and fetch GSC search analytics if available
    let gscData: GscSearchAnalyticsResult | null = null;
    let gscConnected = false;
    let selectedProperty: string | null = null;
    let totalImpressionsAnalyzed = 0;

    try {
      const connection = await gscRepository.getConnection();
      gscConnected = Boolean(connection?.isConnected);
      selectedProperty = connection?.selectedProperty || null;

      if (gscConnected && selectedProperty && selectedProperty.trim().length > 0) {
        gscData = await gscService.querySearchAnalytics({
          days: options.days ?? 28,
          rowLimit: 300,
        });
        if (gscData?.summary) {
          totalImpressionsAnalyzed = gscData.summary.impressions || 0;
        }
      }
    } catch (gscErr: any) {
      logger.warn(
        'GSC Search Analytics query unavailable; using catalog baseline for backlink opportunities',
        'BacklinkOpportunityService',
        gscErr?.message || gscErr
      );
      // Fall through gracefully to catalog baseline
    }

    // 2. Fetch published blogs
    let publishedBlogs: any[] = [];
    try {
      const blogRes = await blogRepository.getAdminBlogs({ status: 'published' });
      publishedBlogs = blogRes.blogs || [];
    } catch (blogErr) {
      logger.warn('Failed to load published blogs from repository', 'BacklinkOpportunityService', blogErr);
    }

    // 3. Fetch public services
    let publicServices: any[] = [];
    try {
      const services = await serviceService.getAllPublicServices();
      if (services && services.length > 0) {
        publicServices = services;
      } else {
        publicServices = FALLBACK_SERVICE_TARGETS;
      }
    } catch (servErr) {
      logger.warn('Failed to load services from serviceService, using fallback targets', 'BacklinkOpportunityService', servErr);
      publicServices = FALLBACK_SERVICE_TARGETS;
    }

    // 4. Map GSC data by normalized relative path
    const gscPageMap = new Map<string, GscPageRow>();
    if (gscData?.pages) {
      for (const pageRow of gscData.pages) {
        const normPath = this.normalizeUrlPath(pageRow.page);
        if (normPath) {
          gscPageMap.set(normPath, pageRow);
        }
      }
    }

    // 5. Build query index by keyword matching
    const gscQueries = gscData?.queries || [];

    // 6. Assemble candidate target pool from real catalog pages
    const candidateMap = new Map<string, BacklinkOpportunityCandidate>();

    // A. Process Services
    for (const service of publicServices) {
      const targetUrl = `/services/${service.slug}`;
      let gscPage = gscPageMap.get(targetUrl);

      // Check legacy/shorthand aliases if exact canonical path isn't present in GSC
      if (!gscPage) {
        const serviceAliases: Record<string, string[]> = {
          'private-limited-company-registration': ['/services/private-limited-company'],
          'llp-registration': ['/services/limited-liability-partnership-llp', '/services/llp'],
          'section-8-ngo-registration': ['/services/section-8-company', '/services/section-8-ngo'],
          'fssai-license-registration': ['/services/fssai-food-license', '/services/fssai'],
        };
        const candidateAliases = serviceAliases[service.slug] || [];
        for (const alias of candidateAliases) {
          gscPage = gscPageMap.get(alias);
          if (gscPage) break;
        }
      }

      const matchingQueries = this.findMatchingQueries(gscQueries, service.title, service.slug);

      const candidate = this.evaluateCandidate({
        targetUrl,
        targetTitle: service.title,
        targetType: 'service',
        category: service.category || 'Legal & Corporate Services',
        contentExcerpt: service.shortDesc || service.excerpt,
        keywords: service.keywords || [service.title.toLowerCase()],
        gscPage,
        matchingQueries,
      });

      candidateMap.set(targetUrl, candidate);
    }

    // B. Process Published Blogs
    for (const blog of publishedBlogs) {
      const targetUrl = `/resources/blog/${blog.slug}`;
      const gscPage = gscPageMap.get(targetUrl) || gscPageMap.get(`/blog/${blog.slug}`);
      const matchingQueries = this.findMatchingQueries(gscQueries, blog.title, blog.slug);

      const candidate = this.evaluateCandidate({
        targetUrl,
        targetTitle: blog.title,
        targetType: 'blog',
        category: blog.category || 'Corporate Advisory',
        contentExcerpt: blog.excerpt || (blog.content ? blog.content.substring(0, 160) : undefined),
        keywords: [blog.title.toLowerCase(), blog.category?.toLowerCase() || ''],
        publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
        gscPage,
        matchingQueries,
      });

      candidateMap.set(targetUrl, candidate);
    }

    // C. Process any GSC pages that might not be in the direct catalog query (e.g. landing pages or other indexable paths)
    if (gscData?.pages) {
      for (const pageRow of gscData.pages) {
        const normPath = this.normalizeUrlPath(pageRow.page);
        if (!normPath) continue;

        // Resolve canonical path if this normPath is a known alias
        let canonicalPath = normPath;
        if (normPath.startsWith('/blog/')) {
          const blogCanonical = normPath.replace('/blog/', '/resources/blog/');
          if (candidateMap.has(blogCanonical)) {
            canonicalPath = blogCanonical;
          }
        } else if (normPath === '/services/private-limited-company' && candidateMap.has('/services/private-limited-company-registration')) {
          canonicalPath = '/services/private-limited-company-registration';
        } else if (
          (normPath === '/services/limited-liability-partnership-llp' || normPath === '/services/llp') &&
          candidateMap.has('/services/llp-registration')
        ) {
          canonicalPath = '/services/llp-registration';
        } else if (
          (normPath === '/services/section-8-company' || normPath === '/services/section-8-ngo') &&
          candidateMap.has('/services/section-8-ngo-registration')
        ) {
          canonicalPath = '/services/section-8-ngo-registration';
        } else if (
          (normPath === '/services/fssai-food-license' || normPath === '/services/fssai') &&
          candidateMap.has('/services/fssai-license-registration')
        ) {
          canonicalPath = '/services/fssai-license-registration';
        }

        // If candidate already exists in catalog (either directly or via resolved alias), enrich with GSC metrics
        if (candidateMap.has(canonicalPath)) {
          const existing = candidateMap.get(canonicalPath)!;
          if (!existing.gscMetrics || (pageRow.impressions || 0) > (existing.gscMetrics.impressions || 0)) {
            const slug = canonicalPath.split('/').filter(Boolean).pop() || '';
            const matchingQueries = this.findMatchingQueries(gscQueries, existing.targetTitle, slug);
            const enriched = this.evaluateCandidate({
              targetUrl: existing.targetUrl,
              targetTitle: existing.targetTitle,
              targetType: existing.targetType,
              category: existing.category,
              contentExcerpt: existing.contentExcerpt,
              keywords: [existing.targetTitle.toLowerCase()],
              publishedAt: existing.publishedAt,
              gscPage: pageRow,
              matchingQueries,
            });
            candidateMap.set(canonicalPath, enriched);
          }
          continue;
        }

        // Only evaluate legitimate site paths
        if (
          normPath === '/services' ||
          normPath.startsWith('/services/') ||
          normPath === '/resources/blog' ||
          normPath.startsWith('/resources/blog/') ||
          normPath === '/blog' ||
          normPath.startsWith('/blog/') ||
          normPath === '/'
        ) {
          const isBlog =
            normPath === '/resources/blog' ||
            normPath.startsWith('/resources/blog/') ||
            normPath === '/blog' ||
            normPath.startsWith('/blog/');
          const isService = normPath === '/services' || normPath.startsWith('/services/');
          const slug = normPath.split('/').filter(Boolean).pop() || 'homepage';
          const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const matchingQueries = this.findMatchingQueries(gscQueries, title, slug);

          const candidate = this.evaluateCandidate({
            targetUrl: normPath,
            targetTitle: title,
            targetType: isBlog ? 'blog' : 'service',
            category: isService ? 'Legal Services' : isBlog ? 'Legal Insights' : 'Home',
            keywords: [title.toLowerCase()],
            gscPage: pageRow,
            matchingQueries,
          });

          candidateMap.set(normPath, candidate);
        }
      }
    }

    // 7. Filter and Sort Candidates
    let allCandidates = Array.from(candidateMap.values());

    // Apply options filters
    if (options.outreachType) {
      allCandidates = allCandidates.filter((c) => c.outreachType === options.outreachType);
    }
    if (options.priority) {
      allCandidates = allCandidates.filter((c) => c.priority === options.priority);
    }
    if (options.onlyStrikingDistance) {
      allCandidates = allCandidates.filter((c) => c.gscMetrics?.isStrikingDistance === true);
    }
    if (typeof options.minImpressions === 'number' && options.minImpressions > 0) {
      allCandidates = allCandidates.filter(
        (c) => (c.gscMetrics?.impressions ?? 0) >= options.minImpressions!
      );
    }

    // Sort deterministically:
    // 1st: Priority score descending (0-100)
    // 2nd: GSC impressions descending
    // 3rd: Target URL ascending for tie-break stability
    allCandidates.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      const bImp = b.gscMetrics?.impressions ?? 0;
      const aImp = a.gscMetrics?.impressions ?? 0;
      if (bImp !== aImp) {
        return bImp - aImp;
      }
      return a.targetUrl.localeCompare(b.targetUrl);
    });

    // Apply limit if specified
    const limit = options.limit && options.limit > 0 ? options.limit : 100;
    const finalCandidates = allCandidates.slice(0, limit);

    // 8. Build summary statistics
    const summary = {
      totalCandidates: allCandidates.length,
      highPriorityCount: allCandidates.filter((c) => c.priority === 'HIGH').length,
      mediumPriorityCount: allCandidates.filter((c) => c.priority === 'MEDIUM').length,
      lowPriorityCount: allCandidates.filter((c) => c.priority === 'LOW').length,
      strikingDistanceCount: allCandidates.filter((c) => c.gscMetrics?.isStrikingDistance === true).length,
      byOutreachType: {
        striking_distance: allCandidates.filter((c) => c.outreachType === 'striking_distance').length,
        resource_guide: allCandidates.filter((c) => c.outreachType === 'resource_guide').length,
        statutory_citation: allCandidates.filter((c) => c.outreachType === 'statutory_citation').length,
        commercial_intent: allCandidates.filter((c) => c.outreachType === 'commercial_intent').length,
        unlinked_brand_mention: allCandidates.filter((c) => c.outreachType === 'unlinked_brand_mention').length,
      },
      gscConnected,
      selectedProperty,
      gscDataAvailable: Boolean(gscData && gscData.pages && gscData.pages.length > 0),
      totalGscImpressionsAnalyzed: totalImpressionsAnalyzed,
    };

    return {
      summary,
      candidates: finalCandidates,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Deterministically evaluates a target page against ranking metrics, keyword intent, and outreach classification.
   */
  private evaluateCandidate(params: {
    targetUrl: string;
    targetTitle: string;
    targetType: 'blog' | 'service';
    category: string;
    contentExcerpt?: string;
    keywords?: string[];
    publishedAt?: string;
    gscPage?: GscPageRow;
    matchingQueries: GscQueryRow[];
  }): BacklinkOpportunityCandidate {
    const {
      targetUrl,
      targetTitle,
      targetType,
      category,
      contentExcerpt,
      keywords = [],
      publishedAt,
      gscPage,
      matchingQueries,
    } = params;

    const baseDomain = this.defaultBaseDomain;
    const canonicalUrl = `${baseDomain}${targetUrl}`;
    const id = `opp-${Buffer.from(targetUrl).toString('base64url').substring(0, 16)}`;

    // 1. Process GSC Performance metrics
    let gscMetrics: BacklinkGscMetric | undefined;
    let isStrikingDistance = false;
    let impressions = 0;
    let clicks = 0;
    let ctr = 0;
    let position = 0;

    if (gscPage) {
      impressions = gscPage.impressions || 0;
      clicks = gscPage.clicks || 0;
      ctr = gscPage.ctr || 0;
      position = Math.round((gscPage.position || 0) * 10) / 10;
      // Striking distance definition: organic position between 5.0 and 20.0 with impressions
      isStrikingDistance = position >= 5.0 && position <= 20.0 && impressions > 0;

      const primaryQuery =
        matchingQueries.length > 0
          ? matchingQueries[0].query
          : gscPage.page.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || targetTitle.toLowerCase();

      const secondaryQueries = matchingQueries
        .slice(1, 4)
        .map((q) => q.query)
        .filter((q) => q !== primaryQuery);

      gscMetrics = {
        primaryQuery,
        impressions,
        clicks,
        ctr,
        position,
        isStrikingDistance,
        secondaryQueries: secondaryQueries.length > 0 ? secondaryQueries : undefined,
      };
    }

    // 2. Classify Outreach Type deterministically
    const outreachType = this.classifyOutreachType({
      targetType,
      category,
      isStrikingDistance,
      impressions,
      targetTitle,
    });

    // 3. Calculate Deterministic Priority Score (0–100)
    const { priority, priorityScore, rationale } = this.calculatePriorityAndScore({
      targetType,
      isStrikingDistance,
      position,
      impressions,
      outreachType,
      targetTitle,
      category,
    });

    // 4. Extract Recommended Anchor Texts
    const recommendedAnchors = this.generateRecommendedAnchors({
      targetTitle,
      category,
      keywords,
      gscMetrics,
      matchingQueries,
    });

    // 5. Generate Outreach Strategy & Pitch Template (No fake sites or metrics!)
    const outreachStrategy = this.generateOutreachStrategy({
      targetTitle,
      targetUrl,
      targetType,
      category,
      outreachType,
      gscMetrics,
      recommendedAnchors,
    });

    return {
      id,
      targetUrl,
      canonicalUrl,
      targetTitle,
      targetType,
      category,
      outreachType,
      priority,
      priorityScore,
      rationale,
      gscMetrics,
      recommendedAnchors,
      outreachStrategy,
      contentExcerpt,
      publishedAt,
    };
  }

  /**
   * Classifies page into one of 5 distinct SEO outreach archetypes.
   */
  private classifyOutreachType(params: {
    targetType: 'blog' | 'service';
    category: string;
    isStrikingDistance: boolean;
    impressions: number;
    targetTitle: string;
  }): BacklinkOutreachType {
    const { targetType, category, isStrikingDistance, impressions, targetTitle } = params;
    const catLower = category.toLowerCase();
    const titleLower = targetTitle.toLowerCase();

    // 1. High-impression striking distance pages receive dedicated SERP elevation classification
    if (isStrikingDistance && impressions >= 10) {
      return 'striking_distance';
    }

    // 2. Regulatory, compliance, tax filings, and licensing -> Statutory Citation
    if (
      catLower.includes('compliance') ||
      catLower.includes('roc') ||
      catLower.includes('fssai') ||
      catLower.includes('tax') ||
      catLower.includes('gst') ||
      titleLower.includes('statutory') ||
      titleLower.includes('form') ||
      titleLower.includes('filing') ||
      titleLower.includes('mca')
    ) {
      return 'statutory_citation';
    }

    // 3. Commercial Service pages -> Commercial Intent
    if (targetType === 'service') {
      return 'commercial_intent';
    }

    // 4. Articles covering corporate governance, founder guidance, or legal advisory -> Unlinked brand mention / leadership
    if (
      catLower.includes('founder') ||
      catLower.includes('governance') ||
      titleLower.includes('founder') ||
      titleLower.includes('advisory') ||
      titleLower.includes('legomark')
    ) {
      return 'unlinked_brand_mention';
    }

    // 5. In-depth editorial guides and informational posts -> Resource Guide
    return 'resource_guide';
  }

  /**
   * Calculates deterministic priority score (0–100) and priority tier ('HIGH' | 'MEDIUM' | 'LOW').
   */
  private calculatePriorityAndScore(params: {
    targetType: 'blog' | 'service';
    isStrikingDistance: boolean;
    position: number;
    impressions: number;
    outreachType: BacklinkOutreachType;
    targetTitle: string;
    category: string;
  }): { priority: BacklinkPriority; priorityScore: number; rationale: string } {
    const { targetType, isStrikingDistance, position, impressions, outreachType, targetTitle } = params;

    let score = 30; // Baseline
    const reasons: string[] = [];

    // Striking Distance Evaluation (Positions 5.0–20.0 with real impressions)
    if (isStrikingDistance) {
      score += 35; // Heavy weight for striking distance

      // Proximity to Top 3
      if (position >= 5.0 && position <= 10.0) {
        score += 20;
        reasons.push(`Ranking in prime striking zone (pos #${position.toFixed(1)}). A small influx of contextual link equity can trigger a breakout into Top 3.`);
      } else if (position > 10.0 && position <= 15.0) {
        score += 14;
        reasons.push(`Page 2 top ranking (pos #${position.toFixed(1)}). Targeted external backlinks will bridge the gap to Page 1.`);
      } else {
        score += 8;
        reasons.push(`Page 2 ranking (pos #${position.toFixed(1)}). Has validated keyword relevance; needs external domain citations.`);
      }

      // Impression Volume Weight
      if (impressions >= 100) {
        score += 15;
        reasons.push(`High search visibility (${impressions} impressions in 28d). High commercial yield upon ranking improvement.`);
      } else if (impressions >= 25) {
        score += 10;
        reasons.push(`Consistent search exposure (${impressions} impressions in 28d).`);
      } else {
        score += 5;
        reasons.push(`Active search impressions (${impressions} in 28d).`);
      }
    } else if (position > 0 && position < 5.0) {
      // Already in top 4 - defensive link maintenance
      score += 15;
      reasons.push(`Already ranks in Top 4 (pos #${position.toFixed(1)}). Maintain link velocity to defend authority.`);
    } else {
      // Catalog baseline (no GSC or pos > 20)
      if (targetType === 'service') {
        score += 25;
        reasons.push('Core commercial service landing page with high conversion intent.');
      } else {
        score += 15;
        reasons.push('Foundational corporate legal editorial guide with high reference value.');
      }

      // Check high-demand topics
      const titleLower = targetTitle.toLowerCase();
      if (
        titleLower.includes('private limited') ||
        titleLower.includes('trademark') ||
        titleLower.includes('gst') ||
        titleLower.includes('llp')
      ) {
        score += 10;
        reasons.push('High-demand Indian corporate practice area.');
      }
    }

    // Outreach Type Affinity
    if (outreachType === 'commercial_intent') {
      score += 5;
    } else if (outreachType === 'resource_guide') {
      score += 5;
    }

    // Cap score at 100
    const finalScore = Math.min(100, Math.max(0, score));

    let priority: BacklinkPriority = 'LOW';
    if (finalScore >= 65) {
      priority = 'HIGH';
    } else if (finalScore >= 45) {
      priority = 'MEDIUM';
    }

    const rationale = reasons.join(' ') || 'Deterministic baseline opportunity based on catalog architecture.';

    return {
      priority,
      priorityScore: finalScore,
      rationale,
    };
  }

  /**
   * Generates natural anchor text recommendations from real queries or article titles.
   */
  private generateRecommendedAnchors(params: {
    targetTitle: string;
    category: string;
    keywords: string[];
    gscMetrics?: BacklinkGscMetric;
    matchingQueries: GscQueryRow[];
  }): string[] {
    const { targetTitle, category, keywords, gscMetrics, matchingQueries } = params;
    const anchors = new Set<string>();

    // 1. Primary real query from GSC
    if (gscMetrics?.primaryQuery) {
      anchors.add(gscMetrics.primaryQuery.toLowerCase());
    }

    // 2. Secondary queries from GSC
    for (const mq of matchingQueries.slice(0, 3)) {
      if (mq.query && mq.query.trim().length > 3) {
        anchors.add(mq.query.trim().toLowerCase());
      }
    }

    // 3. Exact target title
    anchors.add(targetTitle.toLowerCase());

    // 4. Keyword combinations
    for (const kw of keywords) {
      if (kw && kw.trim().length > 2) {
        anchors.add(kw.trim().toLowerCase());
      }
    }

    // 5. Branded / Partial anchor
    anchors.add(`Legomark ${category} Guide`.toLowerCase());
    anchors.add(`corporate legal guide on ${targetTitle}`.toLowerCase());

    return Array.from(anchors).slice(0, 5);
  }

  /**
   * Generates a concrete outreach strategy and email pitch template without inventing fake external websites.
   */
  private generateOutreachStrategy(params: {
    targetTitle: string;
    targetUrl: string;
    targetType: 'blog' | 'service';
    category: string;
    outreachType: BacklinkOutreachType;
    gscMetrics?: BacklinkGscMetric;
    recommendedAnchors: string[];
  }): BacklinkOutreachStrategy {
    const { targetTitle, targetUrl, targetType, category, outreachType, gscMetrics, recommendedAnchors } = params;
    const anchor = recommendedAnchors[0] || targetTitle;
    const fullUrl = `${this.defaultBaseDomain}${targetUrl}`;

    switch (outreachType) {
      case 'striking_distance':
        return {
          angle: `SERP Breakout Outreach: Leverage high organic relevance to earn editorial citations from Indian startup, legal, and SME industry portals.`,
          targetProspectType: 'Indian Startup Accelerators, FinTech/Legal Tech Blogs, and SME Business Resource Compendiums',
          suggestedSubjectLine: `Resource contribution: Updated statutory guide on ${targetTitle}`,
          pitchTemplate: `Hi [Editor Name],

I was reviewing your editorial coverage on corporate compliance in India at [Publication Name], and noticed your excellent roundup for emerging founders.

Our legal and compliance team at Legomark India recently published an in-depth, verified procedural breakdown on "${targetTitle}", incorporating the latest statutory guidelines:
${fullUrl}

Given your audience of entrepreneurs navigating corporate legal formalities, this could serve as a valuable reference link under your compliance resources section using anchor text like "${anchor}".

Would this be a suitable addition to your curated guide? I would also be glad to contribute a guest commentary or legal quote for any upcoming features.

Best regards,
Editorial & Corporate Advisory Desk
LEGOMARK INDIA
New Delhi, India | ${this.defaultBaseDomain}`,
        };

      case 'statutory_citation':
        return {
          angle: `Regulatory Reference Outreach: Position this page as an authoritative statutory companion for trade bodies, regional chambers of commerce, and CA/CS reference hubs.`,
          targetProspectType: 'Chambers of Commerce, Trade Associations, CA/CS Professional Forums, and Regulatory Portals',
          suggestedSubjectLine: `Statutory compliance reference on ${targetTitle}`,
          pitchTemplate: `Hi [Editor Name],

I came across your reference library regarding Indian corporate and regulatory compliance at [Publication Name].

With recent updates from the regulatory authorities regarding ${category}, our senior legal practitioners at Legomark India have compiled a detailed, step-by-step statutory walkthrough for "${targetTitle}":
${fullUrl}

It covers mandatory form filings, statutory deadlines, and procedural checklists. Linking to this resource (e.g. as "${anchor}") would provide your readers with direct legal clarity.

Happy to provide any clarifying notes or citations if helpful for your editorial desk.

Warm regards,
Legal Research Group
LEGOMARK INDIA | New Delhi, India`,
        };

      case 'commercial_intent':
        return {
          angle: `Ecosystem Directory & Vendor Resource Outreach: Position Legomark's professional services on founder toolkits, legal service directories, and incubator perks programs.`,
          targetProspectType: 'Incubators, Co-Working Communities, Entrepreneurship Development Hubs, and B2B Vendor Directories',
          suggestedSubjectLine: `Curated partner resource for Indian founders: ${targetTitle}`,
          pitchTemplate: `Hi [Director / Community Manager Name],

I lead corporate partnerships at Legomark India, where we assist fast-growing Indian startups with legal incorporation, trademark protection, and statutory compliance.

I noticed your valuable founder toolkit and resource repository at [Platform Name]. We would love to be included as a verified advisory resource for "${targetTitle}":
${fullUrl}

We are prepared to offer prioritized consultations and complimentary compliance health checks for founders in your network.

Would you be open to featuring us in your vetted services directory under "${anchor}"?

Best regards,
Corporate Partnerships Desk
LEGOMARK INDIA | ${this.defaultBaseDomain}`,
        };

      case 'unlinked_brand_mention':
        return {
          angle: `Brand Mention Reclaim & Thought Leadership: Secure attribution links from business news, legal journalism, and startup commentary where corporate law topics are discussed.`,
          targetProspectType: 'Legal Publications, Business Journalists, Economic Commentators, and Startup News Desks',
          suggestedSubjectLine: `Legal commentary & editorial context regarding ${targetTitle}`,
          pitchTemplate: `Hi [Journalist / Editor Name],

I read your recent coverage regarding corporate law and startup regulatory frameworks at [Publication Name].

Our Managing Partners at Legomark India frequently advise emerging enterprises on these exact compliance challenges, and we recently published authoritative analysis regarding "${targetTitle}":
${fullUrl}

If your editorial team is working on follow-up stories or requires practitioner quotes regarding Indian corporate law, we would be delighted to connect you with our corporate law team.

Best regards,
Media Relations
LEGOMARK INDIA | New Delhi, India`,
        };

      case 'resource_guide':
      default:
        return {
          angle: `Educational Link Reclamation: Reach out to university legal portals, business incubators, and startup guides looking for verified legal explainers.`,
          targetProspectType: 'University Entrepreneurship Cells, Legal Knowledge Bases, and Startup Resource Guides',
          suggestedSubjectLine: `Comprehensive reference resource on ${targetTitle}`,
          pitchTemplate: `Hi [Webmaster / Resource Curator Name],

I was exploring your curated list of business guides at [Site / Organization Name] and found your resources for Indian entrepreneurs very thorough.

We recently developed an exhaustive guide titled "${targetTitle}":
${fullUrl}

It provides practical guidance, statutory flowcharts, and procedural checklists that directly answer common legal questions.

Would you consider adding this as a reference under your resource directory with anchor text "${anchor}"?

Thank you for your time and for maintaining such a valuable resource repository.

Kind regards,
Content & Legal Research Team
LEGOMARK INDIA | ${this.defaultBaseDomain}`,
        };
    }
  }

  /**
   * Normalizes URLs into standard relative pathnames (e.g. "/services/company-reg").
   */
  private normalizeUrlPath(urlStr: string): string | null {
    if (!urlStr || typeof urlStr !== 'string') return null;
    const clean = urlStr.trim();
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://')) {
        const parsed = new URL(clean);
        return this.cleanPathname(parsed.pathname);
      }
      if (clean.startsWith('sc-domain:')) {
        const withoutPrefix = clean.replace(/^sc-domain:[^/]+/, '');
        return this.cleanPathname(withoutPrefix || '/');
      }
      return this.cleanPathname(clean);
    } catch {
      return this.cleanPathname(clean);
    }
  }

  private cleanPathname(pathname: string): string {
    let p = pathname.trim();
    if (!p.startsWith('/')) p = `/${p}`;
    // Strip trailing slash unless root
    if (p.length > 1 && p.endsWith('/')) {
      p = p.slice(0, -1);
    }
    return p;
  }

  /**
   * Finds matching GSC queries for a specific page based on lexical overlap with title or slug.
   */
  private findMatchingQueries(
    queries: GscQueryRow[],
    title: string,
    slug: string
  ): GscQueryRow[] {
    if (!queries || queries.length === 0) return [];

    const titleTokens = title
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2);
    const slugTokens = slug
      .toLowerCase()
      .split(/[-_]+/)
      .filter((t) => t.length > 2);
    const targetTokens = new Set([...titleTokens, ...slugTokens]);

    const scoredQueries: Array<{ query: GscQueryRow; score: number }> = [];

    for (const q of queries) {
      const qTokens = q.query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
      let matchCount = 0;
      for (const token of qTokens) {
        if (targetTokens.has(token)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        // Score by matches and impressions
        const score = matchCount * 10 + Math.log10(Math.max(1, q.impressions));
        scoredQueries.push({ query: q, score });
      }
    }

    scoredQueries.sort((a, b) => b.score - a.score);
    return scoredQueries.map((sq) => sq.query);
  }
}

export const backlinkOpportunityService = new BacklinkOpportunityService();
