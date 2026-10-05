import { EntityType, RuleCheckResult, SimilarNameResult, NameSearchResponse } from '../../src/types/company-search';
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
 * Extracts and maps company fields from RapidAPI MCA Company Master response.
 * Maps only fields actually returned by the endpoint without inventing fields.
 */
function extractMcaRecords(responseData: any): McaRecordItem[] {
  if (!responseData) return [];

  let candidates: any[] = [];
  if (Array.isArray(responseData)) {
    candidates = responseData;
  } else if (Array.isArray(responseData.data)) {
    candidates = responseData.data;
  } else if (Array.isArray(responseData.results)) {
    candidates = responseData.results;
  } else if (Array.isArray(responseData.companies)) {
    candidates = responseData.companies;
  } else if (Array.isArray(responseData.records)) {
    candidates = responseData.records;
  } else if (typeof responseData.data === 'object' && responseData.data !== null) {
    candidates = [responseData.data];
  } else if (typeof responseData === 'object' && responseData !== null) {
    if (
      responseData.company_name ||
      responseData.companyName ||
      responseData.cin ||
      responseData.CIN ||
      responseData.name
    ) {
      candidates = [responseData];
    }
  }

  const results: McaRecordItem[] = [];

  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;

    const name = (
      item.company_name ||
      item.companyName ||
      item.name ||
      item.company ||
      item.legal_name ||
      item.title
    )?.toString().trim();

    if (!name) continue;

    const cin = (
      item.cin ||
      item.CIN ||
      item.cin_number ||
      item.corporate_id
    )?.toString().trim();

    const status = (
      item.status ||
      item.company_status ||
      item.cin_status ||
      item.companyStatus
    )?.toString().trim();

    const roc = (
      item.roc ||
      item.roc_code ||
      item.registrar
    )?.toString().trim();

    const entityType = (
      item.company_class ||
      item.class ||
      item.category
    )?.toString().trim();

    results.push({ name, cin, status, roc, entityType });
  }

  return results;
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

export class CompanySearchService {
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
   * Queries RapidAPI MCA Company Master API using the cin query parameter.
   * Handles timeouts, network failures, and non-200 responses gracefully.
   */
  async fetchMcaCompanyMaster(queryName: string): Promise<{
    records: McaRecordItem[];
    status: 'connected' | 'no_records' | 'error' | 'unconfigured';
  }> {
    const apiKey =
      config.rapidApi.key ||
      getRuntimeEnv('RAPIDAPI_KEY', 'RAPID_API_KEY', 'VITE_RAPIDAPI_KEY', 'X_RAPIDAPI_KEY');
    const apiHost =
      config.rapidApi.host ||
      getRuntimeEnv('RAPIDAPI_HOST', 'RAPID_API_HOST', 'VITE_RAPIDAPI_HOST', 'X_RAPIDAPI_HOST');

    // Safe server-side diagnostic check (never logs the API key value)
    logger.info(
      `MCA RapidAPI Runtime Check -> Key configured: ${Boolean(apiKey)} (length: ${apiKey?.length || 0}), Host: ${apiHost || 'unconfigured'}`,
      'CompanySearchService'
    );

    if (!apiKey || !apiHost) {
      logger.info(
        'RapidAPI credentials not configured; evaluating similarity via local reference benchmark.',
        'CompanySearchService'
      );
      return { records: [], status: 'unconfigured' };
    }

    const cleanHost = apiHost.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const baseUrl = cleanHost.includes('/') ? `https://${cleanHost}` : `https://${cleanHost}/`;
    const url = new URL(baseUrl);
    url.searchParams.set('cin', queryName);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      logger.info(`Querying RapidAPI MCA Company Master API for "${queryName}"`, 'CompanySearchService');
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': cleanHost.split('/')[0],
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        logger.warn(
          `RapidAPI MCA Company Master returned HTTP ${response.status}: ${response.statusText}`,
          'CompanySearchService'
        );
        return { records: [], status: 'error' };
      }

      const data = await response.json();
      const extracted = extractMcaRecords(data);

      if (extracted.length === 0) {
        logger.info(`RapidAPI MCA API returned 0 matching records for "${queryName}"`, 'CompanySearchService');
        return { records: [], status: 'no_records' };
      }

      logger.info(`RapidAPI MCA API successfully retrieved ${extracted.length} records for "${queryName}"`, 'CompanySearchService');
      return { records: extracted, status: 'connected' };
    } catch (err: any) {
      clearTimeout(timeout);
      logger.warn(
        `RapidAPI MCA API call failed or timed out: ${err?.message || err}`,
        'CompanySearchService'
      );
      return { records: [], status: 'error' };
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

    // 7. Live MCA Company Master Lookup via RapidAPI using the cin query parameter
    const mcaResult = await this.fetchMcaCompanyMaster(normalized);
    const mcaRegisteredNames: SimilarNameResult[] = [];

    for (const record of mcaResult.records) {
      const similarity = calculateLevenshteinSimilarity(normalized, record.name);
      mcaRegisteredNames.push({
        name: record.name,
        similarity: Math.round(similarity * 100),
        status: similarity >= 0.85 ? 'trademark_conflict' : 'phonetic_match',
        entityType: record.entityType || 'Registered Corporate Entity',
        cin: record.cin,
        companyStatus: record.status || 'Active',
        roc: record.roc,
        source: 'mca_api',
      });
    }
    mcaRegisteredNames.sort((a, b) => b.similarity - a.similarity);

    // Use returned MCA company data as the source for similarRegisteredNames if available
    const similarRegisteredNames: SimilarNameResult[] =
      mcaRegisteredNames.length > 0
        ? mcaRegisteredNames.slice(0, 5)
        : heuristicRegisteredNames.slice(0, 5);

    const mcaSource: 'live_mca_api' | 'local_heuristic' =
      mcaRegisteredNames.length > 0 ? 'live_mca_api' : 'local_heuristic';

    // Compute deterministic availability score (0 to 100)
    let score = 95;

    // Deduct for format errors
    if (!minLengthValid || hasSpecialChars) score -= 30;

    // Deduct for prohibited words (instant critical)
    if (prohibitedFound.length > 0) score -= 50;

    // Deduct for regulatory approval required
    if (regulatoryFound.length > 0) score -= 20;

    // Deduct for generic single word
    if (isSingleGenericWord) score -= 35;

    // Deduct for close phonetic similarity (uses MCA registry data if available, else heuristic)
    if (similarRegisteredNames.length > 0) {
      const topSim = similarRegisteredNames[0].similarity;
      if (topSim >= 90) score -= 45;
      else if (topSim >= 75) score -= 25;
      else if (topSim >= 60) score -= 15;
    }

    score = Math.max(10, Math.min(98, score));
    const isAvailable = score >= 65 && prohibitedFound.length === 0 && !isSingleGenericWord;

    let summaryText = 'High probability of MCA name reservation approval.';
    if (mcaRegisteredNames.length > 0 && mcaRegisteredNames[0].similarity >= 85) {
      summaryText = `High similarity to registered corporate entity "${mcaRegisteredNames[0].name}" found in MCA Master Data. Review or modify distinctive element.`;
    } else if (score >= 85) {
      summaryText = 'Strong distinctive name! Highly compliant with MCA Rule 8 and low conflict risk.';
    } else if (score >= 65) {
      summaryText = 'Good availability score. Recommended to proceed with preliminary CA/CS trademark check before SPICe+ filing.';
    } else if (score >= 40) {
      summaryText = 'Moderate risk of ROC resubmission. Name contains regulatory or partially conflicting elements.';
    } else {
      summaryText = 'High risk of MCA rejection. Prohibited terms or high similarity to existing corporate marks detected.';
    }

    logger.info(
      `Evaluated company name "${rawName}" -> Score: ${score} (MCA Source: ${mcaSource}, MCA Status: ${mcaResult.status})`,
      'CompanySearchService'
    );

    return {
      query: rawName,
      entityType,
      normalizedName: normalized,
      fullProposedName,
      isAvailable,
      availabilityScore: score,
      summary: summaryText,
      checks,
      prohibitedWordsFound: prohibitedFound,
      similarRegisteredNames,
      mcaRegisteredNames,
      heuristicRegisteredNames,
      mcaApiStatus: mcaResult.status,
      mcaSource,
      timestamp,
    };
  }
}

export const companySearchService = new CompanySearchService();
