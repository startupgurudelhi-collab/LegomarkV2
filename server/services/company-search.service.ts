import {
  EntityType,
  RuleCheckResult,
  SimilarNameResult,
  NameSearchResponse,
  OnlineBrandPresenceResult,
  BrandPresenceSource,
  BrandEntityFound,
  TrademarkRecord,
  TrademarkSearchResult,
  CombinedAssessment,
} from '../../src/types/company-search';
import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger';
import { config, getRuntimeEnv } from '../config/env';

export interface McaRecordItem {
  name: string;
  cin?: string;
  status?: string;
  roc?: string;
  entityType?: string;
}

/**
 * Extracts and maps company fields from Falcon eBiz Company Search API response.
 * Maps Falcon response:
 *   value -> CIN/LLPIN
 *   label -> registered company/LLP name
 */
function extractFalconRecords(responseData: any): { records: McaRecordItem[]; isError: boolean; errorMsg?: string } {
  if (!responseData) return { records: [], isError: false };

  let parsed = responseData;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return { records: [], isError: true, errorMsg: 'Malformed response body' };
    }
  }

  // Check for Falcon error responses (e.g. [{"error_code":"205","error_msg":"Access Denied - Invalid API"}])
  if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.error_code) {
    return { records: [], isError: true, errorMsg: parsed[0].error_msg || `Falcon Error ${parsed[0].error_code}` };
  }
  if (typeof parsed === 'object' && parsed !== null && parsed.error_code) {
    return { records: [], isError: true, errorMsg: parsed.error_msg || `Falcon Error ${parsed.error_code}` };
  }
  if (typeof parsed === 'object' && parsed !== null && (parsed.error || parsed.message === 'Access Denied')) {
    return { records: [], isError: true, errorMsg: parsed.error || parsed.message };
  }

  let candidates: any[] = [];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (Array.isArray(parsed.data)) {
    candidates = parsed.data;
  } else if (Array.isArray(parsed.results)) {
    candidates = parsed.results;
  } else if (Array.isArray(parsed.companies)) {
    candidates = parsed.companies;
  } else if (Array.isArray(parsed.records)) {
    candidates = parsed.records;
  } else if (typeof parsed.data === 'object' && parsed.data !== null) {
    candidates = [parsed.data];
  } else if (typeof parsed === 'object' && parsed !== null) {
    if (parsed.value || parsed.label || parsed.company_name || parsed.cin) {
      candidates = [parsed];
    }
  }

  const results: McaRecordItem[] = [];

  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;

    // Falcon eBiz mapping:
    // label -> registered company/LLP name
    // value -> CIN/LLPIN
    const name = (
      item.label ||
      item.company_name ||
      item.companyName ||
      item.name ||
      item.title
    )?.toString().trim();

    if (!name) continue;

    const cin = (
      item.value ||
      item.cin ||
      item.CIN ||
      item.cin_number ||
      item.corporate_id
    )?.toString().trim();

    const status = (
      item.status ||
      item.company_status ||
      item.companyStatus
    )?.toString().trim() || 'Registered / Active';

    const roc = (
      item.roc ||
      item.roc_code ||
      item.registrar
    )?.toString().trim();

    const upperName = name.toUpperCase();
    const upperCin = cin?.toUpperCase() || '';
    const entityType = (
      item.company_class ||
      item.class ||
      item.category
    )?.toString().trim() || (upperCin.includes('LLP') || upperCin.startsWith('AAA') || upperName.includes('LLP') ? 'LLP' : 'Registered Entity');

    results.push({ name, cin, status, roc, entityType });
  }

  return { records: results, isError: false };
}

/**
 * Extracts and maps company fields from legacy/fallback MCA Company Master responses.
 */
function extractMcaRecords(responseData: any): McaRecordItem[] {
  return extractFalconRecords(responseData).records;
}

// Prohibited terms under Emblems and Names Act, 1950 & MCA Rule 8
const PROHIBITED_WORDS = [
  'national',
  'imperial',
  'central',
  'federal',
  'republic',
  'president',
  'presidential',
  'rashtrapati',
  'governor',
  'raj bhavan',
  'prime minister',
  'chief minister',
  'ministry',
  'court',
  'judiciary',
  'parliament',
  'legislature',
  'government',
  'state',
  'union',
  'bureau',
  'commission',
  'police',
  'statutory',
  'ashoka',
  'bharat ratna',
  'padma shri',
  'padma bhushan',
  'padma vibhushan',
];

// Terms requiring specific regulatory pre-approvals (RBI, SEBI, IRDAI)
const REGULATORY_APPROVAL_WORDS = [
  'bank',
  'banking',
  'venture capital',
  'insurance',
  'stock exchange',
  'mutual fund',
  'asset management',
  'micro finance',
  'nbfc',
  'chit fund',
];

// Generic activity words that cannot stand alone as a company name
const GENERIC_INDUSTRY_WORDS = new Set([
  'software',
  'technology',
  'technologies',
  'solutions',
  'services',
  'consulting',
  'consultancy',
  'enterprises',
  'industries',
  'holdings',
  'ventures',
  'trading',
  'logistics',
  'retail',
  'finance',
  'marketing',
  'media',
  'exports',
  'imports',
  'international',
  'global',
  'infra',
  'infrastructure',
  'construction',
  'realty',
  'pharma',
  'healthcare',
]);

// Representative sample of active Indian corporate names for preliminary phonetic / trademark similarity
const SAMPLE_REGISTRY_NAMES = [
  'TATA CONSULTANCY SERVICES',
  'INFOSYS TECHNOLOGIES',
  'WIPRO ENTERPRISES',
  'RELIANCE INDUSTRIES',
  'HCL TECHNOLOGIES',
  'MAHINDRA & MAHINDRA',
  'BHARTI AIRTEL',
  'LARSEN & TOUBRO',
  'ADANI ENTERPRISES',
  'LEGOMARK INDIA CORPORATE SOLUTIONS',
  'ZYDUS HEALTHCARE',
  'PAYTM FINANCIAL SERVICES',
  'FLIPKART INTERNET',
  'ZOMATO LIMITED',
  'SWIGGY BUNDL TECHNOLOGIES',
  'NYKAA E-RETAIL',
  'OLA ELECTRIC MOBILITY',
  'RAZORPAY SOFTWARE',
  'ZERODHA BROKING',
  'POLICYBAZAAR INSURANCE BROKERS',
];

function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLength);
}

/**
 * Calculates corporate name similarity accounting for MCA Rule 8:
 * - Direct Levenshtein distance on full normalized strings
 * - Exact or high-proximity match on primary coined prefix (first distinctive word)
 * - Prefix containment and token overlap
 */
function calculateCorporateSimilarity(proposedName: string, registeredName: string): number {
  const pNorm = proposedName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const rClean = registeredName
    .replace(/\s+(pvt\.?\s*ltd\.?|private\s+limited|llp|limited\s+liability\s+partnership|\(opc\)\s*private\s+limited|ltd\.?|limited|foundation)$/i, '')
    .trim();
  const rNorm = rClean.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  if (!pNorm || !rNorm) return 0.0;
  if (pNorm === rNorm) return 1.0;

  const fullLev = calculateLevenshteinSimilarity(pNorm, rNorm);
  const pWords = pNorm.split(/\s+/).filter(Boolean);
  const rWords = rNorm.split(/\s+/).filter(Boolean);

  if (pWords.length === 0 || rWords.length === 0) return fullLev;

  const pFirst = pWords[0];
  const rFirst = rWords[0];

  // Exact primary coined prefix match (e.g., "legomark" vs "legomark india corporate solutions")
  if (pFirst === rFirst && pFirst.length >= 3) {
    return Math.max(fullLev, 0.95);
  }

  // Phonetic/Levenshtein proximity of primary coined word
  const firstWordLev = calculateLevenshteinSimilarity(pFirst, rFirst);
  if (firstWordLev >= 0.85 && pFirst.length >= 4) {
    return Math.max(fullLev, firstWordLev * 0.92);
  }

  // Substring or prefix containment
  if (rNorm.startsWith(pNorm) || pNorm.startsWith(rNorm)) {
    return Math.max(fullLev, 0.92);
  }
  if (rNorm.includes(pNorm) && pNorm.length >= 4) {
    return Math.max(fullLev, 0.88);
  }

  // Significant word overlap
  const commonWords = pWords.filter((w) => rWords.includes(w) && !GENERIC_INDUSTRY_WORDS.has(w));
  if (commonWords.length > 0) {
    const overlapRatio = (2 * commonWords.length) / (pWords.length + rWords.length);
    if (overlapRatio >= 0.5) {
      return Math.max(fullLev, 0.82);
    }
  }

  return fullLev;
}

/**
 * Extracts an explicit Nice class number (1-45) from user input if present.
 * If the input is descriptive text (e.g. "Software", "Shipping"), returns undefined so
 * we do not force an invalid or invented class parameter to TradeMarx.
 */
function extractExplicitNiceClass(input?: string): number | undefined {
  if (!input || typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  const match = trimmed.match(/^(?:class\s*[:#-]?\s*)?(\d{1,2})$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 45) {
      return num;
    }
  }
  return undefined;
}

export class CompanySearchService {
  /**
   * Layer 3: Trademark Conflict Analysis via TradeMarx API
   * Queries the official Trade Marks Registry database for registered, pending, and contested marks.
   */
  async fetchTrademarkSearch(
    proposedName: string,
    rawClassOrCategory?: string
  ): Promise<TrademarkSearchResult> {
    const apiKey =
      config.trademark.key ||
      getRuntimeEnv('TRADEMARK_API_KEY', 'TRADEMARX_API_KEY', 'VITE_TRADEMARK_API_KEY');

    if (!apiKey) {
      logger.info('TRADEMARK_API_KEY not configured. Trademark Conflict Analysis in standby.', 'CompanySearchService');
      return {
        status: 'unconfigured',
        records: [],
        riskLevel: 'low',
        findingSummary: 'TradeMarx API key is not configured on the server. Trademark search layer is in standby.',
      };
    }

    const explicitClass = extractExplicitNiceClass(rawClassOrCategory);
    const searchUrl = new URL('https://admin.trademarx.in/api/public/v1/trademarks/search');
    searchUrl.searchParams.set('name', proposedName);
    if (explicitClass !== undefined) {
      searchUrl.searchParams.set('class', String(explicitClass));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        logger.warn(
          `TradeMarx API returned HTTP status ${res.status} for "${proposedName}"`,
          'CompanySearchService'
        );
        return {
          status: 'error',
          records: [],
          riskLevel: 'low',
          findingSummary: `Trademark search service returned HTTP status ${res.status}. Non-blocking fallback applied.`,
        };
      }

      const raw = await res.json();
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
        list = raw.data;
      } else if (raw && typeof raw === 'object' && Array.isArray(raw.results)) {
        list = raw.results;
      }

      const records: TrademarkRecord[] = list
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const markName = item.name != null ? String(item.name).trim() : null;
          const similarity = markName
            ? Math.round(calculateCorporateSimilarity(proposedName, markName) * 100)
            : 0;
          return {
            name: markName,
            applicationNo: String(item.applicationNo || item.application_no || item.id || '').trim(),
            tmClass: String(item.tmClass || item.class || item.tm_class || '').trim(),
            details: item.details != null ? String(item.details).trim() : null,
            trademarkStatus: item.trademarkStatus != null ? String(item.trademarkStatus).trim() : null,
            proprietorName: item.proprietorName != null ? String(item.proprietorName).trim() : null,
            applicationDate: item.applicationDate != null ? String(item.applicationDate).trim() : null,
            imgUrl: item.imgUrl != null ? String(item.imgUrl).trim() : null,
            type: item.type != null ? String(item.type).trim() : null,
            url: item.url != null ? String(item.url).trim() : null,
            similarity,
          };
        });

      // Sort by similarity descending
      records.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      if (records.length === 0) {
        return {
          status: 'no_records',
          records: [],
          riskLevel: 'low',
          searchedClass: explicitClass,
          totalHits: 0,
          findingSummary: 'No matching or conflicting trademark records found on the Trade Marks Registry.',
        };
      }

      // Calculate Trademark Risk: LOW / MEDIUM / HIGH
      const topMatch = records[0];
      const topSim = topMatch.similarity || 0;
      const statusLower = (topMatch.trademarkStatus || '').toLowerCase();
      const isDeadStatus = /abandoned|withdrawn|refused|cancelled|removed|invalidated/.test(statusLower);

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      let findingSummary = '';

      if (topSim >= 80 && !isDeadStatus) {
        riskLevel = 'high';
        findingSummary = `High Trademark Risk: Conflicting registered/pending mark "${topMatch.name || topMatch.applicationNo}" (Class ${topMatch.tmClass || 'N/A'}, Status: ${topMatch.trademarkStatus || 'Active'}) identified with ${topSim}% proximity. Potential statutory objection under Section 11 of the Trade Marks Act, 1999.`;
      } else if (topSim >= 60 && !isDeadStatus) {
        riskLevel = 'medium';
        findingSummary = `Moderate Trademark Risk: Closely resembling trademark "${topMatch.name || topMatch.applicationNo}" (Class ${topMatch.tmClass || 'N/A'}) found on record. Prior rights clearance and Nice class review recommended.`;
      } else if (topSim >= 80 && isDeadStatus) {
        riskLevel = 'medium';
        findingSummary = `Historical trademark conflict record found with ${topSim}% similarity, currently marked as "${topMatch.trademarkStatus}". Low risk of active assertion, but prior rights verification is recommended.`;
      } else {
        riskLevel = 'low';
        findingSummary = `Low trademark conflict footprint. ${records.length} trademark record(s) returned, but none exceed close phonetic or identity thresholds.`;
      }

      return {
        status: 'connected',
        records: records.slice(0, 10),
        riskLevel,
        searchedClass: explicitClass,
        totalHits: records.length,
        findingSummary,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      logger.warn(
        `TradeMarx API call failed or timed out: ${err?.message || err}`,
        'CompanySearchService'
      );
      return {
        status: 'error',
        records: [],
        riskLevel: 'low',
        findingSummary: 'Trademark search service temporarily unavailable or timed out. Non-blocking fallback applied.',
      };
    }
  }
  /**
   * Suffix string builder according to MCA entity type
   */
  getEntitySuffix(entityType: EntityType): string {
    switch (entityType) {
      case 'private_limited':
        return 'Private Limited';
      case 'llp':
        return 'LLP';
      case 'opc':
        return '(OPC) Private Limited';
      case 'public_limited':
        return 'Limited';
      case 'section_8':
        return 'Foundation';
      default:
        return 'Private Limited';
    }
  }

  /**
   * Normalizes raw name input: strips existing suffixes and punctuation
   */
  normalizeName(rawName: string): { normalized: string; strippedSuffix: string | null } {
    let clean = rawName
      .trim()
      .replace(/\s+/g, ' ');

    // Patterns for suffixes
    const suffixRegexes = [
      { regex: /\s+(pvt\.?\s*ltd\.?|private\s+limited)$/i, suffix: 'Private Limited' },
      { regex: /\s+(llp|limited\s+liability\s+partnership)$/i, suffix: 'LLP' },
      { regex: /\s+(\(opc\)\s*pvt\.?\s*ltd\.?|\(opc\)\s*private\s+limited|one\s+person\s+company)$/i, suffix: '(OPC) Private Limited' },
      { regex: /\s+(ltd\.?|limited)$/i, suffix: 'Limited' },
      { regex: /\s+(foundation|association|council)$/i, suffix: 'Foundation' },
    ];

    let detectedSuffix: string | null = null;
    for (const item of suffixRegexes) {
      if (item.regex.test(clean)) {
        clean = clean.replace(item.regex, '').trim();
        detectedSuffix = item.suffix;
        break;
      }
    }

    return {
      normalized: clean,
      strippedSuffix: detectedSuffix,
    };
  }

  /**
   * Queries Falcon eBiz Company Search API for official MCA registered company/LLP records.
   * GET https://www.falconebiz.com/api/search_company
   * Headers:
   *   Authorization: <FALCON_API_KEY>
   *   Company: <searched company name>
   *   Domain: legomarkindia.com
   *   Content-Type: application/json
   */
  async fetchMcaCompanyMaster(queryName: string): Promise<{
    records: McaRecordItem[];
    status: 'connected' | 'no_records' | 'error' | 'unconfigured';
  }> {
    const falconKey =
      config.falcon.key ||
      getRuntimeEnv('FALCON_API_KEY', 'FALCON_KEY', 'VITE_FALCON_API_KEY');

    // Safe server-side diagnostic check (never logs the secret API key value)
    logger.info(
      `Falcon eBiz MCA API Runtime Check -> Key configured: ${Boolean(falconKey)} (length: ${falconKey?.length || 0})`,
      'CompanySearchService'
    );

    if (!falconKey) {
      logger.warn(
        'Falcon eBiz FALCON_API_KEY credentials not configured in environment.',
        'CompanySearchService'
      );
      return { records: [], status: 'unconfigured' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      logger.info(`Querying Falcon eBiz Company Search API for "${queryName}"`, 'CompanySearchService');
      const response = await fetch('https://www.falconebiz.com/api/search_company', {
        method: 'GET',
        headers: {
          'Authorization': falconKey,
          'Company': queryName,
          'Domain': 'legomarkindia.com',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn(
          `Falcon eBiz Company Search returned HTTP ${response.status}: ${response.statusText}`,
          'CompanySearchService'
        );
        return { records: [], status: 'error' };
      }

      const text = await response.text();
      let rawData: any;
      try {
        rawData = JSON.parse(text);
      } catch (parseErr) {
        logger.warn(`Failed to parse Falcon eBiz JSON response: ${text.slice(0, 100)}`, 'CompanySearchService');
        return { records: [], status: 'error' };
      }

      const { records, isError, errorMsg } = extractFalconRecords(rawData);

      if (isError) {
        logger.warn(`Falcon eBiz returned upstream error: ${errorMsg}`, 'CompanySearchService');
        return { records: [], status: 'error' };
      }

      if (records.length === 0) {
        logger.info(`Falcon eBiz API returned 0 matching records for "${queryName}"`, 'CompanySearchService');
        return { records: [], status: 'no_records' };
      }

      logger.info(`Falcon eBiz API successfully retrieved ${records.length} records for "${queryName}"`, 'CompanySearchService');
      return { records, status: 'connected' };
    } catch (err: any) {
      clearTimeout(timeout);
      logger.warn(
        `Falcon eBiz API call failed or timed out: ${err?.message || err}`,
        'CompanySearchService'
      );
      return { records: [], status: 'error' };
    }
  }

  /**
   * Layer 2: Online Brand Presence Analysis using Gemini with Google Search Grounding.
   * Performs real-time web search for exact name, close variations, existing businesses/brands,
   * active websites/products, and public web references.
   *
   * STRICT RULES:
   * - NOT an official trademark search.
   * - Does NOT claim trademark registration status.
   * - Does NOT invent sources or search findings.
   * - If search returns no meaningful evidence, returns "No significant web presence found".
   */
  async analyzeOnlineBrandPresence(
    proposedName: string,
    activityCategory?: string
  ): Promise<OnlineBrandPresenceResult> {
    const geminiKey = process.env.GEMINI_API_KEY || getRuntimeEnv('GEMINI_API_KEY');
    if (!geminiKey) {
      logger.warn('GEMINI_API_KEY not configured for Online Brand Presence Analysis', 'CompanySearchService');
      return {
        riskLevel: 'low',
        findingSummary: 'No significant web presence found.',
        hasCommercialUsage: false,
        brandsFound: [],
        sources: [],
        status: 'unavailable',
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `Conduct a real-time public web brand presence search for the proposed company/brand name: "${proposedName}"${
        activityCategory ? ` in the industry/activity sector: "${activityCategory}"` : ''
      }.

Check real-time web results for:
1. Exact name matches on the public web.
2. Close name variations used as commercial brand identities or trade names.
3. Existing businesses, startups, products, domain websites, or commercial platforms using this name.
4. Meaningful public references vs weak or irrelevant mentions (e.g. dictionary definitions, random directory mentions).

CRITICAL RULES:
- This is NOT an official trademark search. Do NOT claim trademark registration or legal status.
- Do NOT invent or hallucinate URLs, companies, or sources. Only cite evidence found via Google Search.
- Distinguish strong commercial/brand usage (active company, operating commercial website, commercial product) from weak or incidental mentions.
- If no existing business, product, or commercial brand is found, state "No significant web presence found".

Output pure JSON matching this exact structure:
{
  "riskLevel": "low" | "medium" | "high",
  "findingSummary": "Concise 1-3 sentence summary of findings.",
  "hasCommercialUsage": boolean,
  "brandsFound": [
    {
      "name": "Brand or Business Name",
      "description": "Short description of the business/product and commercial scope",
      "url": "https://... (valid URL if available)",
      "usageStrength": "strong" | "moderate" | "weak"
    }
  ],
  "sources": [
    {
      "title": "Page Title or Domain",
      "url": "https://...",
      "snippet": "Brief context"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
        },
      });

      const text = response.text || '';
      const candidate = response.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
      const groundingSources: BrandPresenceSource[] = [];

      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || chunk.web.uri.replace(/^https?:\/\//, '').split('/')[0],
            url: chunk.web.uri,
          });
        }
      }

      let parsed: any = null;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        logger.warn('Could not parse JSON from Gemini brand presence response', 'CompanySearchService', parseErr);
      }

      if (!parsed) {
        const hasTextEvidence = text.length > 25 && !text.toLowerCase().includes('no significant web presence');
        return {
          riskLevel: hasTextEvidence ? 'medium' : 'low',
          findingSummary: text.slice(0, 280) || 'No significant web presence found.',
          hasCommercialUsage: hasTextEvidence,
          brandsFound: [],
          sources: groundingSources.slice(0, 5),
          status: groundingSources.length > 0 ? 'completed' : 'no_evidence',
        };
      }

      const sourcesMap = new Map<string, BrandPresenceSource>();
      if (Array.isArray(parsed.sources)) {
        for (const s of parsed.sources) {
          if (s?.url && typeof s.url === 'string') {
            sourcesMap.set(s.url, {
              title: s.title || s.url,
              url: s.url,
              snippet: s.snippet,
            });
          }
        }
      }
      for (const gs of groundingSources) {
        if (!sourcesMap.has(gs.url)) {
          sourcesMap.set(gs.url, gs);
        }
      }

      const brandsFound: BrandEntityFound[] = Array.isArray(parsed.brandsFound)
        ? parsed.brandsFound
            .filter((b: any) => b && typeof b === 'object' && b.name)
            .map((b: any) => ({
              name: String(b.name).trim(),
              description: String(b.description || '').trim(),
              url: b.url && typeof b.url === 'string' ? b.url.trim() : undefined,
              usageStrength: ['strong', 'moderate', 'weak'].includes(b.usageStrength)
                ? b.usageStrength
                : 'moderate',
            }))
        : [];

      const hasCommercialUsage = Boolean(
        parsed.hasCommercialUsage || brandsFound.some((b) => b.usageStrength === 'strong')
      );

      let riskLevel: 'low' | 'medium' | 'high' =
        ['low', 'medium', 'high'].includes(parsed.riskLevel)
          ? parsed.riskLevel
          : 'low';

      // Elevate risk if strong commercial brand entities were identified
      if (brandsFound.some((b) => b.usageStrength === 'strong')) {
        riskLevel = 'high';
      } else if (brandsFound.some((b) => b.usageStrength === 'moderate') && riskLevel === 'low') {
        riskLevel = 'medium';
      }

      const findingSummary = parsed.findingSummary
        ? String(parsed.findingSummary).trim()
        : hasCommercialUsage
        ? 'Public commercial brands or active websites were identified using this name.'
        : 'No significant web presence found.';

      return {
        riskLevel,
        findingSummary,
        hasCommercialUsage,
        brandsFound,
        sources: Array.from(sourcesMap.values()).slice(0, 6),
        status: brandsFound.length > 0 || sourcesMap.size > 0 ? 'completed' : 'no_evidence',
      };
    } catch (err: any) {
      logger.warn(
        `Gemini Google Search Grounding for Brand Presence fallback: ${err?.message || err}`,
        'CompanySearchService'
      );
      return {
        riskLevel: 'low',
        findingSummary: 'No significant web presence found.',
        hasCommercialUsage: false,
        brandsFound: [],
        sources: [],
        status: 'unavailable',
      };
    }
  }

  /**
   * Evaluates proposed name against MCA Rule 8 & Trademarks heuristics + RapidAPI MCA Master Data
   */
  async evaluateName(
    rawName: string,
    entityType: EntityType = 'private_limited',
    activityCategory?: string
  ): Promise<NameSearchResponse> {
    const timestamp = new Date().toISOString();
    const { normalized } = this.normalizeName(rawName);
    const suffix = this.getEntitySuffix(entityType);
    const fullProposedName = `${normalized} ${suffix}`;
    const words = normalized.split(/\s+/).filter(Boolean);
    const lowerName = normalized.toLowerCase();

    const checks: RuleCheckResult[] = [];
    const prohibitedFound: string[] = [];

    // 1. Length & Basic Format Check
    const minLengthValid = normalized.length >= 3;
    const hasSpecialChars = /[^a-zA-Z0-9\s&.-]/.test(normalized);

    checks.push({
      id: 'rule-format',
      title: 'Valid Alphanumeric Format',
      passed: minLengthValid && !hasSpecialChars,
      severity: minLengthValid && !hasSpecialChars ? 'success' : 'error',
      description: minLengthValid && !hasSpecialChars
        ? 'Name contains permissible characters (letters, numbers, spaces, and hyphens).'
        : 'Name must be at least 3 characters long and contain only letters, numbers, spaces, or hyphens.',
      mcaReference: 'Companies (Incorporation) Rules, 2014 - Rule 8(1)',
    });

    // 2. Prohibited Words under Emblems and Names Act
    for (const pWord of PROHIBITED_WORDS) {
      const regex = new RegExp(`\\b${pWord}\\b`, 'i');
      if (regex.test(lowerName)) {
        prohibitedFound.push(pWord);
      }
    }

    checks.push({
      id: 'rule-prohibited-words',
      title: 'Emblems & Prohibited Names Act',
      passed: prohibitedFound.length === 0,
      severity: prohibitedFound.length === 0 ? 'success' : 'error',
      description: prohibitedFound.length === 0
        ? 'No prohibited national or government emblem words detected.'
        : `Contains protected government or national term(s): "${prohibitedFound.join(', ')}", which cannot be reserved under Section 4(2).`,
      mcaReference: 'Emblems and Names (Prevention of Improper Use) Act, 1950',
    });

    // 3. Regulatory Pre-Approvals (RBI, SEBI, IRDAI)
    const regulatoryFound: string[] = [];
    for (const regWord of REGULATORY_APPROVAL_WORDS) {
      const regex = new RegExp(`\\b${regWord}\\b`, 'i');
      if (regex.test(lowerName)) {
        regulatoryFound.push(regWord);
      }
    }

    checks.push({
      id: 'rule-regulatory-approval',
      title: 'Financial & Sector Regulatory Scrutiny',
      passed: regulatoryFound.length === 0,
      severity: regulatoryFound.length === 0 ? 'success' : 'warning',
      description: regulatoryFound.length === 0
        ? 'No reserved financial terms requiring sectoral NOC (RBI/SEBI) detected.'
        : `Contains restricted term(s): "${regulatoryFound.join(', ')}". Reservation will require statutory regulatory approval from RBI/SEBI/IRDAI.`,
      mcaReference: 'MCA Rule 8(2)(b)(iv) - Sectoral Regulator NOC',
    });

    // 4. Distinctiveness vs. Generic Words
    const isSingleGenericWord =
      words.length === 1 && GENERIC_INDUSTRY_WORDS.has(words[0].toLowerCase());
    const hasDistinctiveElement = words.length >= 2 || (words.length === 1 && !GENERIC_INDUSTRY_WORDS.has(words[0].toLowerCase()));

    checks.push({
      id: 'rule-distinctiveness',
      title: 'Distinctive Coined Prefix Requirement',
      passed: !isSingleGenericWord && hasDistinctiveElement,
      severity: !isSingleGenericWord && hasDistinctiveElement ? 'success' : 'error',
      description: !isSingleGenericWord && hasDistinctiveElement
        ? 'Proposed name contains a distinctive coined prefix or unique identifier.'
        : 'Pure generic industry names (e.g., "Software Private Limited") are prohibited. A unique coined prefix is required.',
      mcaReference: 'MCA Rule 8(2)(a) - Coined Prefix and Principle of Distinctiveness',
    });

    // 5. Structure & Principle Activity Suffix (Distinctive Name + Activity Word)
    const hasActivityWord = words.some((w) => GENERIC_INDUSTRY_WORDS.has(w.toLowerCase())) || Boolean(activityCategory);

    checks.push({
      id: 'rule-activity-object',
      title: 'Proposed Business Object Alignment',
      passed: true,
      severity: hasActivityWord ? 'success' : 'warning',
      description: hasActivityWord
        ? 'Name structure pairs a distinctive prefix with a recognizable business activity indicator.'
        : 'Adding a clear business activity keyword (e.g. Technologies, Solutions, Advisory) helps ROC approval speed.',
      mcaReference: 'MCA Rule 8(2)(b)(ii) - Object Clause Consistency',
    });

    // 6. Similarity Search against sample corporate registry (heuristic benchmark)
    const heuristicRegisteredNames: SimilarNameResult[] = [];
    for (const registered of SAMPLE_REGISTRY_NAMES) {
      const similarity = calculateLevenshteinSimilarity(normalized, registered);
      if (similarity >= 0.55) {
        heuristicRegisteredNames.push({
          name: registered,
          similarity: Math.round(similarity * 100),
          status: similarity >= 0.85 ? 'trademark_conflict' : 'phonetic_match',
          entityType: 'Private Limited / Limited',
          source: 'local_heuristic',
        });
      }
    }
    heuristicRegisteredNames.sort((a, b) => b.similarity - a.similarity);

    // 7. Live MCA Company Master Lookup via Falcon eBiz + Layer 2 Online Brand Presence via Gemini Google Search + Layer 3 Trademark Conflict Analysis via TradeMarx
    const [mcaResult, onlineBrandPresence, trademarkResult] = await Promise.all([
      this.fetchMcaCompanyMaster(normalized),
      this.analyzeOnlineBrandPresence(normalized, activityCategory),
      this.fetchTrademarkSearch(normalized, activityCategory),
    ]);
    const mcaRegisteredNames: SimilarNameResult[] = [];

    for (const record of mcaResult.records) {
      const similarity = calculateCorporateSimilarity(normalized, record.name);
      const similarityPct = Math.round(similarity * 100);
      mcaRegisteredNames.push({
        name: record.name,
        similarity: similarityPct,
        status: similarityPct >= 80 ? 'trademark_conflict' : 'phonetic_match',
        entityType: record.entityType || 'Registered Corporate Entity',
        cin: record.cin,
        companyStatus: record.status || 'Active',
        roc: record.roc,
        source: 'mca_api',
      });
    }
    mcaRegisteredNames.sort((a, b) => b.similarity - a.similarity);

    // If Falcon fails/unavailable, return mcaApiStatus='error' and DO NOT present the name as MCA-verified/available
    const finalMcaStatus: 'connected' | 'no_records' | 'error' | 'unconfigured' =
      mcaResult.status === 'connected' || mcaResult.status === 'no_records'
        ? mcaResult.status
        : 'error';

    // Use returned MCA company data as the source for similarRegisteredNames if available
    const similarRegisteredNames: SimilarNameResult[] =
      mcaRegisteredNames.length > 0
        ? mcaRegisteredNames.slice(0, 5)
        : heuristicRegisteredNames.slice(0, 5);

    const mcaSource: 'live_mca_api' | 'local_heuristic' =
      mcaRegisteredNames.length > 0 ? 'live_mca_api' : 'local_heuristic';

    // Identify exact or high similarity conflicts from live MCA data
    const topMcaMatch = mcaRegisteredNames.length > 0 ? mcaRegisteredNames[0] : null;
    const topMcaSim = topMcaMatch ? topMcaMatch.similarity : 0;
    const hasExactMcaConflict = topMcaSim >= 95;
    const hasHighMcaConflict = topMcaSim >= 80;

    // Combine MCA Risk + Web/Brand Presence Risk into the combined preliminary assessment:
    // - High MCA conflict always remains High.
    // - Low MCA + High Web Presence = caution/high brand conflict signal.
    // - Low MCA + Low Web Presence = better preliminary position.
    const mcaRisk: 'low' | 'medium' | 'high' = hasHighMcaConflict
      ? 'high'
      : similarRegisteredNames.some((s) => s.similarity >= 65)
      ? 'medium'
      : 'low';

    const hasStrongBrand = onlineBrandPresence.brandsFound.some((b) => b.usageStrength === 'strong');
    const hasModerateBrand = onlineBrandPresence.brandsFound.some((b) => b.usageStrength === 'moderate');
    const hasWeakBrand = onlineBrandPresence.brandsFound.some((b) => b.usageStrength === 'weak');

    const brandRisk: 'low' | 'medium' | 'high' =
      onlineBrandPresence.status === 'unavailable'
        ? 'low'
        : (onlineBrandPresence.riskLevel === 'high' || hasStrongBrand)
        ? 'high'
        : (onlineBrandPresence.riskLevel === 'medium' || hasModerateBrand)
        ? 'medium'
        : 'low';

    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    let combinedGuidance = '';

    if (mcaRisk === 'high') {
      // High MCA conflict always remains High
      overallRisk = 'high';
      combinedGuidance =
        'Direct prior corporate rights conflict in MCA Master Data takes statutory precedence. Official MCA Rule 8 reservation cannot proceed without modifying the distinctive coined element, regardless of public web availability.';
    } else if (brandRisk === 'high') {
      // Low MCA + High Web Presence = caution/high brand conflict signal
      overallRisk = 'medium';
      combinedGuidance =
        'Favorable preliminary MCA registry status, but significant commercial brand presence was detected on the public web. While no registered corporate entity was found in MCA Master Data, operating commercial brands pose potential trademark conflict or common-law passing-off objections.';
    } else if (mcaRisk === 'medium' || brandRisk === 'medium') {
      overallRisk = 'medium';
      combinedGuidance =
        'Moderate preliminary risk. Some phonetic proximity or commercial web references exist. A preliminary trademark class search and activity clause alignment are recommended.';
    } else {
      // Low MCA + Low Web Presence = better preliminary position
      overallRisk = 'low';
      combinedGuidance =
        'Favorable preliminary position. No identical corporate records were detected in MCA Master Data, and real-time public web search indicates low commercial brand footprint for this coined mark.';
    }

    const combinedAssessment: CombinedAssessment = {
      overallRisk,
      mcaRisk,
      brandRisk,
      trademarkRisk: trademarkResult.riskLevel,
      guidance: combinedGuidance,
    };

    // 1. Compute deterministic MCA Assessment Score (0 to 100, 70% weight)
    let mcaScore = 95;

    // Deduct for format errors
    if (!minLengthValid || hasSpecialChars) mcaScore -= 30;

    // Deduct for prohibited words (instant critical)
    if (prohibitedFound.length > 0) mcaScore -= 50;

    // Deduct for regulatory approval required
    if (regulatoryFound.length > 0) mcaScore -= 20;

    // Deduct for generic single word
    if (isSingleGenericWord) mcaScore -= 35;

    // Strong score reduction when live MCA/Falcon results contain an exact or highly similar registered company/LLP name
    if (hasExactMcaConflict) {
      // Exact or coined match with registered MCA entity: major penalty, capped at 15-20
      mcaScore = Math.min(20, mcaScore - 75);
    } else if (hasHighMcaConflict) {
      // High similarity conflict (>= 80%): strong score reduction, capped at 30-32
      mcaScore = Math.min(32, mcaScore - 60);
    } else if (similarRegisteredNames.length > 0) {
      const topSim = similarRegisteredNames[0].similarity;
      if (topSim >= 90) mcaScore -= 70;
      else if (topSim >= 80) mcaScore -= 45;
      else if (topSim >= 65) mcaScore -= 25;
      else if (topSim >= 50) mcaScore -= 15;
    }

    mcaScore = Math.max(10, Math.min(98, mcaScore));

    // 2. Compute deterministic Online Brand Presence Score (0 to 100, 30% weight)
    // - Strong commercial usage causes significant reduction.
    // - Weak or incidental mentions do NOT get treated the same as strong commercial usage.
    let brandScore = 95;
    if (onlineBrandPresence.status === 'unavailable') {
      // Neutral baseline matching mcaScore if search is offline so absence of service doesn't penalize
      brandScore = mcaScore;
    } else if (brandRisk === 'high') {
      // Strong commercial usage in market: major brand deduction
      brandScore = hasStrongBrand ? 20 : 30;
    } else if (brandRisk === 'medium') {
      // Moderate commercial presence: moderate deduction
      brandScore = hasModerateBrand ? 50 : 60;
    } else {
      // Low brand risk: clean or only weak/incidental mentions
      brandScore = hasWeakBrand ? 85 : 95;
    }

    // 3. Combined Overall Name Strength Score: 70% MCA weight + 30% Online Brand Presence weight
    let overallScore = Math.round(mcaScore * 0.7 + brandScore * 0.3);

    // Hard conflict cap: exact or high MCA conflict keeps very low score cap; web evidence must NEVER override MCA conflict
    if (hasExactMcaConflict) {
      overallScore = Math.min(20, overallScore);
    } else if (hasHighMcaConflict) {
      overallScore = Math.min(32, overallScore);
    } else if (brandRisk === 'high') {
      // MCA clean + High Web/Brand Risk: overall score falls into a clearly cautious range (capped at 72)
      overallScore = Math.min(72, overallScore);
    } else if (brandRisk === 'medium') {
      // MCA clean + Medium Web/Brand Risk: overall score is moderately reduced (capped at 80)
      overallScore = Math.min(80, overallScore);
    }

    overallScore = Math.max(10, Math.min(98, overallScore));
    let score = overallScore;

    // If Falcon fails/unavailable, return mcaApiStatus='error' and DO NOT present the name as MCA-verified/available
    let isAvailable = false;
    let summaryText = '';

    if (finalMcaStatus === 'error') {
      isAvailable = false;
      summaryText =
        'Live MCA registry lookup is currently unavailable. The proposed name cannot be verified as available without active MCA Master Data confirmation.';
    } else if (hasHighMcaConflict && topMcaMatch) {
      isAvailable = false;
      summaryText = `High MCA Conflict Risk: The proposed name directly conflicts with existing registered entity "${topMcaMatch.name}" (${topMcaMatch.cin || 'CIN/LLPIN on record'}) in live MCA Master Data with ${topMcaSim}% similarity. Under Section 4(2) of the Companies Act 2013 and MCA Rule 8(2)(a), identical or deceptively similar names are strictly prohibited. The proposed name has an existing MCA conflict and should be reviewed or changed prior to filing.`;
    } else if (prohibitedFound.length > 0) {
      isAvailable = false;
      summaryText = `Contains prohibited statutory term(s): "${prohibitedFound.join(', ')}". Reservation will be rejected under the Emblems and Names Act.`;
    } else if (isSingleGenericWord) {
      isAvailable = false;
      summaryText = 'Single generic industry word detected. An additional distinctive coined prefix is required under MCA Rule 8.';
    } else if (brandRisk === 'high') {
      // MCA clean + High Web/Brand Risk: clearly cautious range (e.g. 74/100)
      isAvailable = false;
      summaryText =
        'Caution: Commercial Brand Presence Detected. While no direct entity was found in MCA Master Data, active commercial operations or products were identified on the public web. Operating market usage presents trademark and common-law passing-off risks. Further distinctiveness or name review is recommended.';
    } else if (brandRisk === 'medium') {
      // MCA clean + Medium Web Risk
      isAvailable = prohibitedFound.length === 0 && !isSingleGenericWord && overallScore >= 65;
      summaryText =
        'Preliminary assessment shows acceptable MCA compliance with moderate online commercial presence. A comprehensive trademark search across relevant NICE classes is recommended before SPICe+ submission.';
    } else if (overallScore >= 85) {
      // MCA clean + Low Web Risk
      isAvailable = prohibitedFound.length === 0 && !isSingleGenericWord;
      summaryText =
        'Strong overall name strength. High compliance with MCA Rule 8 principles, with no identical corporate records in MCA Master Data and low public web brand footprint.';
    } else if (overallScore >= 65) {
      isAvailable = prohibitedFound.length === 0 && !isSingleGenericWord;
      summaryText =
        'Preliminary assessment indicates acceptable baseline compliance. It is recommended to conduct a thorough trademark class check and confirm object clause consistency prior to SPICe+ submission.';
    } else if (overallScore >= 40) {
      isAvailable = false;
      summaryText =
        'Moderate risk of ROC resubmission. Name contains regulatory, descriptive, or conflicting elements requiring modification.';
    } else {
      isAvailable = false;
      summaryText =
        'High risk of MCA rejection. Existing corporate conflicts, prohibited terms, or high similarity to registered marks detected. Name modification required.';
    }

    logger.info(
      `Evaluated company name "${rawName}" -> Overall Score: ${overallScore} (MCA: ${mcaScore}, Brand: ${brandScore}, Brand Risk: ${brandRisk})`,
      'CompanySearchService'
    );

    return {
      query: rawName,
      entityType,
      normalizedName: normalized,
      fullProposedName,
      isAvailable,
      availabilityScore: overallScore,
      overallScore,
      mcaScore,
      brandScore,
      summary: summaryText,
      checks,
      prohibitedWordsFound: prohibitedFound,
      similarRegisteredNames,
      mcaRegisteredNames,
      heuristicRegisteredNames,
      mcaApiStatus: mcaResult.status,
      mcaSource,
      onlineBrandPresence,
      trademarkResult,
      combinedAssessment,
      timestamp,
    };
  }
}

export const companySearchService = new CompanySearchService();
