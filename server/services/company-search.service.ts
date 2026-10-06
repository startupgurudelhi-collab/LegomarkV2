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

    // 7. Live MCA Company Master Lookup via Falcon eBiz Company Search API
    const mcaResult = await this.fetchMcaCompanyMaster(normalized);
    const mcaRegisteredNames: SimilarNameResult[] = [];

    for (const record of mcaResult.records) {
      const normRecord = this.normalizeName(record.name).normalized;
      const similarity = Math.max(
        calculateLevenshteinSimilarity(normalized, record.name),
        calculateLevenshteinSimilarity(normalized, normRecord)
      );
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
      if (topSim >= 90) score -= 70;
      else if (topSim >= 80) score -= 45;
      else if (topSim >= 65) score -= 25;
      else if (topSim >= 50) score -= 15;
    }

    score = Math.max(10, Math.min(98, score));

    // If Falcon fails/unavailable, return mcaApiStatus='error' and DO NOT present the name as MCA-verified/available
    let isAvailable = false;
    let summaryText = '';

    if (finalMcaStatus === 'error') {
      isAvailable = false;
      summaryText =
        'Live MCA registry lookup is currently unavailable. The proposed name cannot be verified as available without active MCA Master Data confirmation.';
    } else if (mcaRegisteredNames.length > 0 && mcaRegisteredNames[0].similarity >= 85) {
      isAvailable = false;
      summaryText = `High similarity to registered corporate entity "${mcaRegisteredNames[0].name}" (${mcaRegisteredNames[0].cin || 'CIN/LLPIN on record'}) found in MCA Master Data. Review or modify distinctive element.`;
    } else if (score >= 85) {
      isAvailable = score >= 65 && prohibitedFound.length === 0 && !isSingleGenericWord;
      summaryText = 'Strong distinctive name! Highly compliant with MCA Rule 8 and low conflict risk.';
    } else if (score >= 65) {
      isAvailable = score >= 65 && prohibitedFound.length === 0 && !isSingleGenericWord;
      summaryText = 'Good availability score. Recommended to proceed with preliminary CA/CS trademark check before SPICe+ filing.';
    } else if (score >= 40) {
      isAvailable = false;
      summaryText = 'Moderate risk of ROC resubmission. Name contains regulatory or partially conflicting elements.';
    } else {
      isAvailable = false;
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
