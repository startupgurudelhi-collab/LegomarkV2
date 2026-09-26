import { GoogleGenAI, Type, Schema } from '@google/genai';
import { logger } from '../utils/logger';
import { blogRepository } from '../repositories/blog.repository';
import { serviceRepository } from '../repositories/service.repository';

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
  level: number; // 1, 2, 3
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

export class SeoOptimizerService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Helper: strip HTML tags to extract raw text
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Estimate syllables for Flesch Reading Ease
   */
  private countSyllables(word: string): number {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) return 0;
    if (clean.length <= 3) return 1;
    const cleanWord = clean.replace(/(?:[^laeiouy]|ed|es|e)$/, '').replace(/^y/, '');
    const matches = cleanWord.match(/[aeiouy]{1,2}/g);
    return matches ? Math.max(1, matches.length) : 1;
  }

  /**
   * Calculate Flesch Reading Ease score
   */
  private calculateFleschScore(rawText: string): { score: number; level: string } {
    if (!rawText || rawText.trim().length === 0) {
      return { score: 0, level: 'No content' };
    }

    const sentences = rawText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = Math.max(1, sentences.length);

    const words = rawText.split(/\s+/).filter((w) => w.trim().length > 0);
    const wordCount = Math.max(1, words.length);

    let totalSyllables = 0;
    for (const word of words) {
      totalSyllables += this.countSyllables(word);
    }

    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = totalSyllables / wordCount;

    // Flesch Reading Ease formula
    let score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    score = Math.round(Math.max(0, Math.min(100, score)));

    let level = 'Standard / Accessible';
    if (score >= 80) level = 'Very Easy / Conversational';
    else if (score >= 70) level = 'Fairly Easy';
    else if (score >= 60) level = 'Plain English / Professional';
    else if (score >= 50) level = 'Moderate / Technical';
    else if (score >= 30) level = 'Difficult / Dense Legal';
    else level = 'Very Confusing / Academic';

    return { score, level };
  }

  /**
   * Extract headings from HTML
   */
  private extractHeadings(html: string): HeadingItem[] {
    const headings: HeadingItem[] = [];
    const regex = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const level = parseInt(match[1][1], 10);
      const text = this.stripHtml(match[2]).trim();
      if (text) {
        headings.push({ level, text });
      }
    }
    return headings;
  }

  /**
   * Extract links from HTML
   */
  private extractLinks(html: string): LinkItem[] {
    const links: LinkItem[] = [];
    const genericTerms = new Set([
      'click here',
      'read more',
      'here',
      'learn more',
      'this link',
      'link',
      'more',
      'view',
      'check here',
    ]);

    const regex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const href = match[1].trim();
      const text = this.stripHtml(match[2]).trim();
      const isInternal =
        href.startsWith('/') ||
        href.startsWith('#') ||
        href.includes('legomark') ||
        !href.startsWith('http');
      const isGenericAnchor = genericTerms.has(text.toLowerCase());

      links.push({
        text: text || href,
        href,
        isInternal,
        isGenericAnchor,
      });
    }
    return links;
  }

  /**
   * Extract images from HTML
   */
  private extractImages(html: string, featuredImage?: string | null): ImageAuditItem[] {
    const images: ImageAuditItem[] = [];

    if (featuredImage) {
      images.push({
        src: featuredImage,
        alt: 'Featured Hero Image',
        hasAlt: true,
        isFilenameAlt: false,
      });
    }

    const regex = /<img\s+[^>]*>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const tag = match[0];
      const srcMatch = /src=["']([^"']*)["']/i.exec(tag);
      const altMatch = /alt=["']([^"']*)["']/i.exec(tag);

      const src = srcMatch ? srcMatch[1].trim() : '';
      const alt = altMatch ? altMatch[1].trim() : '';
      const hasAlt = alt.length > 0;
      const isFilenameAlt = /\.(png|jpe?g|webp|gif|svg)$/i.test(alt) || alt.toLowerCase().startsWith('img_') || alt.toLowerCase().startsWith('image');

      if (src) {
        images.push({
          src,
          alt,
          hasAlt,
          isFilenameAlt,
        });
      }
    }
    return images;
  }

  /**
   * Perform comprehensive SEO analysis
   */
  async analyzeBlog(input: {
    blogId?: string;
    title?: string;
    slug?: string;
    category?: string;
    content?: string;
    excerpt?: string | null;
    seoTitle?: string | null;
    metaDescription?: string | null;
    seoSlug?: string | null;
    featuredImage?: string | null;
    focusKeyword?: string;
  }): Promise<SeoAnalysisResult> {
    let blogData: any = null;

    if (input.blogId) {
      blogData = await blogRepository.getById(input.blogId);
      if (!blogData) {
        throw new Error(`Blog post with ID "${input.blogId}" not found`);
      }
    }

    const title = (input.title || blogData?.title || '').trim();
    const slug = (input.slug || input.seoSlug || blogData?.slug || blogData?.seoSlug || '').trim();
    const category = (input.category || blogData?.category || 'Corporate Advisory').trim();
    const author = (blogData?.author || 'Legomark Legal Team').trim();
    const isPublished = Boolean(blogData?.isPublished);
    const content = (input.content || blogData?.content || '').trim();
    const excerpt = (input.excerpt !== undefined ? input.excerpt : blogData?.excerpt) || '';
    const seoTitle = (input.seoTitle !== undefined ? input.seoTitle : blogData?.seoTitle) || title;
    const metaDescription =
      (input.metaDescription !== undefined ? input.metaDescription : blogData?.metaDescription) ||
      excerpt;
    const featuredImage = input.featuredImage !== undefined ? input.featuredImage : blogData?.featuredImage;

    const rawText = this.stripHtml(content);
    const words = rawText.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const characterCount = rawText.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // Structural metrics
    const headings = this.extractHeadings(content);
    const h1Count = headings.filter((h) => h.level === 1).length;
    const h2Count = headings.filter((h) => h.level === 2).length;
    const h3Count = headings.filter((h) => h.level === 3).length;

    // Link metrics
    const links = this.extractLinks(content);
    const internalLinks = links.filter((l) => l.isInternal);
    const externalLinks = links.filter((l) => !l.isInternal);

    // Image metrics
    const images = this.extractImages(content, featuredImage);
    const missingAltCount = images.filter((img) => !img.hasAlt || img.isFilenameAlt).length;

    // Readability
    const { score: fleschScore, level: readabilityLevel } = this.calculateFleschScore(rawText);

    // Fetch catalogue services for internal linking context
    let catalogueServices: any[] = [];
    try {
      catalogueServices = await serviceRepository.getAllPublicServices();
    } catch (e) {
      logger.warn('Could not fetch services for internal link recommendations', 'SeoOptimizerService');
    }

    // Determine target focus keyword
    let focusKeyword = input.focusKeyword?.trim() || '';

    // Run Gemini AI qualitative assessment
    const aiAnalysis = await this.runGeminiSeoAudit({
      title,
      seoTitle,
      metaDescription,
      slug,
      category,
      wordCount,
      headings,
      rawTextSnippet: rawText.slice(0, 3500),
      focusKeyword,
      availableServices: catalogueServices.slice(0, 15).map((s) => ({ title: s.title, slug: s.slug })),
    });

    if (!focusKeyword) {
      focusKeyword = aiAnalysis.identifiedFocusKeyword || title.split(':')[0].trim();
    }

    // Calculate exact keyword density
    let keywordOccurrences = 0;
    let keywordDensityPercent = 0;
    if (focusKeyword) {
      const escapedKw = focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const kwRegex = new RegExp(`\\b${escapedKw}\\b`, 'gi');
      const matches = rawText.match(kwRegex);
      keywordOccurrences = matches ? matches.length : 0;
      const kwWords = focusKeyword.split(/\s+/).length;
      keywordDensityPercent = wordCount > 0 ? parseFloat(((keywordOccurrences * kwWords * 100) / wordCount).toFixed(2)) : 0;
    }

    // Tag headings that contain the focus keyword
    const lowerKw = focusKeyword.toLowerCase();
    for (const h of headings) {
      h.hasKeyword = lowerKw.length > 0 && h.text.toLowerCase().includes(lowerKw);
    }

    // Evaluate 11 Core Dimensions (Total 100 Points)
    // 1. SEO Title (10 points max)
    const titleLen = seoTitle.length;
    let titleScore = 10;
    const titleDetails: string[] = [];
    let titleStatus: 'good' | 'warning' | 'critical' = 'good';

    if (titleLen === 0) {
      titleScore = 0;
      titleStatus = 'critical';
      titleDetails.push('Missing SEO Title tag.');
    } else if (titleLen < 40) {
      titleScore = 6;
      titleStatus = 'warning';
      titleDetails.push(`SEO Title is too short (${titleLen} chars). Optimal range is 50-60 characters.`);
    } else if (titleLen > 65) {
      titleScore = 6;
      titleStatus = 'warning';
      titleDetails.push(`SEO Title is too long (${titleLen} chars). It will likely truncate in Google SERP results.`);
    } else {
      titleDetails.push(`Optimal title length (${titleLen} chars). Fits Google Desktop and Mobile viewports.`);
    }

    if (focusKeyword && !seoTitle.toLowerCase().includes(lowerKw)) {
      titleScore = Math.max(2, titleScore - 3);
      titleStatus = titleStatus === 'critical' ? 'critical' : 'warning';
      titleDetails.push(`Focus keyword "${focusKeyword}" is not present in the SEO Title.`);
    } else if (focusKeyword) {
      titleDetails.push(`Focus keyword "${focusKeyword}" detected in SEO Title.`);
    }

    // 2. Meta Description (10 points max)
    const metaLen = (metaDescription || '').length;
    let metaScore = 10;
    const metaDetails: string[] = [];
    let metaStatus: 'good' | 'warning' | 'critical' = 'good';

    if (metaLen === 0) {
      metaScore = 0;
      metaStatus = 'critical';
      metaDetails.push('No meta description provided. Search engines will auto-generate snippets.');
    } else if (metaLen < 80) {
      metaScore = 5;
      metaStatus = 'warning';
      metaDetails.push(`Meta description is brief (${metaLen} chars). Optimal range is 120-160 characters.`);
    } else if (metaLen > 165) {
      metaScore = 6;
      metaStatus = 'warning';
      metaDetails.push(`Meta description is long (${metaLen} chars) and may truncate with ellipsis in search snippets.`);
    } else {
      metaDetails.push(`Ideal meta description length (${metaLen} chars). Displays fully in Google search snippets.`);
    }

    if (focusKeyword && metaDescription && !metaDescription.toLowerCase().includes(lowerKw)) {
      metaScore = Math.max(2, metaScore - 3);
      metaStatus = metaStatus === 'critical' ? 'critical' : 'warning';
      metaDetails.push(`Primary focus keyword "${focusKeyword}" is missing from the meta description.`);
    }

    // 3. Focus Keyword (10 points max)
    let fkScore = 10;
    const fkDetails: string[] = [];
    let fkStatus: 'good' | 'warning' | 'critical' = 'good';

    if (!focusKeyword) {
      fkScore = 3;
      fkStatus = 'critical';
      fkDetails.push('No primary focus keyword designated for this article.');
    } else {
      fkDetails.push(`Primary target keyword: "${focusKeyword}"`);
      fkDetails.push(`Identified Search Intent: ${aiAnalysis.searchIntent || 'Informational / Commercial'}`);
      if (aiAnalysis.secondaryKeywords && aiAnalysis.secondaryKeywords.length > 0) {
        fkDetails.push(`Semantic secondary targets: ${aiAnalysis.secondaryKeywords.slice(0, 4).join(', ')}`);
      }
    }

    // 4. Keyword Usage (10 points max)
    let kuScore = 10;
    const kuDetails: string[] = [];
    let kuStatus: 'good' | 'warning' | 'critical' = 'good';

    if (keywordOccurrences === 0) {
      kuScore = 2;
      kuStatus = 'critical';
      kuDetails.push(`Keyword "${focusKeyword}" was not found anywhere in body content.`);
    } else if (keywordDensityPercent < 0.6) {
      kuScore = 6;
      kuStatus = 'warning';
      kuDetails.push(`Keyword density is low (${keywordDensityPercent}%). Found ${keywordOccurrences} time(s). Ideal is 1.0% - 2.2%.`);
    } else if (keywordDensityPercent > 2.8) {
      kuScore = 5;
      kuStatus = 'warning';
      kuDetails.push(`High keyword density (${keywordDensityPercent}%). Risks keyword stuffing penalties. Found ${keywordOccurrences} times.`);
    } else {
      kuDetails.push(`Healthy keyword density: ${keywordDensityPercent}% (${keywordOccurrences} occurrences in ${wordCount} words).`);
    }

    const first150Words = words.slice(0, 150).join(' ').toLowerCase();
    if (focusKeyword && first150Words.includes(lowerKw)) {
      kuDetails.push('Focus keyword appears early in the opening introduction (first 150 words).');
    } else if (focusKeyword) {
      kuScore = Math.max(3, kuScore - 2);
      kuDetails.push('Focus keyword is missing from the first 150 words introduction.');
    }

    // 5. H1/H2/H3 Structure (10 points max)
    let hScore = 10;
    const hDetails: string[] = [];
    let hStatus: 'good' | 'warning' | 'critical' = 'good';

    if (h2Count === 0) {
      hScore = 3;
      hStatus = 'critical';
      hDetails.push('No H2 subheadings found. Content lacks structural readability and scan-ability.');
    } else if (h2Count < 3) {
      hScore = 7;
      hStatus = 'warning';
      hDetails.push(`Only ${h2Count} H2 subheading(s) detected. Recommend at least 3-4 structured H2 sections.`);
    } else {
      hDetails.push(`Solid heading hierarchy with ${h2Count} H2 subheadings and ${h3Count} H3 sub-sections.`);
    }

    const kwInH2 = headings.some((h) => h.level === 2 && h.hasKeyword);
    if (!kwInH2 && focusKeyword) {
      hScore = Math.max(3, hScore - 2);
      hDetails.push('None of the H2 headings contain the focus keyword or variations.');
    } else if (kwInH2) {
      hDetails.push('Focus keyword is incorporated in at least one H2 subheading.');
    }

    // 6. Content Length (10 points max)
    let clScore = 10;
    const clDetails: string[] = [];
    let clStatus: 'good' | 'warning' | 'critical' = 'good';

    if (wordCount < 400) {
      clScore = 2;
      clStatus = 'critical';
      clDetails.push(`Thin content warning: only ${wordCount} words. In-depth legal/corporate guides should exceed 1,000 words.`);
    } else if (wordCount < 800) {
      clScore = 6;
      clStatus = 'warning';
      clDetails.push(`Moderate length: ${wordCount} words. Consider expanding explanations, steps, and compliance checklists.`);
    } else if (wordCount < 1400) {
      clScore = 9;
      clDetails.push(`Comprehensive article length: ${wordCount} words (~${readingTimeMinutes} min read).`);
    } else {
      clScore = 10;
      clDetails.push(`Authoritative deep pillar guide: ${wordCount} words (~${readingTimeMinutes} min read). Excellent topic depth.`);
    }

    // 7. Readability (10 points max)
    let rScore = 10;
    const rDetails: string[] = [];
    let rStatus: 'good' | 'warning' | 'critical' = 'good';

    if (fleschScore < 40) {
      rScore = 5;
      rStatus = 'warning';
      rDetails.push(`Flesch Reading Ease: ${fleschScore}/100 (${readabilityLevel}). Sentences are long and dense; break down complex legal clauses into bullet points.`);
    } else if (fleschScore < 55) {
      rScore = 8;
      rDetails.push(`Flesch Reading Ease: ${fleschScore}/100 (${readabilityLevel}). Acceptable for specialized corporate/tax guidance.`);
    } else {
      rScore = 10;
      rDetails.push(`Flesch Reading Ease: ${fleschScore}/100 (${readabilityLevel}). Clear, engaging, and easy for business owners to follow.`);
    }

    // 8. Internal Links (10 points max)
    let ilScore = 10;
    const ilDetails: string[] = [];
    let ilStatus: 'good' | 'warning' | 'critical' = 'good';

    if (internalLinks.length === 0) {
      ilScore = 2;
      ilStatus = 'critical';
      ilDetails.push('Zero internal links detected. Missing opportunities to pass link equity to Legomark service pages.');
    } else if (internalLinks.length < 3) {
      ilScore = 6;
      ilStatus = 'warning';
      ilDetails.push(`Only ${internalLinks.length} internal link(s) found. Aim for 3-5 contextual links pointing to practice areas.`);
    } else {
      ilDetails.push(`Well-connected: ${internalLinks.length} internal link(s) and ${externalLinks.length} external reference(s).`);
    }

    const genericAnchors = links.filter((l) => l.isGenericAnchor);
    if (genericAnchors.length > 0) {
      ilScore = Math.max(3, ilScore - 2);
      ilDetails.push(`${genericAnchors.length} link(s) use generic anchor text like "click here" or "read more". Use descriptive keyword anchors.`);
    }

    // 9. Image / Alt Text (10 points max)
    let imgScore = 10;
    const imgDetails: string[] = [];
    let imgStatus: 'good' | 'warning' | 'critical' = 'good';

    if (!featuredImage) {
      imgScore = Math.max(3, imgScore - 4);
      imgStatus = 'warning';
      imgDetails.push('Missing featured image. Essential for social sharing cards and visual SERP results.');
    } else {
      imgDetails.push('Featured hero image is assigned.');
    }

    if (images.length === 0) {
      imgScore = Math.max(2, imgScore - 4);
      imgStatus = 'warning';
      imgDetails.push('No visual assets found in the article.');
    } else if (missingAltCount > 0) {
      imgScore = Math.max(3, imgScore - Math.min(5, missingAltCount * 2));
      imgStatus = 'warning';
      imgDetails.push(`${missingAltCount} image(s) missing descriptive ALT text tags for screen readers & Google Images.`);
    } else {
      imgDetails.push(`All ${images.length} image(s) have descriptive ALT text.`);
    }

    // 10. URL Slug (5 points max)
    let slugScore = 5;
    const slugDetails: string[] = [];
    let slugStatus: 'good' | 'warning' | 'critical' = 'good';

    const cleanSlug = slug.toLowerCase();
    if (!cleanSlug) {
      slugScore = 0;
      slugStatus = 'critical';
      slugDetails.push('Missing URL slug.');
    } else if (cleanSlug.length > 55) {
      slugScore = 3;
      slugStatus = 'warning';
      slugDetails.push(`URL slug is lengthy (${cleanSlug.length} chars). Shorter slugs (3-5 words) rank better.`);
    } else if (/[^a-z0-9-]/.test(cleanSlug)) {
      slugScore = 2;
      slugStatus = 'warning';
      slugDetails.push('Slug contains special characters or uppercase letters.');
    } else {
      slugDetails.push(`Clean, canonical URL slug: /blog/${cleanSlug}`);
    }

    if (focusKeyword && cleanSlug) {
      const simplifiedKwSlug = focusKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const kwWordsInSlug = focusKeyword.toLowerCase().split(/\s+/).filter((w) => cleanSlug.includes(w));
      if (kwWordsInSlug.length === 0) {
        slugScore = Math.max(1, slugScore - 2);
        slugDetails.push(`Focus keyword is not reflected in URL slug: "${cleanSlug}".`);
      } else {
        slugDetails.push('Target keyword terms present in URL slug.');
      }
    }

    // 11. FAQ Opportunities (5 points max)
    let faqScore = 5;
    const faqDetails: string[] = [];
    let faqStatus: 'good' | 'warning' | 'critical' = 'good';

    const hasFaqSection = /<h[23][^>]*>.*?(faq|frequently\s+asked|questions).*?<\/h[23]>/i.test(content) || /frequently asked questions/i.test(rawText);
    if (!hasFaqSection) {
      faqScore = 2;
      faqStatus = 'warning';
      faqDetails.push('No dedicated FAQ section detected. FAQ schema and Q&A blocks capture high Google SERP real estate.');
    } else {
      faqDetails.push('Dedicated FAQ section identified in content.');
    }

    if (aiAnalysis.faqOpportunities && aiAnalysis.faqOpportunities.length > 0) {
      faqDetails.push(`Identified ${aiAnalysis.faqOpportunities.length} high-intent question opportunities for Google PAA.`);
    }

    // Calculate Final LEGOMARK SEO Score (0 - 100)
    const legomarkScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          titleScore +
            metaScore +
            fkScore +
            kuScore +
            hScore +
            clScore +
            rScore +
            ilScore +
            imgScore +
            slugScore +
            faqScore
        )
      )
    );

    let scoreGrade: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical' = 'Needs Improvement';
    if (legomarkScore >= 85) scoreGrade = 'Excellent';
    else if (legomarkScore >= 70) scoreGrade = 'Good';
    else if (legomarkScore >= 50) scoreGrade = 'Needs Improvement';
    else scoreGrade = 'Critical';

    // Compile prioritized recommendations
    const recommendations: SeoRecommendation[] = [];

    // Title recommendations
    if (titleStatus !== 'good' || aiAnalysis.suggestedTitle) {
      recommendations.push({
        id: 'rec-title',
        dimension: 'SEO Title',
        priority: titleStatus === 'critical' ? 'high' : 'medium',
        title: titleStatus === 'critical' ? 'Set an SEO-Optimized Title' : 'Refine SEO Title & Branding',
        description: titleDetails.join(' '),
        currentValue: seoTitle,
        recommendedValue: aiAnalysis.suggestedTitle || `${title} | Legomark Advisory`,
        suggestedAction: 'Update your SEO Title in the Blog Editor to maintain between 50-60 characters and position your focus keyword upfront.',
      });
    }

    // Meta Description recommendations
    if (metaStatus !== 'good' || aiAnalysis.suggestedMetaDescription) {
      recommendations.push({
        id: 'rec-meta',
        dimension: 'Meta Description',
        priority: metaStatus === 'critical' ? 'high' : 'medium',
        title: metaStatus === 'critical' ? 'Write a Compelling Meta Description' : 'Optimize Meta Description Length & CTA',
        description: metaDetails.join(' '),
        currentValue: metaDescription,
        recommendedValue: aiAnalysis.suggestedMetaDescription || `Learn all about ${title}. Discover step-by-step corporate procedures, documentation, and compliance insights from Legomark.`,
        suggestedAction: 'Craft a 140-155 character meta snippet ending with an action-oriented call to action.',
      });
    }

    // Focus Keyword recommendations
    if (fkStatus !== 'good' || !focusKeyword) {
      recommendations.push({
        id: 'rec-focus-kw',
        dimension: 'Focus Keyword',
        priority: 'high',
        title: 'Define Primary Target Keyword',
        description: fkDetails.join(' '),
        currentValue: focusKeyword || '(None designated)',
        recommendedValue: aiAnalysis.identifiedFocusKeyword || title,
        suggestedAction: 'Target a high-intent business query (e.g. "Private Limited Company Registration" or "GST Filing Procedure") to anchor the page authority.',
      });
    }

    // Keyword usage recommendations
    if (kuStatus !== 'good') {
      recommendations.push({
        id: 'rec-kw-usage',
        dimension: 'Keyword Usage',
        priority: kuStatus === 'critical' ? 'high' : 'medium',
        title: 'Balance Keyword Placement & Density',
        description: kuDetails.join(' '),
        currentValue: `${keywordDensityPercent}% density (${keywordOccurrences} times)`,
        recommendedValue: '1.2% - 1.8% density with natural placement in first paragraph, subheadings, and conclusion',
        suggestedAction: 'Naturally include your target keyword within the opening paragraph, at least one H2 heading, and concluding summary.',
      });
    }

    // Headings recommendations
    if (hStatus !== 'good') {
      recommendations.push({
        id: 'rec-headings',
        dimension: 'H1/H2/H3 Structure',
        priority: hStatus === 'critical' ? 'high' : 'medium',
        title: 'Structure Content with Logical H2 & H3 Hierarchy',
        description: hDetails.join(' '),
        currentValue: `${h1Count} H1, ${h2Count} H2, ${h3Count} H3`,
        recommendedValue: '1 H1 (Article Title), 3-5 H2 subheadings, 2-4 H3 sub-points',
        suggestedAction: 'Break large narrative blocks into sequential subtopics with H2 tags, including step-by-step checklists.',
      });
    }

    // Content length recommendations
    if (clStatus !== 'good') {
      recommendations.push({
        id: 'rec-content-len',
        dimension: 'Content Length',
        priority: clStatus === 'critical' ? 'high' : 'low',
        title: 'Expand Article Depth & Topical Authority',
        description: clDetails.join(' '),
        currentValue: `${wordCount} words`,
        recommendedValue: '1,200 - 1,800+ words for comprehensive corporate topics',
        suggestedAction: 'Add detailed statutory compliance timelines, eligibility criteria, required documents list, and practical FAQs.',
      });
    }

    // Readability recommendations
    if (rStatus !== 'good') {
      recommendations.push({
        id: 'rec-readability',
        dimension: 'Readability',
        priority: 'medium',
        title: 'Improve Plain English Readability',
        description: rDetails.join(' '),
        currentValue: `Flesch Score: ${fleschScore}/100 (${readabilityLevel})`,
        recommendedValue: 'Flesch Score: 60-70 (Accessible professional reading)',
        suggestedAction: 'Shorten complex compound sentences, replace overly dense legal terms with conversational explanations, and use bulleted lists.',
      });
    }

    // Internal links recommendations
    if (ilStatus !== 'good') {
      recommendations.push({
        id: 'rec-internal-links',
        dimension: 'Internal Links',
        priority: ilStatus === 'critical' ? 'high' : 'medium',
        title: 'Embed Relevant Service & Category Links',
        description: ilDetails.join(' '),
        currentValue: `${internalLinks.length} internal links`,
        recommendedValue: '3 - 5 contextual links to Legomark practice areas',
        suggestedAction: 'Anchor relevant service phrases (e.g. "consult our corporate lawyers" or "register your trademark") to corresponding service packages.',
      });
    }

    // Image Alt text recommendations
    if (imgStatus !== 'good') {
      recommendations.push({
        id: 'rec-images',
        dimension: 'Image/Alt Text',
        priority: !featuredImage ? 'high' : 'medium',
        title: !featuredImage ? 'Assign Featured Hero Image' : 'Add Descriptive Alt Tags to Images',
        description: imgDetails.join(' '),
        currentValue: `${images.length} images (${missingAltCount} missing or generic ALT)`,
        recommendedValue: 'Featured Image present + 100% descriptive keyword-rich ALT tags',
        suggestedAction: 'Provide informative, accessible ALT descriptions explaining diagram or infographic contents.',
      });
    }

    // URL Slug recommendations
    if (slugStatus !== 'good' || aiAnalysis.suggestedSlug) {
      recommendations.push({
        id: 'rec-slug',
        dimension: 'URL Slug',
        priority: slugStatus === 'critical' ? 'high' : 'low',
        title: 'Optimize URL Permalinks Structure',
        description: slugDetails.join(' '),
        currentValue: slug || '(empty)',
        recommendedValue: aiAnalysis.suggestedSlug || cleanSlug,
        suggestedAction: 'Maintain clean hyphen-separated slugs containing only 3-5 core keyword tokens.',
      });
    }

    // FAQ Opportunities recommendations
    if (faqStatus !== 'good' || (aiAnalysis.faqOpportunities && aiAnalysis.faqOpportunities.length > 0)) {
      recommendations.push({
        id: 'rec-faq',
        dimension: 'FAQ Opportunities',
        priority: faqStatus === 'critical' ? 'medium' : 'low',
        title: 'Incorporate People Also Ask (PAA) FAQs',
        description: faqDetails.join(' '),
        currentValue: hasFaqSection ? 'Basic FAQ section present' : 'No FAQ section',
        recommendedValue: '3 - 5 structured Q&A accordions addressing entrepreneur queries',
        suggestedAction: 'Review the high-intent FAQ questions listed below and paste them into the article before publishing.',
      });
    }

    // Merge any bespoke recommendations from Gemini
    if (aiAnalysis.additionalRecommendations && Array.isArray(aiAnalysis.additionalRecommendations)) {
      for (const customRec of aiAnalysis.additionalRecommendations) {
        if (!recommendations.some((r) => r.title.toLowerCase() === customRec.title?.toLowerCase())) {
          recommendations.push({
            id: `rec-ai-${recommendations.length + 1}`,
            dimension: customRec.dimension || 'Readability',
            priority: customRec.priority || 'medium',
            title: customRec.title,
            description: customRec.description,
            suggestedAction: customRec.suggestedAction || 'Review and apply in Blog Editor.',
            currentValue: customRec.currentValue,
            recommendedValue: customRec.recommendedValue,
          });
        }
      }
    }

    // Sort recommendations by priority (High -> Medium -> Low)
    const priorityWeight = { high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);

    return {
      legomarkScore,
      scoreGrade,
      diagnosticDisclaimer:
        'LEGOMARK SEO Score is our proprietary diagnostic audit score, NOT a Google ranking score or guarantee.',
      analyzedAt: new Date().toISOString(),
      article: {
        id: blogData?.id || input.blogId,
        title,
        slug,
        category,
        author,
        isPublished,
      },
      focusKeyword,
      secondaryKeywords: aiAnalysis.secondaryKeywords || [],
      searchIntent: aiAnalysis.searchIntent || 'Informational & Commercial',
      dimensions: {
        seoTitle: {
          score: titleScore,
          maxScore: 10,
          status: titleStatus,
          title: 'SEO Title',
          summary: titleDetails[0] || 'Title length and keyword check',
          currentValue: seoTitle,
          recommendedValue: aiAnalysis.suggestedTitle,
          details: titleDetails,
        },
        metaDescription: {
          score: metaScore,
          maxScore: 10,
          status: metaStatus,
          title: 'Meta Description',
          summary: metaDetails[0] || 'Meta snippet analysis',
          currentValue: metaDescription,
          recommendedValue: aiAnalysis.suggestedMetaDescription,
          details: metaDetails,
        },
        focusKeyword: {
          score: fkScore,
          maxScore: 10,
          status: fkStatus,
          title: 'Focus Keyword & Intent',
          summary: `Target: "${focusKeyword}"`,
          currentValue: focusKeyword,
          recommendedValue: aiAnalysis.identifiedFocusKeyword,
          details: fkDetails,
        },
        keywordUsage: {
          score: kuScore,
          maxScore: 10,
          status: kuStatus,
          title: 'Keyword Density & Placement',
          summary: `${keywordDensityPercent}% density (${keywordOccurrences} occurrences)`,
          currentValue: `${keywordDensityPercent}% density`,
          recommendedValue: '1.0% - 2.0% density',
          details: kuDetails,
        },
        headingStructure: {
          score: hScore,
          maxScore: 10,
          status: hStatus,
          title: 'H1 / H2 / H3 Structure',
          summary: `${h1Count} H1, ${h2Count} H2, ${h3Count} H3`,
          details: hDetails,
        },
        contentLength: {
          score: clScore,
          maxScore: 10,
          status: clStatus,
          title: 'Content Length & Depth',
          summary: `${wordCount} words (~${readingTimeMinutes} min read)`,
          currentValue: `${wordCount} words`,
          recommendedValue: '1,200+ words',
          details: clDetails,
        },
        readability: {
          score: rScore,
          maxScore: 10,
          status: rStatus,
          title: 'Readability & Plain English',
          summary: `Flesch Reading Ease: ${fleschScore}/100 (${readabilityLevel})`,
          currentValue: `${fleschScore}/100`,
          recommendedValue: '60 - 75 / 100',
          details: rDetails,
        },
        internalLinks: {
          score: ilScore,
          maxScore: 10,
          status: ilStatus,
          title: 'Internal Links & Equity',
          summary: `${internalLinks.length} internal link(s) found`,
          currentValue: `${internalLinks.length} internal links`,
          recommendedValue: '3 - 5 relevant service links',
          details: ilDetails,
        },
        imagesAlt: {
          score: imgScore,
          maxScore: 10,
          status: imgStatus,
          title: 'Images & Alt Attributes',
          summary: `${images.length} images (${missingAltCount} missing ALT)`,
          currentValue: `${images.length} images, ${missingAltCount} missing alt`,
          recommendedValue: '100% valid descriptive ALT tags',
          details: imgDetails,
        },
        urlSlug: {
          score: slugScore,
          maxScore: 5,
          status: slugStatus,
          title: 'URL Slug & Structure',
          summary: slug ? `/blog/${slug}` : 'No slug',
          currentValue: slug,
          recommendedValue: aiAnalysis.suggestedSlug,
          details: slugDetails,
        },
        faqOpportunities: {
          score: faqScore,
          maxScore: 5,
          status: faqStatus,
          title: 'FAQ Opportunities',
          summary: hasFaqSection ? 'FAQ section detected' : 'FAQ section missing',
          details: faqDetails,
        },
      },
      metrics: {
        wordCount,
        characterCount,
        readingTimeMinutes,
        fleschReadingEase: fleschScore,
        readabilityLevel,
        headings,
        h1Count,
        h2Count,
        h3Count,
        links,
        internalLinkCount: internalLinks.length,
        externalLinkCount: externalLinks.length,
        images,
        imageCount: images.length,
        missingAltCount,
        keywordDensityPercent,
        keywordOccurrences,
        hasFeaturedImage: Boolean(featuredImage),
      },
      recommendations,
      faqOpportunities: aiAnalysis.faqOpportunities || [],
      suggestedInternalLinkTargets: aiAnalysis.suggestedInternalLinks || [],
    };
  }

  /**
   * Gemini AI Semantic SEO Auditor
   */
  private async runGeminiSeoAudit(data: {
    title: string;
    seoTitle: string;
    metaDescription: string;
    slug: string;
    category: string;
    wordCount: number;
    headings: HeadingItem[];
    rawTextSnippet: string;
    focusKeyword: string;
    availableServices: Array<{ title: string; slug: string }>;
  }): Promise<{
    identifiedFocusKeyword?: string;
    secondaryKeywords?: string[];
    searchIntent?: string;
    suggestedTitle?: string;
    suggestedMetaDescription?: string;
    suggestedSlug?: string;
    faqOpportunities?: FaqOpportunity[];
    suggestedInternalLinks?: Array<{
      serviceTitle: string;
      serviceSlug: string;
      recommendedAnchorText: string;
      context: string;
    }>;
    additionalRecommendations?: any[];
  }> {
    try {
      const ai = this.getClient();

      const prompt = `
You are the senior SEO auditor for LEGOMARK, a premier corporate law, tax compliance, and business registration consultancy in India.
Analyze the following blog article for on-page SEO excellence, user search intent, and Google snippet performance:

Article Title: "${data.title}"
Current SEO Title: "${data.seoTitle}"
Current Meta Description: "${data.metaDescription}"
URL Slug: "${data.slug}"
Category: "${data.category}"
Total Words: ${data.wordCount}
Existing Headings: ${JSON.stringify(data.headings.map((h) => `H${h.level}: ${h.text}`))}
Existing Focus Keyword (if provided): "${data.focusKeyword || 'None - Please identify best focus keyword'}"
Available Legomark Service Catalog: ${JSON.stringify(data.availableServices)}

Sample Content Excerpt:
"${data.rawTextSnippet}"

Please audit this content and provide structured JSON recommendations:
1. identifiedFocusKeyword: The primary high-volume, commercial or informational search query target in India.
2. secondaryKeywords: 3-5 semantic variations (LSI terms).
3. searchIntent: Informational, Commercial Investigation, or Transactional with 1-sentence explanation.
4. suggestedTitle: High CTR SEO Title between 50-60 chars including the focus keyword and Legomark brand suffix.
5. suggestedMetaDescription: Engaging 140-155 chars meta snippet with clear value proposition and call to action.
6. suggestedSlug: Clean, short, hyphen-separated permalink slug (e.g. "pvt-ltd-company-registration-process").
7. faqOpportunities: 3-4 specific high-intent FAQs that entrepreneurs frequently ask on this topic for Google's "People Also Ask" box. Include question, suggestedAnswerOutline, and intentRationale.
8. suggestedInternalLinks: 2-4 contextual recommendations connecting this article to available Legomark practice areas, with exact anchor text.
9. additionalRecommendations: 1-3 specific actionable content improvements regarding legal depth, readability, or statutory nuances.
`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          identifiedFocusKeyword: { type: Type.STRING },
          secondaryKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          searchIntent: { type: Type.STRING },
          suggestedTitle: { type: Type.STRING },
          suggestedMetaDescription: { type: Type.STRING },
          suggestedSlug: { type: Type.STRING },
          faqOpportunities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                suggestedAnswerOutline: { type: Type.STRING },
                intentRationale: { type: Type.STRING },
                relevance: { type: Type.STRING },
              },
              required: ['question', 'suggestedAnswerOutline', 'intentRationale'],
            },
          },
          suggestedInternalLinks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                serviceTitle: { type: Type.STRING },
                serviceSlug: { type: Type.STRING },
                recommendedAnchorText: { type: Type.STRING },
                context: { type: Type.STRING },
              },
              required: ['serviceTitle', 'serviceSlug', 'recommendedAnchorText'],
            },
          },
          additionalRecommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dimension: { type: Type.STRING },
                priority: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestedAction: { type: Type.STRING },
                currentValue: { type: Type.STRING },
                recommendedValue: { type: Type.STRING },
              },
              required: ['dimension', 'priority', 'title', 'description', 'suggestedAction'],
            },
          },
        },
        required: [
          'identifiedFocusKeyword',
          'searchIntent',
          'suggestedTitle',
          'suggestedMetaDescription',
          'suggestedSlug',
          'faqOpportunities',
        ],
      };

      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      let response;
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema,
              temperature: 0.4,
            },
          });
          if (response && response.text) {
            logger.info(`Successfully generated AI SEO audit using model: ${modelName}`, 'SeoOptimizerService');
            break;
          }
        } catch (err: any) {
          lastError = err;
          logger.warn(`Model ${modelName} error in SEO audit (${err?.message || 'unknown'}), trying fallback...`, 'SeoOptimizerService');
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error('All candidate AI models were unable to complete the SEO audit');
      }

      return JSON.parse(response.text.trim());
    } catch (err: any) {
      logger.warn(`Gemini AI audit skipped or errored (${err?.message}). Using heuristic defaults.`, 'SeoOptimizerService');
      return {
        identifiedFocusKeyword: data.focusKeyword || data.title.split(':')[0].trim(),
        secondaryKeywords: [data.category, 'compliance guidelines', 'procedure in India'],
        searchIntent: 'Informational & Commercial Investigation',
        suggestedTitle: `${data.title.slice(0, 50)} | Legomark`,
        suggestedMetaDescription: `Read our comprehensive guide to ${data.title}. Understand key rules, legal checklists, and step-by-step corporate procedures from Legomark.`,
        suggestedSlug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 45),
        faqOpportunities: [
          {
            question: `What are the essential requirements for ${data.title}?`,
            suggestedAnswerOutline: 'List statutory eligibility, minimum director requirements, and mandatory documentation.',
            intentRationale: 'Captures primary informational search queries from prospective startup founders.',
            relevance: 'High',
          },
          {
            question: `How long does the entire legal process take in India?`,
            suggestedAnswerOutline: 'Explain typical government turnaround times with ROC or GST departments.',
            intentRationale: 'High-intent commercial query from founders preparing business launch schedules.',
            relevance: 'High',
          },
          {
            question: `What are the post-compliance filing obligations?`,
            suggestedAnswerOutline: 'Outline annual ROC filings, board meetings, and periodic tax returns.',
            intentRationale: 'Targets corporate compliance queries and introduces Legomark retainer services.',
            relevance: 'Medium',
          },
        ],
        suggestedInternalLinks: data.availableServices.slice(0, 2).map((s) => ({
          serviceTitle: s.title,
          serviceSlug: s.slug,
          recommendedAnchorText: s.title,
          context: `Link when explaining statutory filings or professional assistance for ${s.title}`,
        })),
      };
    }
  }
}

export const seoOptimizerService = new SeoOptimizerService();
