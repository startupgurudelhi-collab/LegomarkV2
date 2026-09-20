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

export type TopicVisualType = 'gst' | 'roc' | 'trademark' | 'company_registration' | 'itr' | 'licensing' | 'general_corporate';

interface MainVisualConcept {
  topicType: TopicVisualType;
  concept: string;
  elementsDescription: string;
  aiPromptElements: string;
}

function getMainVisualConcept(category: string, title: string, keyword: string): MainVisualConcept {
  const combined = `${category} ${title} ${keyword}`.toLowerCase();

  // 1. Goods & Services Tax (GST)
  if (
    combined.includes('gst') ||
    combined.includes('goods and services') ||
    combined.includes('e-way') ||
    combined.includes('input tax') ||
    combined.includes('gstr')
  ) {
    return {
      topicType: 'gst',
      concept: 'Goods & Services Tax (GST) Filing & Statutory Tax Compliance',
      elementsDescription: 'GST invoice document, tax/ledger computation element, GST portal-style interface screen, modern financial calculator, compliance checkmark symbol',
      aiPromptElements: `1. Official GST tax invoice and filing document with structured line-art table rows, tax breakdown lines, and digital compliance barcode
2. Minimal digital GST portal-style screen frame with search bar, "GST Common Portal" header, and "FILED • E-VERIFIED" status badge
3. Sleek modern financial calculator with subtle navy keys and LCD display
4. Circular statutory compliance symbol node with subtle orange accent
5. Tax computation ledger element with percentage (%) indicator and thin connecting lines`,
    };
  }

  // 2. Income Tax Return (ITR) & Direct Taxation
  if (
    combined.includes('itr') ||
    combined.includes('income tax') ||
    combined.includes('tds') ||
    combined.includes('tax return') ||
    combined.includes('tax audit') ||
    combined.includes('form 16') ||
    combined.includes('assessment year')
  ) {
    return {
      topicType: 'itr',
      concept: 'Income Tax Return (ITR) Filing & Tax Assessment',
      elementsDescription: 'Income tax document, digital e-filing portal screen, financial calculator, compliance deduction symbol, tax assessment computation graph',
      aiPromptElements: `1. Official Income Tax Return (ITR) computation and acknowledgment document with clean hairline data rows
2. Digital income-tax e-filing portal interface screen frame showing verified return status
3. Minimal modern financial calculator with subtle navy keys
4. Tax deduction and statutory compliance verification checkmark node
5. Financial tax calculation ledger line with subtle orange milestone dots`,
    };
  }

  // 3. Trademark & Intellectual Property Rights
  if (
    combined.includes('trademark') ||
    combined.includes('tm') ||
    combined.includes('brand') ||
    combined.includes('patent') ||
    combined.includes('copyright') ||
    combined.includes('intellectual property') ||
    combined.includes('ipr') ||
    combined.includes('logo protect')
  ) {
    return {
      topicType: 'trademark',
      concept: 'Trademark Registration & Intellectual Property Protection',
      elementsDescription: 'Official trademark registration certificate, circular registered trademark symbol (® / ™), brand protection shield, trademark search concept, statutory registry verification stamp',
      aiPromptElements: `1. Official Trademark Registration Certificate document with fine ornamental border lines, Class lines, and circular seal impression
2. Prominent circular Registered Trademark symbol (® and ™) rendered in clean navy and orange line-art
3. Intellectual property brand protection shield icon node with verification keyhole
4. Trademark search and classification registry matrix concept (Class 1 to 45)
5. Official statutory registry verification stamp node with thin connecting geometric lines`,
    };
  }

  // 4. ROC & MCA Compliance
  if (
    combined.includes('roc') ||
    combined.includes('mca') ||
    combined.includes('annual filing') ||
    combined.includes('director') ||
    combined.includes('din') ||
    combined.includes('board meeting') ||
    combined.includes('secretarial') ||
    combined.includes('statutory compliance')
  ) {
    return {
      topicType: 'roc',
      concept: 'ROC Annual Filing & MCA Statutory Governance',
      elementsDescription: 'ROC filing document, company registry folder, corporate building facade, statutory compliance seal, annual compliance timeline',
      aiPromptElements: `1. Official ROC statutory annual filing document with government MCA emblem impression, Form AOC-4 / MGT-7 lines
2. Bound corporate registry folder with subtle orange bookmark tab
3. Elegant architectural corporate headquarters building facade in clean minimalist line-art
4. Statutory compliance verification seal node
5. Annual ROC filing timeline roadmap with connecting geometric circles and dots`,
    };
  }

  // 5. Company Registration & Corporate Incorporation
  if (
    combined.includes('incorporat') ||
    combined.includes('startup') ||
    combined.includes('private limited') ||
    combined.includes('llp') ||
    combined.includes('opc') ||
    combined.includes('company registration') ||
    combined.includes('register company') ||
    combined.includes('formation') ||
    combined.includes('spice')
  ) {
    return {
      topicType: 'company_registration',
      concept: 'Company Registration & Corporate Incorporation',
      elementsDescription: 'Certificate of Incorporation document, corporate enterprise building, company registry folder, corporate formation seal, incorporation milestone roadmap',
      aiPromptElements: `1. Official Certificate of Incorporation (SPICe+ / MCA) document with embossed registration seal and CIN highlight
2. Modern architectural corporate enterprise building silhouette in clean line-art
3. Company registry folder dossier with Memorandum of Association (MoA) tab
4. Corporate establishment verification badge node
5. Foundational incorporation milestone roadmap with thin navy and orange connecting lines`,
    };
  }

  // 6. Statutory Licensing & Regulatory Approvals (FSSAI, ISO, IEC, Shop Act, etc.)
  if (
    combined.includes('fssai') ||
    combined.includes('licens') ||
    combined.includes('food') ||
    combined.includes('import export') ||
    combined.includes('iec') ||
    combined.includes('iso') ||
    combined.includes('shop act') ||
    combined.includes('pollution')
  ) {
    return {
      topicType: 'licensing',
      concept: 'Statutory Licensing & Government Regulatory Approvals',
      elementsDescription: 'Statutory government license document, regulatory compliance shield, accreditation registry folder, approved inspection checkmark, validity renewal timeline',
      aiPromptElements: `1. Official government regulatory license document with accreditation seal mark and validity lines
2. Accredited standards compliance verification shield node
3. Regulatory accreditation registry folder dossier
4. Approved statutory inspection checkmark node with subtle orange accent
5. Licensing validity and renewal timeline with delicate connecting geometric geometry`,
    };
  }

  // 7. General Corporate Legal Advisory
  return {
    topicType: 'general_corporate',
    concept: 'Corporate Legal Advisory & Regulatory Governance',
    elementsDescription: 'Corporate legal agreement document, corporate headquarters facade, governance structure network, compliance verification shield, statutory regulatory timeline',
    aiPromptElements: `1. Formal corporate legal advisory agreement document with execution seal blocks
2. Refined corporate headquarters architectural facade silhouette in clean minimalist line-art
3. Corporate governance structure network node
4. Statutory compliance verification shield node
5. Interconnected regulatory timeline with delicate geometric navy and orange lines`,
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
              width: 220,
              height: 100,
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
              width: 220,
              height: 100,
              isCustom: true,
            };
          }
        }
      }
    } catch (err) {
      logger.warn('Error resolving company logo asset, using fallback vector mark', 'AiBlogService');
    }

    return {
      width: 220,
      height: 100,
      isCustom: false,
    };
  }

  /**
   * Renders the authentic LEGOMARK INDIA logo overlay prominently and elegantly in the upper-left area.
   * Placed directly on the canvas without any white card or badge, clearly recognizable and crisp.
   */
  renderLogoOverlaySvg(logoAsset: {
    dataUri?: string;
    width: number;
    height: number;
    isCustom: boolean;
  }): string {
    if (logoAsset.isCustom && logoAsset.dataUri) {
      return `
  <!-- Programmatic Authentic LEGOMARK INDIA Logo Overlay (Prominent & Elegant, Upper-Left, No Card/Badge) -->
  <g id="legomark-editorial-logo" transform="translate(80, 56)">
    <image href="${logoAsset.dataUri}" x="0" y="0" width="${logoAsset.width || 220}" height="${logoAsset.height || 100}" preserveAspectRatio="xMidYMid meet" />
  </g>`;
    }

    // Inline authentic LEGOMARK INDIA vector mark (matching official logo asset, prominent, no card/badge)
    return `
  <!-- Programmatic Authentic LEGOMARK INDIA Logo Overlay (Prominent & Elegant Vector Fallback, Upper-Left, No Card/Badge) -->
  <g id="legomark-editorial-logo" transform="translate(80, 50) scale(0.68)">
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
    const logoAsset = params.logoAsset || { width: 220, height: 100, isCustom: false };
    const logoOverlaySvg = this.renderLogoOverlaySvg(logoAsset);
    const visual = getMainVisualConcept(params.category, params.title, params.focusKeyword);

    // Render topic-specific editorial visual elements (3-5 specific items, clean line-art, no generic desk objects)
    let focalVisualElement = '';

    if (visual.topicType === 'gst') {
      focalVisualElement = `
  <g id="editorial-focal-visual">
    <!-- Topic Visual 1: Official GST Tax Invoice & Filing Document -->
    <g transform="translate(840, 480) rotate(-1)">
      <rect x="0" y="0" width="560" height="340" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <rect x="16" y="16" width="528" height="308" rx="3" fill="none" stroke="#F1F5F9" stroke-width="1" />
      <!-- Document Header -->
      <rect x="40" y="42" width="160" height="12" rx="2" fill="#1A2B6B" fill-opacity="0.85" />
      <rect x="40" y="62" width="90" height="6" rx="1" fill="#EA580C" fill-opacity="0.6" />
      <rect x="420" y="42" width="80" height="24" rx="3" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <line x1="430" y1="54" x2="490" y2="54" stroke="#1A2B6B" stroke-width="2" />
      <!-- Tax Data Table Grid -->
      <rect x="40" y="90" width="480" height="130" rx="3" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <line x1="40" y1="120" x2="520" y2="120" stroke="#CBD5E1" stroke-width="1" />
      <line x1="160" y1="90" x2="160" y2="220" stroke="#E2E8F0" stroke-width="1" />
      <line x1="280" y1="90" x2="280" y2="220" stroke="#E2E8F0" stroke-width="1" />
      <line x1="400" y1="90" x2="400" y2="220" stroke="#E2E8F0" stroke-width="1" />
      <!-- Table rows hairline -->
      <line x1="56" y1="145" x2="140" y2="145" stroke="#94A3B8" stroke-width="1.5" />
      <line x1="176" y1="145" x2="260" y2="145" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="296" y1="145" x2="380" y2="145" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="416" y1="145" x2="500" y2="145" stroke="#1A2B6B" stroke-width="1.5" />
      <line x1="56" y1="175" x2="130" y2="175" stroke="#94A3B8" stroke-width="1.5" />
      <line x1="176" y1="175" x2="250" y2="175" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="296" y1="175" x2="370" y2="175" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="416" y1="175" x2="490" y2="175" stroke="#1A2B6B" stroke-width="1.5" />
      <!-- Digital Barcode / Verification Stamp -->
      <g transform="translate(40, 240)">
        <line x1="0" y1="0" x2="0" y2="24" stroke="#1A2B6B" stroke-width="2" />
        <line x1="4" y1="0" x2="4" y2="24" stroke="#1A2B6B" stroke-width="1" />
        <line x1="8" y1="0" x2="8" y2="24" stroke="#1A2B6B" stroke-width="3" />
        <line x1="14" y1="0" x2="14" y2="24" stroke="#1A2B6B" stroke-width="1.5" />
        <line x1="20" y1="0" x2="20" y2="24" stroke="#1A2B6B" stroke-width="2.5" />
        <line x1="26" y1="0" x2="26" y2="24" stroke="#1A2B6B" stroke-width="1" />
        <line x1="32" y1="0" x2="32" y2="24" stroke="#1A2B6B" stroke-width="2" />
        <line x1="38" y1="0" x2="38" y2="24" stroke="#1A2B6B" stroke-width="3.5" />
      </g>
      <!-- Orange Verification Stamp -->
      <circle cx="460" cy="265" r="28" fill="none" stroke="#EA580C" stroke-width="1.5" stroke-dasharray="4 2" />
      <circle cx="460" cy="265" r="21" fill="none" stroke="#EA580C" stroke-width="1" />
      <path d="M 452,265 L 458,271 L 470,259" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Topic Visual 2: Digital GST Common Portal Screen Frame -->
    <g transform="translate(1380, 420)">
      <rect x="0" y="0" width="340" height="230" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <!-- Browser Top Bar -->
      <path d="M 0,8 C 0,3.6 3.6,0 8,0 L 332,0 C 336.4,0 340,3.6 340,8 L 340,28 L 0,28 Z" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <circle cx="14" cy="14" r="3.5" fill="#EF4444" />
      <circle cx="26" cy="14" r="3.5" fill="#F59E0B" />
      <circle cx="38" cy="14" r="3.5" fill="#10B981" />
      <rect x="60" y="7" width="180" height="14" rx="7" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="0.8" />
      <!-- Portal Header & Content -->
      <rect x="20" y="44" width="140" height="10" rx="2" fill="#1A2B6B" />
      <rect x="20" y="60" width="80" height="6" rx="1" fill="#94A3B8" />
      <rect x="20" y="80" width="300" height="54" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <!-- Status Badge -->
      <rect x="36" y="96" width="110" height="22" rx="11" fill="#10B981" fill-opacity="0.12" stroke="#10B981" stroke-width="1" />
      <circle cx="48" cy="107" r="3.5" fill="#10B981" />
      <line x1="58" y1="107" x2="132" y2="107" stroke="#047857" stroke-width="2" stroke-linecap="round" />
      <!-- Filing Indicator -->
      <rect x="20" y="150" width="180" height="8" rx="2" fill="#E2E8F0" />
      <rect x="20" y="168" width="120" height="8" rx="2" fill="#F1F5F9" />
    </g>

    <!-- Topic Visual 3: Modern Financial Calculator -->
    <g transform="translate(680, 560)">
      <rect x="0" y="0" width="180" height="250" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <!-- LCD Screen -->
      <rect x="14" y="16" width="152" height="42" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <line x1="80" y1="37" x2="152" y2="37" stroke="#1A2B6B" stroke-width="2.5" />
      <!-- Keypad Grid -->
      <g transform="translate(14, 72)">
        <rect x="0" y="0" width="32" height="26" rx="4" fill="#F1F5F9" />
        <rect x="40" y="0" width="32" height="26" rx="4" fill="#F1F5F9" />
        <rect x="80" y="0" width="32" height="26" rx="4" fill="#F1F5F9" />
        <rect x="120" y="0" width="32" height="26" rx="4" fill="#EA580C" />
        
        <rect x="0" y="34" width="32" height="26" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8" />
        <rect x="40" y="34" width="32" height="26" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8" />
        <rect x="80" y="34" width="32" height="26" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8" />
        <rect x="120" y="34" width="32" height="26" rx="4" fill="#1A2B6B" />

        <rect x="0" y="68" width="32" height="26" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8" />
        <rect x="40" y="68" width="32" height="26" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8" />
        <rect x="80" y="68" width="32" height="26" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8" />
        <rect x="120" y="68" width="32" height="60" rx="4" fill="#1A2B6B" />

        <rect x="0" y="102" width="72" height="26" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8" />
        <rect x="80" y="102" width="32" height="26" rx="4" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="0.8" />
      </g>
    </g>

    <!-- Topic Visual 4: Statutory Compliance Shield Node -->
    <g transform="translate(1420, 710)">
      <circle cx="40" cy="40" r="40" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <path d="M 40,16 L 62,26 C 62,48 40,62 40,62 C 40,62 18,48 18,26 Z" fill="none" stroke="#1A2B6B" stroke-width="2" stroke-linejoin="round" />
      <path d="M 32,38 L 38,44 L 50,32" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Topic Visual 5: Connected Geometric Tax Ledger Node -->
    <g transform="translate(720, 440)">
      <circle cx="20" cy="20" r="20" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.5" />
      <text x="20" y="27" text-anchor="middle" fill="#EA580C" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800">%</text>
      <line x1="40" y1="20" x2="120" y2="40" stroke="#EA580C" stroke-width="1" stroke-dasharray="3 3" />
    </g>
  </g>`;
    } else if (visual.topicType === 'trademark') {
      focalVisualElement = `
  <g id="editorial-focal-visual">
    <!-- Topic Visual 1: Official Trademark Registration Certificate -->
    <g transform="translate(860, 470) rotate(-1)">
      <rect x="0" y="0" width="560" height="350" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <rect x="14" y="14" width="532" height="322" rx="3" fill="none" stroke="#E2E8F0" stroke-width="1" />
      <rect x="18" y="18" width="524" height="314" rx="2" fill="none" stroke="#CBD5E1" stroke-width="0.8" stroke-dasharray="5 3" />
      <!-- Certificate Header -->
      <circle cx="280" cy="54" r="18" fill="none" stroke="#1A2B6B" stroke-width="1.5" />
      <circle cx="280" cy="54" r="13" fill="none" stroke="#EA580C" stroke-width="1" />
      <line x1="200" y1="86" x2="360" y2="86" stroke="#1A2B6B" stroke-width="2.5" />
      <line x1="230" y1="98" x2="330" y2="98" stroke="#EA580C" stroke-width="1.2" />
      <!-- Certificate Content Lines -->
      <line x1="60" y1="130" x2="500" y2="130" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="60" y1="152" x2="460" y2="152" stroke="#E2E8F0" stroke-width="1" />
      <line x1="60" y1="174" x2="420" y2="174" stroke="#E2E8F0" stroke-width="1" />
      <!-- Trademark Class Classification Box -->
      <rect x="60" y="200" width="220" height="50" rx="3" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <line x1="74" y1="218" x2="160" y2="218" stroke="#1A2B6B" stroke-width="1.5" />
      <line x1="74" y1="234" x2="250" y2="234" stroke="#94A3B8" stroke-width="1" />
      <!-- Embossed Official Gold/Orange Seal Impression -->
      <g transform="translate(420, 245)">
        <circle cx="35" cy="35" r="35" fill="none" stroke="#EA580C" stroke-width="1.8" stroke-dasharray="4 2" />
        <circle cx="35" cy="35" r="28" fill="none" stroke="#1A2B6B" stroke-width="1.2" />
        <text x="35" y="42" text-anchor="middle" fill="#EA580C" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900">®</text>
        <path d="M 20,68 L 26,88 L 35,80 L 44,88 L 50,68 Z" fill="#EA580C" fill-opacity="0.8" />
      </g>
    </g>

    <!-- Topic Visual 2: Prominent Circular Registered Trademark Symbol Emblem -->
    <g transform="translate(680, 520)">
      <circle cx="65" cy="65" r="65" fill="#FFFFFF" stroke="#1A2B6B" stroke-width="2.5" />
      <circle cx="65" cy="65" r="54" fill="none" stroke="#EA580C" stroke-width="1.5" />
      <text x="65" y="86" text-anchor="middle" fill="#1A2B6B" font-family="'Times New Roman', serif" font-size="68" font-weight="bold">®</text>
    </g>

    <!-- Topic Visual 3: Intellectual Property Protection Shield Node -->
    <g transform="translate(1440, 430)">
      <rect x="0" y="0" width="260" height="200" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <g transform="translate(130, 80)">
        <path d="M 0,-40 L 40,-20 C 40,24 0,48 0,48 C 0,48 -40,24 -40,-20 Z" fill="none" stroke="#1A2B6B" stroke-width="2.5" stroke-linejoin="round" />
        <circle cx="0" cy="-2" r="9" fill="none" stroke="#EA580C" stroke-width="2" />
        <line x1="0" y1="7" x2="0" y2="20" stroke="#EA580C" stroke-width="2" stroke-linecap="round" />
      </g>
      <line x1="40" y1="150" x2="220" y2="150" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="60" y1="168" x2="200" y2="168" stroke="#E2E8F0" stroke-width="1" />
    </g>

    <!-- Topic Visual 4: Trademark Search Matrix Grid -->
    <g transform="translate(1440, 680)">
      <rect x="0" y="0" width="240" height="130" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <circle cx="34" cy="34" r="14" fill="none" stroke="#1A2B6B" stroke-width="2" />
      <line x1="44" y1="44" x2="56" y2="56" stroke="#1A2B6B" stroke-width="2.5" stroke-linecap="round" />
      <line x1="68" y1="34" x2="200" y2="34" stroke="#1A2B6B" stroke-width="1.8" />
      <line x1="24" y1="72" x2="216" y2="72" stroke="#E2E8F0" stroke-width="1" />
      <line x1="24" y1="94" x2="160" y2="94" stroke="#CBD5E1" stroke-width="1.2" />
    </g>

    <!-- Topic Visual 5: Connected Trademark Stamp Node -->
    <g transform="translate(730, 710)">
      <circle cx="28" cy="28" r="28" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.5" />
      <text x="28" y="34" text-anchor="middle" fill="#EA580C" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900">TM</text>
      <line x1="56" y1="28" x2="130" y2="10" stroke="#EA580C" stroke-width="1" stroke-dasharray="3 3" />
    </g>
  </g>`;
    } else if (visual.topicType === 'roc') {
      focalVisualElement = `
  <g id="editorial-focal-visual">
    <!-- Topic Visual 1: ROC Statutory Annual Filing Document -->
    <g transform="translate(860, 480) rotate(-1)">
      <rect x="0" y="0" width="550" height="340" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <rect x="14" y="14" width="522" height="312" rx="3" fill="none" stroke="#F1F5F9" stroke-width="1" />
      <!-- Government MCA Emblem Impression -->
      <circle cx="60" cy="54" r="18" fill="none" stroke="#1A2B6B" stroke-width="1.5" />
      <circle cx="60" cy="54" r="12" fill="none" stroke="#EA580C" stroke-width="1" />
      <line x1="94" y1="46" x2="260" y2="46" stroke="#1A2B6B" stroke-width="2.5" />
      <line x1="94" y1="62" x2="180" y2="62" stroke="#EA580C" stroke-width="1.2" />
      <!-- Form AOC-4 / MGT-7 Lines -->
      <rect x="40" y="90" width="470" height="130" rx="3" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <line x1="40" y1="124" x2="510" y2="124" stroke="#CBD5E1" stroke-width="1" />
      <line x1="180" y1="90" x2="180" y2="220" stroke="#E2E8F0" stroke-width="1" />
      <line x1="340" y1="90" x2="340" y2="220" stroke="#E2E8F0" stroke-width="1" />
      <line x1="56" y1="150" x2="160" y2="150" stroke="#94A3B8" stroke-width="1.5" />
      <line x1="196" y1="150" x2="320" y2="150" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="356" y1="150" x2="490" y2="150" stroke="#1A2B6B" stroke-width="1.5" />
      <line x1="56" y1="180" x2="150" y2="180" stroke="#94A3B8" stroke-width="1.5" />
      <line x1="196" y1="180" x2="300" y2="180" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="356" y1="180" x2="480" y2="180" stroke="#1A2B6B" stroke-width="1.5" />
      <!-- Statutory ROC Seal -->
      <circle cx="450" cy="270" r="28" fill="none" stroke="#1A2B6B" stroke-width="1.5" stroke-dasharray="4 2" />
      <circle cx="450" cy="270" r="20" fill="none" stroke="#EA580C" stroke-width="1.2" />
      <path d="M 444,270 L 449,275 L 458,265" fill="none" stroke="#1A2B6B" stroke-width="2" stroke-linecap="round" />
    </g>

    <!-- Topic Visual 2: Bound Corporate Registry Folder Dossier -->
    <g transform="translate(670, 540)">
      <rect x="0" y="0" width="180" height="260" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <rect x="0" y="0" width="16" height="260" rx="2" fill="#1A2B6B" />
      <path d="M 140,0 L 170,0 L 170,30 L 140,0 Z" fill="#EA580C" fill-opacity="0.85" />
      <line x1="36" y1="50" x2="140" y2="50" stroke="#1A2B6B" stroke-width="2" />
      <line x1="36" y1="70" x2="110" y2="70" stroke="#94A3B8" stroke-width="1.2" />
      <line x1="36" y1="100" x2="150" y2="100" stroke="#E2E8F0" stroke-width="1" />
      <line x1="36" y1="120" x2="140" y2="120" stroke="#E2E8F0" stroke-width="1" />
      <line x1="36" y1="140" x2="130" y2="140" stroke="#E2E8F0" stroke-width="1" />
    </g>

    <!-- Topic Visual 3: Corporate Headquarters Facade in Line-Art -->
    <g transform="translate(1440, 440)">
      <rect x="0" y="0" width="260" height="220" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <g transform="translate(60, 40)">
        <polygon points="70,0 140,0 140,140 0,140 0,40 70,40" fill="none" stroke="#1A2B6B" stroke-width="2" />
        <line x1="20" y1="60" x2="50" y2="60" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="20" y1="80" x2="50" y2="80" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="20" y1="100" x2="50" y2="100" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="90" y1="20" x2="120" y2="20" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="90" y1="40" x2="120" y2="40" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="90" y1="60" x2="120" y2="60" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="90" y1="80" x2="120" y2="80" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="90" y1="100" x2="120" y2="100" stroke="#CBD5E1" stroke-width="1.5" />
        <line x1="0" y1="140" x2="140" y2="140" stroke="#EA580C" stroke-width="2.5" />
      </g>
    </g>

    <!-- Topic Visual 4: Annual Compliance Timeline Nodes -->
    <g transform="translate(1440, 710)">
      <rect x="0" y="0" width="260" height="100" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="30" y1="50" x2="230" y2="50" stroke="#CBD5E1" stroke-width="2" />
      <circle cx="50" cy="50" r="9" fill="#FFFFFF" stroke="#1A2B6B" stroke-width="2" />
      <circle cx="130" cy="50" r="9" fill="#1A2B6B" />
      <circle cx="210" cy="50" r="9" fill="#FFFFFF" stroke="#EA580C" stroke-width="2" />
    </g>

    <!-- Topic Visual 5: Connected Verification Seal Node -->
    <g transform="translate(710, 440)">
      <circle cx="24" cy="24" r="24" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.5" />
      <path d="M 18,24 L 23,29 L 32,19" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" />
      <line x1="48" y1="24" x2="150" y2="40" stroke="#EA580C" stroke-width="1" stroke-dasharray="3 3" />
    </g>
  </g>`;
    } else if (visual.topicType === 'company_registration') {
      focalVisualElement = `
  <g id="editorial-focal-visual">
    <!-- Topic Visual 1: Certificate of Incorporation (SPICe+ / MCA) -->
    <g transform="translate(860, 470) rotate(-1)">
      <rect x="0" y="0" width="560" height="350" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <rect x="14" y="14" width="532" height="322" rx="3" fill="none" stroke="#F1F5F9" stroke-width="1" />
      <circle cx="280" cy="52" r="16" fill="none" stroke="#1A2B6B" stroke-width="1.5" />
      <circle cx="280" cy="52" r="11" fill="none" stroke="#EA580C" stroke-width="1" />
      <line x1="180" y1="84" x2="380" y2="84" stroke="#1A2B6B" stroke-width="2.5" />
      <line x1="220" y1="98" x2="340" y2="98" stroke="#EA580C" stroke-width="1.2" />
      <!-- Corporate Identity Number (CIN) highlight bar -->
      <rect x="60" y="124" width="440" height="32" rx="3" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
      <line x1="80" y1="140" x2="280" y2="140" stroke="#1A2B6B" stroke-width="1.8" />
      <rect x="380" y="132" width="100" height="16" rx="8" fill="#10B981" fill-opacity="0.12" stroke="#10B981" stroke-width="1" />
      <!-- Legal Text Lines -->
      <line x1="60" y1="180" x2="500" y2="180" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="60" y1="202" x2="460" y2="202" stroke="#E2E8F0" stroke-width="1" />
      <line x1="60" y1="224" x2="420" y2="224" stroke="#E2E8F0" stroke-width="1" />
      <!-- Embossed Incorporation Seal -->
      <g transform="translate(420, 246)">
        <circle cx="34" cy="34" r="34" fill="none" stroke="#EA580C" stroke-width="1.6" stroke-dasharray="4 2" />
        <circle cx="34" cy="34" r="26" fill="none" stroke="#1A2B6B" stroke-width="1.2" />
        <path d="M 28,34 L 33,39 L 42,29" fill="none" stroke="#1A2B6B" stroke-width="2" stroke-linecap="round" />
      </g>
    </g>

    <!-- Topic Visual 2: Modern Corporate Enterprise Building Silhouette -->
    <g transform="translate(680, 520)">
      <rect x="0" y="0" width="170" height="280" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <polygon points="20,50 85,15 150,50 150,260 20,260" fill="none" stroke="#1A2B6B" stroke-width="2" />
      <line x1="40" y1="80" x2="130" y2="80" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="40" y1="110" x2="130" y2="110" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="40" y1="140" x2="130" y2="140" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="40" y1="170" x2="130" y2="170" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="40" y1="200" x2="130" y2="200" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="20" y1="260" x2="150" y2="260" stroke="#EA580C" stroke-width="3" />
    </g>

    <!-- Topic Visual 3: Company Registry Dossier Folder with MoA Tab -->
    <g transform="translate(1440, 440)">
      <rect x="0" y="0" width="260" height="200" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <rect x="0" y="0" width="14" height="200" rx="2" fill="#1A2B6B" />
      <rect x="180" y="0" width="50" height="22" rx="3" fill="#EA580C" />
      <line x1="36" y1="50" x2="180" y2="50" stroke="#1A2B6B" stroke-width="2" />
      <line x1="36" y1="74" x2="220" y2="74" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="36" y1="98" x2="190" y2="98" stroke="#E2E8F0" stroke-width="1" />
      <line x1="36" y1="122" x2="170" y2="122" stroke="#E2E8F0" stroke-width="1" />
    </g>

    <!-- Topic Visual 4: Corporate Formation Milestone Roadmap -->
    <g transform="translate(1440, 680)">
      <rect x="0" y="0" width="260" height="130" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="30" y1="65" x2="230" y2="65" stroke="#CBD5E1" stroke-width="2" />
      <circle cx="45" cy="65" r="10" fill="#1A2B6B" />
      <circle cx="130" cy="65" r="10" fill="#EA580C" />
      <circle cx="215" cy="65" r="10" fill="#FFFFFF" stroke="#1A2B6B" stroke-width="2" />
    </g>

    <!-- Topic Visual 5: Connected Incorporation Seal Node -->
    <g transform="translate(720, 440)">
      <circle cx="24" cy="24" r="24" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.5" />
      <path d="M 18,24 L 23,29 L 32,19" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" />
      <line x1="48" y1="24" x2="140" y2="35" stroke="#EA580C" stroke-width="1" stroke-dasharray="3 3" />
    </g>
  </g>`;
    } else {
      // Default: Licensing, Direct Tax (ITR), and Corporate Governance
      focalVisualElement = `
  <g id="editorial-focal-visual">
    <!-- Topic Visual 1: Formal Corporate Legal & Regulatory Agreement Document -->
    <g transform="translate(860, 470) rotate(-1)">
      <rect x="0" y="0" width="560" height="350" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <rect x="14" y="14" width="532" height="322" rx="3" fill="none" stroke="#F1F5F9" stroke-width="1" />
      <line x1="50" y1="52" x2="260" y2="52" stroke="#1A2B6B" stroke-width="2.5" />
      <line x1="50" y1="70" x2="160" y2="70" stroke="#EA580C" stroke-width="1.2" />
      <!-- Structured Paragraph Lines -->
      <line x1="50" y1="110" x2="510" y2="110" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="50" y1="132" x2="480" y2="132" stroke="#E2E8F0" stroke-width="1" />
      <line x1="50" y1="154" x2="450" y2="154" stroke="#E2E8F0" stroke-width="1" />
      <line x1="50" y1="184" x2="510" y2="184" stroke="#CBD5E1" stroke-width="1.2" />
      <line x1="50" y1="206" x2="470" y2="206" stroke="#E2E8F0" stroke-width="1" />
      <line x1="50" y1="228" x2="430" y2="228" stroke="#E2E8F0" stroke-width="1" />
      <!-- Execution Seal Block -->
      <g transform="translate(420, 245)">
        <circle cx="34" cy="34" r="34" fill="none" stroke="#EA580C" stroke-width="1.5" stroke-dasharray="4 2" />
        <circle cx="34" cy="34" r="26" fill="none" stroke="#1A2B6B" stroke-width="1.2" />
        <path d="M 28,34 L 33,39 L 42,29" fill="none" stroke="#1A2B6B" stroke-width="2" stroke-linecap="round" />
      </g>
    </g>

    <!-- Topic Visual 2: Corporate Headquarters Facade -->
    <g transform="translate(680, 520)">
      <rect x="0" y="0" width="170" height="270" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <polygon points="20,40 85,15 150,40 150,250 20,250" fill="none" stroke="#1A2B6B" stroke-width="2" />
      <line x1="40" y1="70" x2="130" y2="70" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="40" y1="100" x2="130" y2="100" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="40" y1="130" x2="130" y2="130" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="40" y1="160" x2="130" y2="160" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="40" y1="190" x2="130" y2="190" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="20" y1="250" x2="150" y2="250" stroke="#EA580C" stroke-width="3" />
    </g>

    <!-- Topic Visual 3: Regulatory Compliance Shield Node -->
    <g transform="translate(1440, 440)">
      <rect x="0" y="0" width="260" height="200" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <g transform="translate(130, 80)">
        <path d="M 0,-40 L 40,-20 C 40,24 0,48 0,48 C 0,48 -40,24 -40,-20 Z" fill="none" stroke="#1A2B6B" stroke-width="2.5" stroke-linejoin="round" />
        <path d="M -12,-2 L -4,6 L 14,-10" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <line x1="40" y1="150" x2="220" y2="150" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="60" y1="168" x2="200" y2="168" stroke="#E2E8F0" stroke-width="1" />
    </g>

    <!-- Topic Visual 4: Governance Structure Network Node -->
    <g transform="translate(1440, 680)">
      <rect x="0" y="0" width="260" height="130" rx="6" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" />
      <circle cx="130" cy="40" r="12" fill="#1A2B6B" />
      <circle cx="70" cy="95" r="10" fill="#FFFFFF" stroke="#EA580C" stroke-width="2" />
      <circle cx="190" cy="95" r="10" fill="#FFFFFF" stroke="#1A2B6B" stroke-width="2" />
      <line x1="130" y1="52" x2="78" y2="88" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="130" y1="52" x2="182" y2="88" stroke="#CBD5E1" stroke-width="1.5" />
    </g>

    <!-- Topic Visual 5: Connected Advisory Node -->
    <g transform="translate(710, 440)">
      <circle cx="24" cy="24" r="24" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.5" />
      <path d="M 18,24 L 23,29 L 32,19" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" />
      <line x1="48" y1="24" x2="150" y2="35" stroke="#EA580C" stroke-width="1" stroke-dasharray="3 3" />
    </g>
  </g>`;
    }

    return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Background: Clean White to Very Light Grey Editorial Canvas -->
    <linearGradient id="editorialCanvasBg" x1="0" y1="0" x2="1920" y2="1080" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#F1F5F9" />
    </linearGradient>
  </defs>

  <!-- 1. Full-Bleed 16:9 Canvas (Clean White / Very Light Grey) -->
  <rect x="0" y="0" width="1920" height="1080" fill="url(#editorialCanvasBg)" />

  <!-- 2. Refined Editorial Geometric Grid & Accent Lines (No Desk, No Table Surface) -->
  <g opacity="0.35">
    <line x1="680" y1="0" x2="680" y2="1080" stroke="#E2E8F0" stroke-width="1" />
    <line x1="1400" y1="0" x2="1400" y2="1080" stroke="#E2E8F0" stroke-width="1" />
    <line x1="0" y1="360" x2="1920" y2="360" stroke="#E2E8F0" stroke-width="1" />
    <line x1="0" y1="720" x2="1920" y2="720" stroke="#E2E8F0" stroke-width="1" />
  </g>

  <!-- Subtle Navy Hairline Dynamic Curve Accent -->
  <path d="M 640,0 C 960,180 1280,360 1920,440" fill="none" stroke="#1A2B6B" stroke-width="1" stroke-opacity="0.09" />
  <path d="M 720,1080 C 1040,900 1360,720 1920,640" fill="none" stroke="#1A2B6B" stroke-width="1" stroke-opacity="0.06" />

  <!-- Subtle Orange Accent Bar -->
  <line x1="80" y1="210" x2="160" y2="210" stroke="#EA580C" stroke-width="3" stroke-linecap="round" />

  <!-- Subtle Minimal Geometric Micro-Dot Matrix -->
  <g opacity="0.35">
    <circle cx="160" cy="880" r="2" fill="#94A3B8" />
    <circle cx="190" cy="880" r="2" fill="#94A3B8" />
    <circle cx="220" cy="880" r="2" fill="#94A3B8" />
    <circle cx="160" cy="910" r="2" fill="#94A3B8" />
    <circle cx="190" cy="910" r="2" fill="#94A3B8" />
    <circle cx="220" cy="910" r="2" fill="#94A3B8" />
  </g>

  <!-- 3. Designed Editorial Topic-Specific Elements (Right & Center, Left Side Clean) -->
  ${focalVisualElement}

  <!-- 4. Clearly Readable Official Website URL (Programmatically Rendered) -->
  <text x="80" y="1020" fill="#1A2B6B" fill-opacity="0.85" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" letter-spacing="1.5">www.legomarkindia.com</text>
  <text x="1840" y="1020" text-anchor="end" fill="#64748B" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" letter-spacing="1">www.legomarkindia.com</text>

  <!-- 5. Prominent & Elegant Authentic LEGOMARK INDIA Logo Overlay (Upper-Left, No Card/Badge) -->
  ${logoOverlaySvg}
</svg>`;
  }

  /**
   * Generates ONE featured image for the blog and saves it into the existing Media storage system.
   * Focuses on a designed editorial graphic style (clean white canvas, topic-specific visual elements,
   * no generic desk props), overlays the authentic LEGOMARK logo programmatically in the upper-left,
   * renders www.legomarkindia.com programmatically, and guarantees a 16:9 full-width banner.
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
    // Designed editorial graphic illustration style (clean white canvas, 3-5 topic-specific elements, no desk still life)
    try {
      const visual = getMainVisualConcept(draft.category, draft.title, draft.focusKeyword);
      const ai = this.getClient();
      const imagePrompt = `Designed editorial graphic illustration for a high-end corporate and legal advisory publication (Harvard Business Review, Financial Times, Bloomberg Law).
Topic: ${visual.concept} - ${draft.title} (${draft.category}).

STRICT ART DIRECTION & MEDIUM:
- Medium: Designed 2D editorial graphic illustration with refined minimal line-art and clean corporate illustration elements on a flat digital canvas.
- DO NOT generate a photograph. DO NOT generate an office desk, wooden table, or still life.
- ABSOLUTELY DO NOT generate generic desk objects: NO coffee cups, NO pens, NO notebooks, NO plants, NO glass cubes, NO keyboards, NO random office props.
- Canvas & Background: Clean white to very light-grey background (#FFFFFF to #F8FAFC) across the entire canvas.
- Color Palette: Restricted to soft navy (#1A2B6B), clean neutral greys (#E2E8F0, #64748B), and subtle orange (#EA580C) accents only. No vibrant or bright colors. No dark backgrounds. No gold or neon glowing effects. No heavy gradients.

TOPIC-SPECIFIC VISUAL ELEMENTS (Right & Centre Composition):
- Feature exactly 3 to 5 meaningful visual elements specifically related to ${visual.concept}:
${visual.aiPromptElements}
- Arrange these topic-related elements primarily across the right and center of the 16:9 canvas.
- Interconnect the elements with delicate, thin navy and orange geometric lines, subtle curves, circles, grids, or small dots.
- The composition must feel balanced, modern, and intentionally designed across the 16:9 canvas, with NO large blank/unused areas and NO white side gaps.
- Keep the upper-left and left area clean, spacious, and open to allow for programmatic brand logo placement.

STRICT NEGATIVE CONSTRAINTS:
- ABSOLUTELY NO large headline text, titles, words, letters, numbers, or labels inside the image.
- ABSOLUTELY NO bullet points, infographic panels, comparison tables, or CTA banners.
- ABSOLUTELY NO generic desk props (NO coffee cups, NO pens, NO notebooks, NO plants, NO glass cubes, NO tabletop photos).
- ABSOLUTELY NO AI-generated logos (the official LEGOMARK logo is overlaid programmatically).
- ABSOLUTELY NO dark navy, black, or vibrant glowing backgrounds.`;

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

          // Composite the full-bleed 16:9 AI editorial graphic with discrete official website URL and prominent logo overlay
          const compositeSvg = `<svg width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- Full 16:9 Bleed Generated Editorial Graphic -->
  <image href="data:${mimeType};base64,${part.inlineData.data}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />

  <!-- Clearly Readable Official Website URL (Programmatically Rendered) -->
  <text x="80" y="1020" fill="#1A2B6B" fill-opacity="0.85" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" letter-spacing="1.5">www.legomarkindia.com</text>
  <text x="1840" y="1020" text-anchor="end" fill="#64748B" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" letter-spacing="1">www.legomarkindia.com</text>

  <!-- Programmatic Authentic LEGOMARK INDIA Logo Overlay (Prominent & Elegant, Upper-Left, No Card/Badge) -->
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

