import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export interface GeneratedBlogDraft {
  title: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  focusKeyword: string;
  relatedKeywords: string[];
  summary: string;
  faq: Array<{ question: string; answer: string }>;
  blogContent: string;
  category: string;
  featuredImage?: string | null;
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text: string, maxChars = 32, maxLines = 3): string[] {
  const words = (text || '').trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

interface CategoryVisualTheme {
  primaryColor: string;
  secondaryColor: string;
  badgeText: string;
  authorityText: string;
  iconType: 'company' | 'tax' | 'trademark' | 'compliance' | 'startup' | 'fssai';
}

function getCategoryTheme(category: string): CategoryVisualTheme {
  const cat = (category || '').toLowerCase();
  if (cat.includes('trademark') || cat.includes('ip') || cat.includes('patent')) {
    return {
      primaryColor: '#F59E0B',
      secondaryColor: '#8B5CF6',
      badgeText: 'TRADEMARK & IP PROTECTION',
      authorityText: 'CONTROLLER GENERAL OF PATENTS, DESIGNS & TRADEMARKS',
      iconType: 'trademark',
    };
  }
  if (cat.includes('tax') || cat.includes('gst')) {
    return {
      primaryColor: '#10B981',
      secondaryColor: '#F59E0B',
      badgeText: 'GST & TAXATION COMPLIANCE',
      authorityText: 'GOODS & SERVICES TAX COUNCIL • CGST ACT',
      iconType: 'tax',
    };
  }
  if (cat.includes('startup') || cat.includes('funding')) {
    return {
      primaryColor: '#F97316',
      secondaryColor: '#A855F7',
      badgeText: 'STARTUP & DPIIT RECOGNITION',
      authorityText: 'STARTUP INDIA INITIATIVE • DPIIT CERTIFICATION',
      iconType: 'startup',
    };
  }
  if (cat.includes('compliance') || cat.includes('roc')) {
    return {
      primaryColor: '#F43F5E',
      secondaryColor: '#F59E0B',
      badgeText: 'ROC & MCA ANNUAL COMPLIANCE',
      authorityText: 'MINISTRY OF CORPORATE AFFAIRS • ROC DELHI',
      iconType: 'compliance',
    };
  }
  if (cat.includes('fssai') || cat.includes('licens')) {
    return {
      primaryColor: '#22C55E',
      secondaryColor: '#F59E0B',
      badgeText: 'FSSAI & STATUTORY LICENSING',
      authorityText: 'FOOD SAFETY AND STANDARDS AUTHORITY OF INDIA',
      iconType: 'fssai',
    };
  }
  return {
    primaryColor: '#F59E0B',
    secondaryColor: '#3B82F6',
    badgeText: 'COMPANY REGISTRATION & MCA',
    authorityText: 'MINISTRY OF CORPORATE AFFAIRS • SPICe+ PORTAL',
    iconType: 'company',
  };
}

function renderEmblem(iconType: CategoryVisualTheme['iconType'], primaryColor: string): string {
  if (iconType === 'trademark') {
    return `
      <!-- Trademark Shield & Crest -->
      <path d="M0 -55 L45 -35 L45 15 C45 45 0 70 0 70 C0 70 -45 45 -45 15 L-45 -35 Z" fill="#0F172A" stroke="${primaryColor}" stroke-width="3" />
      <circle cx="0" cy="5" r="24" fill="none" stroke="${primaryColor}" stroke-width="2.5" />
      <text x="0" y="14" text-anchor="middle" fill="${primaryColor}" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900">®</text>
      <text x="0" y="-18" text-anchor="middle" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" letter-spacing="1">TM</text>
    `;
  }
  if (iconType === 'tax') {
    return `
      <!-- Tax & Ledger Emblem -->
      <rect x="-40" y="-50" width="80" height="100" rx="10" fill="#0F172A" stroke="${primaryColor}" stroke-width="3" />
      <line x1="-25" y1="-30" x2="25" y2="-30" stroke="#94A3B8" stroke-width="3" stroke-linecap="round" />
      <line x1="-25" y1="-15" x2="25" y2="-15" stroke="#94A3B8" stroke-width="3" stroke-linecap="round" />
      <circle cx="-10" cy="15" r="10" fill="none" stroke="${primaryColor}" stroke-width="2.5" />
      <line x1="-15" y1="35" x2="15" y2="-5" stroke="${primaryColor}" stroke-width="3" />
      <circle cx="10" cy="15" r="10" fill="none" stroke="${primaryColor}" stroke-width="2.5" />
    `;
  }
  if (iconType === 'startup') {
    return `
      <!-- Startup Rocket & Growth -->
      <path d="M0 -60 C20 -40 25 -10 25 25 L-25 25 C-25 -10 -20 -40 0 -60 Z" fill="#0F172A" stroke="${primaryColor}" stroke-width="3" />
      <circle cx="0" cy="-15" r="12" fill="none" stroke="${primaryColor}" stroke-width="2" />
      <path d="M-25 15 L-42 35 L-25 32 Z M25 15 L42 35 L25 32 Z" fill="${primaryColor}" />
      <path d="M-12 25 L0 55 L12 25 Z" fill="#F97316" />
    `;
  }
  if (iconType === 'compliance') {
    return `
      <!-- ROC Compliance Shield & Checkmark -->
      <path d="M0 -55 L45 -35 L45 15 C45 45 0 70 0 70 C0 70 -45 45 -45 15 L-45 -35 Z" fill="#0F172A" stroke="${primaryColor}" stroke-width="3" />
      <path d="M-18 8 L-6 20 L22 -10" fill="none" stroke="${primaryColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <line x1="-25" y1="-22" x2="25" y2="-22" stroke="#94A3B8" stroke-width="2" stroke-dasharray="3 3" />
    `;
  }
  if (iconType === 'fssai') {
    return `
      <!-- FSSAI Food Safety Shield -->
      <path d="M0 -55 L45 -35 L45 15 C45 45 0 70 0 70 C0 70 -45 45 -45 15 L-45 -35 Z" fill="#0F172A" stroke="${primaryColor}" stroke-width="3" />
      <circle cx="0" cy="0" r="20" fill="none" stroke="${primaryColor}" stroke-width="2" />
      <path d="M-10 0 C-10 -15 10 -15 10 0 C10 10 -10 10 -10 0 Z" fill="${primaryColor}" />
    `;
  }
  // Default Company / Scales of Justice
  return `
    <!-- Scales of Justice / Corporate Pillars -->
    <path d="M-35 25 L35 25 M0 -45 L0 40 M-45 40 L45 40" stroke="${primaryColor}" stroke-width="3.5" stroke-linecap="round" />
    <circle cx="0" cy="-45" r="6" fill="${primaryColor}" />
    <line x1="-30" y1="-20" x2="30" y2="-20" stroke="${primaryColor}" stroke-width="3" stroke-linecap="round" />
    <path d="M-30 -20 L-45 10 L-15 10 Z" fill="#1E293B" stroke="${primaryColor}" stroke-width="2" />
    <path d="M30 -20 L15 10 L45 10 Z" fill="#1E293B" stroke="${primaryColor}" stroke-width="2" />
  `;
}

export class AiBlogService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Builds an authoritative, publication-ready, web-optimized 16:9 vector featured image
   * tailored to LEGOMARK INDIA corporate branding and the blog article's content.
   */
  buildBrandedFeaturedImageSvg(params: {
    title: string;
    category: string;
    focusKeyword: string;
    summary: string;
  }): string {
    const theme = getCategoryTheme(params.category);
    const titleLines = wrapLines(params.title, 32, 3);
    const safeFocus = escapeXml(params.focusKeyword || 'Corporate Compliance & Legal Advisory');
    const safeAuthority = escapeXml(theme.authorityText);

    return `<svg width="1200" height="675" viewBox="0 0 1200 675" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="675" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#080C18" />
      <stop offset="55%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>
    <pattern id="gridPattern" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#334155" stroke-width="1" stroke-opacity="0.15" />
      <circle cx="0" cy="0" r="1" fill="#64748B" fill-opacity="0.3" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="675" fill="url(#bgGrad)" />
  <rect width="1200" height="675" fill="url(#gridPattern)" />

  <!-- Atmospheric Glow Orbs -->
  <circle cx="1080" cy="180" r="380" fill="${theme.primaryColor}" fill-opacity="0.09" />
  <circle cx="120" cy="560" r="260" fill="${theme.secondaryColor}" fill-opacity="0.07" />

  <!-- Outer Architectural Framing -->
  <rect x="28" y="28" width="1144" height="619" rx="16" fill="none" stroke="#334155" stroke-width="1.5" stroke-opacity="0.4" />
  <rect x="32" y="32" width="1136" height="611" rx="12" fill="none" stroke="${theme.primaryColor}" stroke-width="1" stroke-opacity="0.2" />

  <!-- Corner Brackets -->
  <path d="M44 60 L44 44 L60 44" stroke="${theme.primaryColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <path d="M1156 60 L1156 44 L1140 44" stroke="${theme.primaryColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <path d="M44 615 L44 631 L60 631" stroke="${theme.primaryColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <path d="M1156 615 L1156 631 L1140 631" stroke="${theme.primaryColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />

  <!-- Top Header Section -->
  <!-- Category Pill Badge -->
  <g transform="translate(70, 68)">
    <rect width="270" height="36" rx="18" fill="${theme.primaryColor}" fill-opacity="0.14" stroke="${theme.primaryColor}" stroke-width="1" stroke-opacity="0.4" />
    <circle cx="18" cy="18" r="4" fill="${theme.primaryColor}" />
    <text x="32" y="22" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5">${escapeXml(theme.badgeText)}</text>
  </g>

  <!-- Brand Identity on Top Right -->
  <g transform="translate(1130, 72)">
    <text x="0" y="14" text-anchor="end" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" letter-spacing="2">LEGOMARK INDIA</text>
    <text x="0" y="32" text-anchor="end" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" letter-spacing="1.5">LEGAL, TAXATION &amp; CORPORATE ADVISORY</text>
  </g>

  <!-- Horizontal Separation Line -->
  <line x1="70" y1="124" x2="1130" y2="124" stroke="#334155" stroke-width="1" stroke-opacity="0.35" />

  <!-- Center Content Area -->
  <!-- Regulatory Subheading -->
  <text x="70" y="168" fill="${theme.primaryColor}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="2">${safeAuthority}</text>

  <!-- Dynamic Blog Title (Multi-line SVG Text) -->
  <text x="70" y="230" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="800" letter-spacing="-0.5">
    ${titleLines.map((line, idx) => `<tspan x="70" dy="${idx === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`).join('')}
  </text>

  <!-- Focus Keyword Chip -->
  <g transform="translate(70, 410)">
    <rect width="460" height="34" rx="8" fill="#0F172A" stroke="#334155" stroke-width="1" />
    <text x="16" y="21" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">Focus:</text>
    <text x="62" y="21" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700">${safeFocus}</text>
  </g>

  <!-- Right Side Graphic Medallion / Authority Seal -->
  <g transform="translate(960, 310)">
    <!-- Outer dashed aura ring -->
    <circle cx="0" cy="0" r="135" fill="none" stroke="${theme.primaryColor}" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="6 4" />
    <!-- Secondary solid boundary -->
    <circle cx="0" cy="0" r="120" fill="#0F172A" stroke="#334155" stroke-width="2" />
    <circle cx="0" cy="0" r="102" fill="#080C18" stroke="${theme.primaryColor}" stroke-width="1.5" stroke-opacity="0.5" />

    <!-- Core Thematic Icon -->
    ${renderEmblem(theme.iconType, theme.primaryColor)}

    <!-- Medallion Bottom Text Banner -->
    <rect x="-80" y="72" width="160" height="22" rx="11" fill="#0F172A" stroke="${theme.primaryColor}" stroke-width="1" />
    <text x="0" y="87" text-anchor="middle" fill="#CBD5E1" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="800" letter-spacing="1.2">OFFICIAL ADVISORY</text>
  </g>

  <!-- Bottom Trust Card / Footer -->
  <g transform="translate(70, 520)">
    <rect width="1060" height="76" rx="14" fill="#0F172A" fill-opacity="0.9" stroke="#334155" stroke-width="1" />
    
    <!-- Left badge icon -->
    <circle cx="35" cy="38" r="16" fill="${theme.primaryColor}" fill-opacity="0.15" stroke="${theme.primaryColor}" stroke-width="1" />
    <path d="M28 38 L33 43 L42 33" fill="none" stroke="${theme.primaryColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

    <text x="64" y="32" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700">Official Indian Statutory Guidance &amp; Practice Roadmap</text>
    <text x="64" y="52" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="12">Verified by Advocates, Chartered Accountants &amp; Company Secretaries • New Delhi, India</text>

    <!-- Right link -->
    <text x="1020" y="43" text-anchor="end" fill="${theme.primaryColor}" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700">legomarkindia.com →</text>
  </g>
</svg>`;
  }

  /**
   * Generates ONE featured image for the blog and saves it into the existing Media storage system.
   * Returns the public URL (e.g. /uploads/media/blog_featured_...).
   */
  async generateFeaturedImage(draft: {
    title: string;
    category: string;
    slug: string;
    focusKeyword: string;
    summary: string;
  }): Promise<string> {
    const mediaDir = path.join(config.uploadsDir, 'media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    const safeSlug = (draft.slug || 'blog')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Optional attempt with Gemini image generation model (if paid key / billing is configured)
    try {
      const ai = this.getClient();
      const imagePrompt = `High-end corporate legal publication banner for article titled "${draft.title}". Practice: ${draft.category}. Style: LEGOMARK INDIA corporate branding, deep navy blue and warm amber gold tones, legal and corporate motifs, 16:9 ratio, high quality.`;
      const imageRes = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: imagePrompt,
        config: {
          imageConfig: {
            aspectRatio: '16:9',
          },
        },
      });

      const parts = imageRes.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const ext = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
          const filename = `blog_featured_${safeSlug}_${uniqueSuffix}.${ext}`;
          const filePath = path.join(mediaDir, filename);
          fs.writeFileSync(filePath, Buffer.from(part.inlineData.data, 'base64'));
          logger.info(`Generated and saved bitmap featured image: /uploads/media/${filename}`, 'AiBlogService');
          return `/uploads/media/${filename}`;
        }
      }
    } catch (imgErr) {
      logger.info('Using high-fidelity LEGOMARK INDIA branded vector featured image', 'AiBlogService');
    }

    // 2. Generate publication-grade, web-optimized SVG styled in LEGOMARK INDIA branding
    const filename = `blog_featured_${safeSlug}_${uniqueSuffix}.svg`;
    const filePath = path.join(mediaDir, filename);
    const svgContent = this.buildBrandedFeaturedImageSvg({
      title: draft.title,
      category: draft.category,
      focusKeyword: draft.focusKeyword,
      summary: draft.summary,
    });

    fs.writeFileSync(filePath, svgContent, 'utf-8');
    logger.info(`Generated and saved branded vector featured image: /uploads/media/${filename}`, 'AiBlogService');
    return `/uploads/media/${filename}`;
  }

  async generateBlog(topic: string, targetService: string): Promise<GeneratedBlogDraft> {
    const cleanTopic = topic?.trim();
    const cleanService = targetService?.trim();

    if (!cleanTopic) {
      throw new Error('Topic/Keyword is required');
    }

    const ai = this.getClient();

    const prompt = `You are a senior corporate attorney, chartered accountant, and tax advisory specialist writing for LEGOMARK INDIA (legomarkindia.com), a premier legal, taxation, intellectual property, and company incorporation firm in New Delhi, India.

Write an authoritative, highly comprehensive, publication-ready educational blog article and SEO metadata based on:
- Topic/Keyword: "${cleanTopic}"
- Target Service / Practice Area: "${cleanService || 'Corporate Legal & Compliance'}"

Follow these strict guidelines:
1. Title: Engaging, authoritative headline under 70 characters suitable for Indian corporate law, taxation, or startup founders.
2. SEO Title: Highly optimized title with primary keyword and brand suffix (e.g., "... | LEGOMARK INDIA"), 50-60 characters.
3. Meta Description: Compelling search engine snippet describing statutory requirements, 150-160 characters.
4. Slug: Clean, URL-safe lowercase kebab-case slug without special symbols or stop words.
5. Focus Keyword: Primary high-intent commercial or informational search keyword.
6. Related Keywords: 4 to 6 related LSI search terms and legal phrases in India.
7. Summary: 2-3 sentence executive summary explaining the importance, regulatory authority (MCA, GST Council, CGST, Income Tax Dept, IP India / Controller General of Patents, Designs and Trade Marks, FSSAI, etc.), and practical implications.
8. FAQ: 4 to 5 realistic questions frequently asked by Indian founders, business owners, or directors with accurate, authoritative answers.
9. Blog Content: Comprehensive Markdown content (minimum 800-1200 words) structured with clear headings (##, ###), bullet points, statutory references (e.g. Companies Act 2013, Trade Marks Act 1999, CGST Act 2017, Income Tax Act 1961), step-by-step procedural roadmap, documentation checklist, and practical compliance tips. Include a concluding call-to-action recommending LEGOMARK INDIA for professional assistance. Do not include raw HTML; use pure valid Markdown.
10. Category: Choose the most accurate category among:
    - "Company Registration"
    - "Taxation & GST"
    - "Trademark & IP"
    - "Compliance & ROC"
    - "Startups & Funding"
    - "Corporate Advisory"
    - "Legal Drafting"
    - "FSSAI & Licensing"`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Blog title under 70 chars' },
        seoTitle: { type: Type.STRING, description: 'SEO title 50-60 chars' },
        metaDescription: { type: Type.STRING, description: 'Meta description 150-160 chars' },
        slug: { type: Type.STRING, description: 'URL-friendly kebab-case slug' },
        focusKeyword: { type: Type.STRING, description: 'Primary focus keyword' },
        relatedKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '4-6 related keywords',
        },
        summary: { type: Type.STRING, description: 'Executive summary / excerpt' },
        faq: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ['question', 'answer'],
          },
          description: '4-5 FAQs with questions and answers',
        },
        blogContent: { type: Type.STRING, description: 'Complete structured Markdown body' },
        category: { type: Type.STRING, description: 'Target category' },
      },
      required: [
        'title',
        'seoTitle',
        'metaDescription',
        'slug',
        'focusKeyword',
        'relatedKeywords',
        'summary',
        'faq',
        'blogContent',
        'category',
      ],
    };

    logger.info(`Generating AI blog for topic: "${cleanTopic}" | Service: "${cleanService}"`, 'AiBlogService');

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
            temperature: 0.7,
          },
        });
        if (response && response.text) {
          logger.info(`Successfully generated blog using model: ${modelName}`, 'AiBlogService');
          break;
        }
      } catch (err: any) {
        lastError = err;
        logger.warn(`Model ${modelName} encountered issue (${err?.message || 'unknown error'}), attempting next model...`, 'AiBlogService');
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All candidate AI models were unable to generate content');
    }

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error('Gemini API returned an empty response');
    }

    let parsed: GeneratedBlogDraft;
    try {
      parsed = JSON.parse(rawText) as GeneratedBlogDraft;
    } catch (parseErr) {
      logger.error('Failed to parse AI blog JSON', 'AiBlogService', parseErr);
      throw new Error('Failed to parse AI generated blog response structure');
    }

    // Generate ONE featured image for the blog and save to the existing Media storage system
    try {
      const featuredImageUrl = await this.generateFeaturedImage({
        title: parsed.title,
        category: parsed.category,
        slug: parsed.slug,
        focusKeyword: parsed.focusKeyword,
        summary: parsed.summary,
      });
      parsed.featuredImage = featuredImageUrl;
    } catch (featImgErr) {
      logger.error('Failed to generate featured image for AI blog', 'AiBlogService', featImgErr);
      parsed.featuredImage = null;
    }

    return parsed;
  }
}

export const aiBlogService = new AiBlogService();

