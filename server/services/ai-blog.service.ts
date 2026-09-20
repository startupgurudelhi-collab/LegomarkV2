import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { settingsRepository } from '../repositories/settings.repository';

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

interface MainVisualConcept {
  concept: string;
  subjectDescription: string;
  svgFocalElement: 'trademark' | 'tax' | 'startup' | 'compliance' | 'licensing' | 'corporate';
}

function getMainVisualConcept(category: string, title: string, keyword: string): MainVisualConcept {
  const combined = `${category} ${title} ${keyword}`.toLowerCase();

  if (combined.includes('trademark') || combined.includes('ip') || combined.includes('brand') || combined.includes('patent') || combined.includes('copyright')) {
    return {
      concept: 'Intellectual Property & Trademark Registry',
      subjectDescription: 'A single, high-end solid brass official seal stamp with a polished wood handle resting on a crisp white parchment document with an embossed seal mark, surrounded by generous clean white and light grey space, soft morning daylight, realistic macro editorial photography.',
      svgFocalElement: 'trademark',
    };
  }
  if (combined.includes('tax') || combined.includes('gst') || combined.includes('audit') || combined.includes('finance') || combined.includes('return')) {
    return {
      concept: 'Corporate Taxation & Financial Compliance',
      subjectDescription: 'A clean, modern executive desk with a solitary sleek fountain pen resting across an open white statutory compliance ledger, subtle navy accents, soft natural daylight, bright off-white editorial composition.',
      svgFocalElement: 'tax',
    };
  }
  if (combined.includes('startup') || combined.includes('fund') || combined.includes('venture') || combined.includes('invest')) {
    return {
      concept: 'Corporate Enterprise & Formation Charter',
      subjectDescription: 'A bright, sunlit modern executive suite with an airy white desk, a solitary white certificate folio with subtle navy trim, clean architectural glass reflections, and calm spacious white negative space.',
      svgFocalElement: 'startup',
    };
  }
  if (combined.includes('compliance') || combined.includes('roc') || combined.includes('annual') || combined.includes('director')) {
    return {
      concept: 'Corporate Governance & Statutory Oversight',
      subjectDescription: 'A pristine, bright advisory suite with a white desk surface, a single bound white corporate registry dossier with a subtle orange ribbon bookmark, and soft natural window light.',
      svgFocalElement: 'compliance',
    };
  }
  if (combined.includes('fssai') || combined.includes('licens') || combined.includes('food') || combined.includes('standard')) {
    return {
      concept: 'Statutory Licensing & Regulatory Governance',
      subjectDescription: 'A clean executive desk in a bright, white-toned modern office with frosted architectural glass, a single official certificate binder, and soft ambient natural light.',
      svgFocalElement: 'licensing',
    };
  }

  return {
    concept: 'Corporate Advisory & Legal Consultation',
    subjectDescription: 'An elegant, bright corporate advisory setting with a solitary executive fountain pen resting on a crisp white contract document, clean light grey background, and soft natural daylight.',
    svgFocalElement: 'corporate',
  };
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
   * Resolves the existing LEGOMARK logo asset from Settings or Media/Assets system.
   * If a custom logo exists on disk, reads it as base64 data URI; otherwise returns metadata for the vector brand mark.
   */
  async getCompanyLogoAsset(): Promise<{
    dataUri?: string;
    width: number;
    height: number;
    isCustom: boolean;
  }> {
    try {
      const settings = await settingsRepository.getSettings();
      if (settings && settings.logoUrl) {
        const cleanUrl = settings.logoUrl.trim();
        const candidates = [
          path.join(process.cwd(), 'public', cleanUrl.replace(/^\//, '')),
          path.join(config.uploadsDir, '..', cleanUrl.replace(/^\//, '')),
          path.join(config.uploadsDir, path.basename(cleanUrl)),
          path.join(config.uploadsDir, 'logos', path.basename(cleanUrl)),
          path.join(config.uploadsDir, 'media', path.basename(cleanUrl)),
        ];

        for (const candidate of candidates) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            const ext = path.extname(candidate).toLowerCase();
            const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
            const buf = fs.readFileSync(candidate);
            const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
            logger.info(`Found custom logo asset on disk: ${candidate}`, 'AiBlogService');
            return {
              dataUri,
              width: 120,
              height: 105,
              isCustom: true,
            };
          }
        }
      }

      // Check media and logo directories for official logo file
      const searchDirs = [
        path.join(config.uploadsDir, 'logos'),
        path.join(config.uploadsDir, 'media'),
        path.join(process.cwd(), 'public', 'uploads', 'logos'),
        path.join(process.cwd(), 'public', 'uploads', 'media'),
      ];

      for (const dir of searchDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const logoFile = files.find((f) => /logo/i.test(f) && /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
          if (logoFile) {
            const fullPath = path.join(dir, logoFile);
            const ext = path.extname(fullPath).toLowerCase();
            const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
            const buf = fs.readFileSync(fullPath);
            const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
            logger.info(`Found logo in media directory: ${fullPath}`, 'AiBlogService');
            return {
              dataUri,
              width: 120,
              height: 105,
              isCustom: true,
            };
          }
        }
      }
    } catch (err) {
      logger.warn('Error resolving company logo asset, using fallback vector mark', 'AiBlogService');
    }

    return {
      width: 120,
      height: 105,
      isCustom: false,
    };
  }

  /**
   * Renders the authentic LEGOMARK INDIA logo overlay, kept small, elegant, and understated.
   */
  renderLogoOverlaySvg(logoAsset: {
    dataUri?: string;
    width: number;
    height: number;
    isCustom: boolean;
  }): string {
    if (logoAsset.isCustom && logoAsset.dataUri) {
      return `
  <!-- Programmatic Authentic LEGOMARK INDIA Logo Overlay (Small & Elegant) -->
  <g id="legomark-editorial-logo" transform="translate(64, 52)">
    <image href="${logoAsset.dataUri}" x="0" y="0" width="${logoAsset.width || 120}" height="${logoAsset.height || 105}" preserveAspectRatio="xMidYMid meet" />
  </g>`;
    }

    // Inline authentic LEGOMARK INDIA vector mark (matching the exact official logo asset)
    return `
  <!-- Programmatic Authentic LEGOMARK INDIA Logo Overlay (Small & Elegant Vector Fallback) -->
  <g id="legomark-editorial-logo" transform="translate(64, 52) scale(0.38)">
    <!-- Scalloped Circular Medallion -->
    <path d="M 250.00 105.00 L 249.20 109.84 L 247.01 114.71 L 243.83 119.50 L 240.23 124.08 L 236.78 128.34 L 233.99 132.14 L 232.22 135.39 L 231.68 137.98 L 232.39 139.88 L 234.19 141.05 L 236.77 141.53 L 239.73 141.40 L 242.60 140.80 L 244.93 139.89 L 246.33 138.86 L 246.46 137.94 L 245.12 137.33 L 242.26 137.24 L 238.00 137.83 L 232.58 139.23 L 226.37 141.51 L 219.78 144.66 L 213.23 148.62 L 207.13 153.27 L 201.87 158.45 L 197.77 163.95 L 195.04 169.51 L 193.84 174.88 L 194.20 179.77 L 195.96 183.91 L 198.86 187.05 L 202.51 188.98 L 206.45 189.54 L 210.15 188.66 L 213.11 186.37 L 214.90 182.84 L 215.19 178.33 L 213.79 173.18 L 210.63 167.76 L 205.80 162.47 L 199.50 157.69 L 192.05 153.76 L 183.83 150.97 L 175.25 149.52 L 166.72 149.52 L 158.67 150.99 L 151.48 153.84 L 145.47 157.89 L 140.87 162.80 L 137.86 168.21 L 136.49 173.74 L 136.67 178.96 L 138.21 183.47 L 140.80 186.91 L 144.07 189.00 L 147.57 189.52 L 150.81 188.35 L 153.30 178.33 Z" fill="none" stroke="#1A2B6B" stroke-width="3" />
    <circle cx="160" cy="105" r="82" fill="none" stroke="#1A2B6B" stroke-width="1.5" stroke-opacity="0.5" />
    
    <!-- Stylized Leg in Orange -->
    <path d="M 105,128 C 115,95 125,80 132,80 C 138,80 135,100 128,115 C 122,127 115,127 108,127 C 102,127 98,123 98,115" fill="none" stroke="#EA580C" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 120,110 C 128,105 135,103 140,108 C 144,112 142,121 134,123 C 124,125 120,115 124,109" fill="none" stroke="#EA580C" stroke-width="5" stroke-linecap="round" />
    <path d="M 138,123 C 142,127 148,120 150,113 C 152,103 148,90 154,90 C 160,90 156,117 158,123 C 160,129 168,125 172,117" fill="none" stroke="#EA580C" stroke-width="5" stroke-linecap="round" />
    
    <!-- o in Navy -->
    <ellipse cx="180" cy="115" rx="9" ry="12" fill="none" stroke="#1A2B6B" stroke-width="4" />

    <!-- Globe in Orange -->
    <g transform="translate(202, 111)">
      <circle cx="0" cy="0" r="13" fill="none" stroke="#EA580C" stroke-width="2" />
      <line x1="-13" y1="0" x2="13" y2="0" stroke="#EA580C" stroke-width="1.8" />
      <line x1="-11" y1="-5" x2="11" y2="-5" stroke="#EA580C" stroke-width="1.4" />
      <line x1="-11" y1="5" x2="11" y2="5" stroke="#EA580C" stroke-width="1.4" />
      <ellipse cx="0" cy="0" rx="6" ry="13" fill="none" stroke="#EA580C" stroke-width="1.6" />
      <line x1="0" y1="-13" x2="0" y2="13" stroke="#EA580C" stroke-width="1.8" />
    </g>

    <!-- Upward swooping arrow in Orange -->
    <path d="M 85,123 C 115,127 145,140 185,133 C 205,129 218,117 228,109" fill="none" stroke="#EA580C" stroke-width="6" stroke-linecap="round" />
    <polygon points="228,109 214,107 222,119" fill="#EA580C" />

    <!-- Rectangular LEGOMARK Box -->
    <g transform="translate(24, 212)">
      <rect x="0" y="0" width="272" height="42" fill="#FFFFFF" stroke="#1A2B6B" stroke-width="2.5" />
      <rect x="0" y="0" width="128" height="42" fill="#1A2B6B" />
      <text x="64" y="31" text-anchor="middle" fill="#FFFFFF" font-family="'Times New Roman', Times, Georgia, serif" font-size="30" font-weight="900" letter-spacing="1">LEGO</text>
      <text x="200" y="31" text-anchor="middle" fill="#EA580C" font-family="'Times New Roman', Times, Georgia, serif" font-size="30" font-weight="900" letter-spacing="1">MARK</text>
    </g>

    <!-- Subtitle: I N D I A -->
    <text x="160" y="274" text-anchor="middle" fill="#1A2B6B" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="900" letter-spacing="14">INDIA</text>
  </g>`;
  }

  /**
   * Builds an authoritative, minimal 16:9 editorial vector featured image.
   * Full bleed without white borders or side gaps, primarily WHITE / very light grey background,
   * subtle navy and orange accents, minimal thin lines/curves/dots, exactly ONE clean business visual,
   * no large title text inside the image, exact website www.legomarkindia.com, and authentic small logo.
   */
  buildBrandedFeaturedImageSvg(params: {
    title: string;
    category: string;
    focusKeyword: string;
    summary: string;
    logoAsset?: { dataUri?: string; width: number; height: number; isCustom: boolean };
  }): string {
    const logoAsset = params.logoAsset || { width: 120, height: 105, isCustom: false };
    const logoOverlaySvg = this.renderLogoOverlaySvg(logoAsset);
    const visual = getMainVisualConcept(params.category, params.title, params.focusKeyword);

    // Render ONE clean, realistic business/legal/compliance focal visual based on topic
    let focalVisualElement = '';

    if (visual.svgFocalElement === 'trademark') {
      // Clean, authentic solid brass registry seal stamp and embossed white legal folio
      focalVisualElement = `
  <g id="editorial-focal-visual">
    <!-- Soft Natural Shadow beneath Document -->
    <ellipse cx="1200" cy="850" rx="340" ry="24" fill="#0F172A" fill-opacity="0.05" />

    <!-- Crisp White Registry Document -->
    <g transform="translate(940, 560) rotate(-2)">
      <rect x="0" y="0" width="520" height="290" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" />
      <rect x="14" y="14" width="492" height="262" rx="2" fill="none" stroke="#F1F5F9" stroke-width="1" />
      
      <!-- Minimal Hairline Document Structure (Whisper Quiet, No Heavy Text) -->
      <line x1="48" y1="52" x2="220" y2="52" stroke="#CBD5E1" stroke-width="2.5" />
      <line x1="48" y1="84" x2="440" y2="84" stroke="#E2E8F0" stroke-width="1.2" />
      <line x1="48" y1="108" x2="400" y2="108" stroke="#E2E8F0" stroke-width="1.2" />
      <line x1="48" y1="132" x2="360" y2="132" stroke="#E2E8F0" stroke-width="1.2" />
      
      <!-- Subtle Orange Embossed Official Seal Impression -->
      <circle cx="120" cy="204" r="32" fill="none" stroke="#EA580C" stroke-width="1.5" stroke-opacity="0.45" stroke-dasharray="4 2" />
      <circle cx="120" cy="204" r="23" fill="none" stroke="#EA580C" stroke-width="1" stroke-opacity="0.3" />
      <path d="M 112,204 L 128,204 M 120,196 L 120,212" stroke="#EA580C" stroke-width="1" stroke-opacity="0.35" />
    </g>

    <!-- Solid Brass Seal Stamp with Turned Wood Handle -->
    <g transform="translate(1320, 680)">
      <!-- Soft Shadow under stamp -->
      <ellipse cx="26" cy="74" rx="42" ry="14" fill="#0F172A" fill-opacity="0.10" />
      
      <!-- Brass Base Disc -->
      <ellipse cx="26" cy="64" rx="36" ry="12" fill="#D97706" />
      <rect x="-10" y="44" width="72" height="20" fill="#B45309" />
      <ellipse cx="26" cy="44" rx="36" ry="12" fill="#FBBF24" />
      <ellipse cx="26" cy="44" rx="32" ry="10" fill="#F59E0B" />
      <line x1="2" y1="44" x2="50" y2="44" stroke="#FEF3C7" stroke-width="1.5" stroke-opacity="0.8" />
      
      <!-- Turned Wood Handle -->
      <path d="M 12,44 C 12,25 18,15 20,0 C 22,-20 18,-60 26,-80 C 34,-60 30,-20 32,0 C 34,15 40,25 40,44 Z" fill="#1E293B" stroke="#0F172A" stroke-width="1" />
      <circle cx="26" cy="-80" r="16" fill="#1E293B" stroke="#0F172A" stroke-width="1" />
      <!-- Subtle Brass Collar Ring -->
      <rect x="18" y="24" width="16" height="6" rx="1" fill="#F59E0B" />
    </g>
  </g>`;
    } else {
      // Clean Executive Fountain Pen resting on Crisp Statutory Portfolio Dossier
      focalVisualElement = `
  <g id="editorial-focal-visual">
    <!-- Soft Natural Shadow beneath Dossier -->
    <ellipse cx="1200" cy="850" rx="380" ry="24" fill="#0F172A" fill-opacity="0.05" />

    <!-- Crisp White Advisory Dossier -->
    <g transform="translate(940, 580) rotate(-2)">
      <rect x="0" y="0" width="540" height="280" rx="6" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" />
      <!-- Subtle Navy Spine Accent -->
      <rect x="0" y="0" width="14" height="280" rx="2" fill="#1A2B6B" fill-opacity="0.85" />
      
      <!-- Minimal Hairline Lines on Sheet -->
      <line x1="56" y1="50" x2="240" y2="50" stroke="#CBD5E1" stroke-width="2.5" />
      <line x1="56" y1="80" x2="480" y2="80" stroke="#E2E8F0" stroke-width="1.2" />
      <line x1="56" y1="104" x2="440" y2="104" stroke="#E2E8F0" stroke-width="1.2" />
      <line x1="56" y1="128" x2="400" y2="128" stroke="#E2E8F0" stroke-width="1.2" />
      
      <!-- Subtle Orange Ribbon Bookmark Accent -->
      <path d="M 380,0 L 380,180 L 392,168 L 404,180 L 404,0 Z" fill="#EA580C" fill-opacity="0.75" />
    </g>

    <!-- Bespoke Executive Fountain Pen resting diagonally -->
    <g transform="translate(1160, 680) rotate(22)">
      <!-- Pen Shadow -->
      <rect x="4" y="6" width="320" height="14" rx="7" fill="#0F172A" fill-opacity="0.08" />
      
      <!-- Deep Navy Barrel -->
      <rect x="0" y="0" width="320" height="14" rx="7" fill="#0F172A" stroke="#1E293B" stroke-width="1" />
      
      <!-- Subtle Center Band & Clip -->
      <rect x="120" y="0" width="14" height="14" fill="#E2E8F0" />
      <rect x="124" y="-2" width="80" height="3" rx="1.5" fill="#CBD5E1" />
      
      <!-- Subtle Orange Accent Ring -->
      <rect x="134" y="0" width="3" height="14" fill="#EA580C" />
      
      <!-- Polished Nib -->
      <polygon points="0,7 -24,2 -24,12" fill="#E2E8F0" />
      <line x1="0" y1="7" x2="-18" y2="7" stroke="#94A3B8" stroke-width="1" />
      
      <!-- Natural Highlight Reflection on Pen -->
      <line x1="16" y1="3" x2="300" y2="3" stroke="#FFFFFF" stroke-width="1.2" stroke-opacity="0.5" />
    </g>
  </g>`;
    }

    return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Background: Primarily White / Very Light Grey Editorial Gradient -->
    <linearGradient id="bgLight" x1="0" y1="0" x2="1920" y2="1080" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>

    <!-- Light Surface Plane -->
    <linearGradient id="deskSurface" x1="0" y1="620" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
  </defs>

  <!-- 1. Full-Bleed 16:9 Canvas (Primarily White / Very Light Grey) -->
  <rect x="0" y="0" width="1920" height="1080" fill="url(#bgLight)" />
  <polygon points="0,640 1920,640 1920,1080 0,1080" fill="url(#deskSurface)" />
  <line x1="0" y1="640" x2="1920" y2="640" stroke="#E2E8F0" stroke-width="1" />

  <!-- 2. Minimal Thin Lines, Curves, Dots Only -->
  <!-- Subtle architectural window lines -->
  <g opacity="0.45">
    <line x1="1280" y1="0" x2="1280" y2="640" stroke="#E2E8F0" stroke-width="1" />
    <line x1="1620" y1="0" x2="1620" y2="640" stroke="#E2E8F0" stroke-width="1" />
    <line x1="1100" y1="260" x2="1920" y2="260" stroke="#E2E8F0" stroke-width="1" />
  </g>

  <!-- Subtle Navy Hairline Curve Accent -->
  <path d="M 820,0 C 1120,160 1380,400 1920,520" fill="none" stroke="#1A2B6B" stroke-width="1" stroke-opacity="0.08" />

  <!-- Subtle Minimal Geometric Dot Matrix (Subtle Detail) -->
  <g opacity="0.30">
    <circle cx="260" cy="880" r="1.5" fill="#94A3B8" />
    <circle cx="290" cy="880" r="1.5" fill="#94A3B8" />
    <circle cx="320" cy="880" r="1.5" fill="#94A3B8" />
    <circle cx="260" cy="910" r="1.5" fill="#94A3B8" />
    <circle cx="290" cy="910" r="1.5" fill="#94A3B8" />
    <circle cx="320" cy="910" r="1.5" fill="#94A3B8" />
  </g>

  <!-- Minimal Thin Orange Accent Line -->
  <line x1="64" y1="188" x2="128" y2="188" stroke="#EA580C" stroke-width="1.5" stroke-opacity="0.55" />

  <!-- 3. ONE Clean, Realistic Business/Legal/Compliance Visual (No large text, no infographic clutter) -->
  ${focalVisualElement}

  <!-- 4. Mandatory Official Website URL (Exactly: www.legomarkindia.com) -->
  <text x="1840" y="1030" text-anchor="end" fill="#94A3B8" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" letter-spacing="1">www.legomarkindia.com</text>

  <!-- 5. Small & Elegant Authentic Logo Overlay -->
  ${logoOverlaySvg}
</svg>`;
  }

  /**
   * Generates ONE featured image for the blog and saves it into the existing Media storage system.
   * Focuses on a minimal, elegant editorial photography hero image (with exactly ONE main visual concept),
   * primarily WHITE / very light grey environment, subtle navy and orange accents,
   * overlays the authentic LEGOMARK logo asset programmatically, and guarantees a 16:9 full-width banner.
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

    // Resolve existing LEGOMARK logo asset from Media/Assets system
    const logoAsset = await this.getCompanyLogoAsset();
    const logoOverlaySvg = this.renderLogoOverlaySvg(logoAsset);

    // 1. Attempt with Gemini image generation model
    // Minimal, elegant, corporate/editorial photography style.
    // Background primarily WHITE / very light grey.
    // Use ONE main visual concept related to the blog topic.
    // Strictly NO text, NO logos, NO infographics, NO badges, NO crowded icons.
    try {
      const visual = getMainVisualConcept(draft.category, draft.title, draft.focusKeyword);
      const ai = this.getClient();
      const imagePrompt = `Editorial corporate photography for a prestigious business advisory publication (Harvard Business Review, Financial Times, Bloomberg).
Article Topic: ${draft.title} (${draft.category}).
Single Focal Subject: Exactly ONE clean, realistic business/legal/compliance object related to the topic: ${visual.subjectDescription}.

Art Direction & Composition:
- Background: Primarily WHITE or very light grey (#FFFFFF, #F8FAFC). Clean, bright, airy modern executive office environment with abundant soft natural daylight.
- Style: Minimal, elegant, realistic corporate editorial photography. Uncluttered, spacious, and sophisticated.
- Palette: Dominantly crisp white and light grey tones, with very subtle navy (#1A2B6B) and discrete orange (#EA580C) accents only.
- Elements: Minimal thin lines, natural architectural shadows, or soft reflections.
- Composition: Exactly ONE central realistic subject occupying the focal area with generous, uncluttered light negative space surrounding it.
- Perspective: Full-bleed 16:9 composition filling the entire canvas with edge-to-edge content (no white side gaps or artificial margins).
- Lighting: Pure, soft, natural morning daylight. NO dark backgrounds. NO gold, neon, or vibrant glowing effects. NO excessive gradients or cinematic bloom.
- STRICT NEGATIVE INSTRUCTIONS:
  * ABSOLUTELY NO TEXT, NO HEADLINES, NO WORDS, NO LETTERS, NO NUMBERS (the image must contain zero typography).
  * ABSOLUTELY NO LOGOS, NO WATERMARKS, NO EMBLEMS (the official logo is applied programmatically).
  * ABSOLUTELY NO INFOGRAPHICS, NO BULLET POINTS, NO COMPARISON TABLES, NO GRAPHS, NO CHARTS.
  * ABSOLUTELY NO BANNERS, NO BADGES, NO SHIELDS, NO ICONS, NO CLUSTERS OF SYMBOLS.
  * ABSOLUTELY NO DARK NAVY OR BLACK BACKGROUNDS. The background must be clean, light, and airy.`;

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
          const filename = `blog_featured_${safeSlug}_${uniqueSuffix}.svg`;
          const filePath = path.join(mediaDir, filename);

          // Composite the full-bleed 16:9 AI editorial photograph with discrete official website URL and small logo overlay
          const compositeSvg = `<svg width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Full 16:9 Bleed Generated Editorial Photograph -->
  <image href="data:${mimeType};base64,${part.inlineData.data}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />

  <!-- Discrete Official Website URL (Exactly: www.legomarkindia.com) -->
  <text x="1840" y="1030" text-anchor="end" fill="#64748B" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" letter-spacing="1">www.legomarkindia.com</text>

  <!-- Programmatic Authentic LEGOMARK INDIA Logo Overlay (Small & Elegant) -->
  ${logoOverlaySvg}
</svg>`;

          fs.writeFileSync(filePath, compositeSvg, 'utf-8');
          logger.info(`Generated and saved editorial 16:9 featured banner with programmatic logo overlay: /uploads/media/${filename}`, 'AiBlogService');
          return `/uploads/media/${filename}`;
        }
      }
    } catch (imgErr) {
      logger.info('Using minimal, premium 16:9 LEGOMARK branded editorial vector featured banner', 'AiBlogService');
    }

    // 2. Minimal, premium, web-optimized 16:9 editorial vector featured banner with programmatic logo overlay
    const filename = `blog_featured_${safeSlug}_${uniqueSuffix}.svg`;
    const filePath = path.join(mediaDir, filename);
    const svgContent = this.buildBrandedFeaturedImageSvg({
      title: draft.title,
      category: draft.category,
      focusKeyword: draft.focusKeyword,
      summary: draft.summary,
      logoAsset,
    });

    fs.writeFileSync(filePath, svgContent, 'utf-8');
    logger.info(`Generated and saved minimal 16:9 branded vector featured banner: /uploads/media/${filename}`, 'AiBlogService');
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

  /**
   * Generates 5 to 10 context-aware FAQs with authoritative answers based on blog title, content, and category.
   */
  async generateFaqs(params: {
    title: string;
    content?: string;
    category?: string;
  }): Promise<Array<{ question: string; answer: string }>> {
    const cleanTitle = (params.title || '').trim();
    if (!cleanTitle) {
      throw new Error('Blog title is required for generating FAQs');
    }

    const ai = this.getClient();

    const prompt = `You are a senior corporate attorney, chartered accountant, and compliance expert for LEGOMARK INDIA (legomarkindia.com).

Generate 5 to 10 highly relevant, authoritative Frequently Asked Questions (FAQs) and practical, clear answers for Indian entrepreneurs, directors, and taxpayers based on this article context:
- Article Title: "${cleanTitle}"
- Category: "${params.category || 'Company Registration & Compliance'}"
${params.content ? `- Content Excerpt / Summary:\n${params.content.slice(0, 3000)}` : ''}

Strict Guidelines:
1. Generate between 5 and 10 question & answer pairs (aim for 6 to 8).
2. Questions must reflect real-world practical queries that Indian business founders, startup directors, or taxpayers ask (e.g. timelines, documents required, government fees, compliance penalties, eligibility criteria, post-registration duties).
3. Answers must be authoritative, concise, accurate according to Indian regulations (e.g., MCA SPICe+, Companies Act 2013, GST Council, Income Tax Act, DPIIT, Trademark Registry), and written in professional English.
4. Do not mention other consulting firms. Refer to LEGOMARK INDIA where helpful.`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      description: 'Frequently Asked Questions collection',
      properties: {
        faqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            description: 'Individual FAQ entry',
            properties: {
              question: { type: Type.STRING, description: 'Practical question asked by founders/taxpayers' },
              answer: { type: Type.STRING, description: 'Clear, authoritative explanation and answer' },
            },
            required: ['question', 'answer'],
          },
          description: '5 to 10 relevant FAQ items',
        },
      },
      required: ['faqs'],
    };

    logger.info(`Generating AI FAQs for blog: "${cleanTitle}"`, 'AiBlogService');

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
          logger.info(`Successfully generated FAQs using model: ${modelName}`, 'AiBlogService');
          break;
        }
      } catch (err: any) {
        lastError = err;
        logger.warn(`Model ${modelName} encountered issue generating FAQs (${err?.message || 'unknown error'}), trying next...`, 'AiBlogService');
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All candidate AI models were unable to generate FAQs');
    }

    const rawText = response.text.trim();
    try {
      const parsed = JSON.parse(rawText) as { faqs: Array<{ question: string; answer: string }> };
      if (!Array.isArray(parsed.faqs) || parsed.faqs.length === 0) {
        throw new Error('AI returned an empty FAQ list');
      }
      return parsed.faqs;
    } catch (parseErr) {
      logger.error('Failed to parse AI FAQs JSON', 'AiBlogService', parseErr);
      throw new Error('Failed to parse AI generated FAQs response');
    }
  }
}

export const aiBlogService = new AiBlogService();

