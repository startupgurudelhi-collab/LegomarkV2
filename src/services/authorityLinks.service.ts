import { CURATED_AUTHORITY_SOURCES } from '../config/authoritySources';
import { AuthorityLinkSuggestion, AuthoritySource } from '../types/authorityLink';

export interface ScanAuthorityLinksInput {
  title: string;
  category?: string;
  content: string;
}

/**
 * Deterministic Authority Link Suggestion Service (V1)
 * Analyzes article metadata and content to suggest verified Indian statutory links.
 * Never invents or mutates URLs; strictly uses the curated registry.
 */
export class AuthorityLinksService {
  /**
   * Scans content and returns a curated set of relevant statutory link suggestions.
   */
  public generateSuggestions(input: ScanAuthorityLinksInput): AuthorityLinkSuggestion[] {
    const title = (input.title || '').trim().toLowerCase();
    const category = (input.category || '').trim();
    const content = (input.content || '').trim();
    const contentLower = content.toLowerCase();

    // 1. Extract all existing URLs and domains already embedded in the article content
    const existingUrlsAndDomains = this.extractExistingDomainsAndUrls(content);

    // 2. Score candidate authority sources from the curated registry
    const scoredCandidates: Array<{
      source: AuthoritySource;
      score: number;
      matchedKeywords: string[];
      isCategoryMatch: boolean;
    }> = [];

    for (const source of CURATED_AUTHORITY_SOURCES) {
      // Rule: Do NOT suggest a source if its domain or target URL is already present in the article
      const sourceDomain = source.domain.toLowerCase();
      const sourceUrl = source.targetUrl.toLowerCase();
      const isAlreadyLinked =
        existingUrlsAndDomains.has(sourceDomain) ||
        existingUrlsAndDomains.has(sourceUrl) ||
        contentLower.includes(sourceDomain) ||
        contentLower.includes(sourceUrl);

      if (isAlreadyLinked) {
        continue;
      }

      let score = 0;
      const matchedKeywords: string[] = [];

      // Category Affinity Match
      const isCategoryMatch = source.primaryCategories.some(
        (cat) => cat.toLowerCase() === category.toLowerCase()
      );
      if (isCategoryMatch) {
        score += 10;
      }

      // Keyword Matches in Title (High signal)
      for (const kw of source.statutoryKeywords) {
        const kwLower = kw.toLowerCase();
        if (title.includes(kwLower)) {
          score += 6;
          matchedKeywords.push(kw);
        }
      }

      // Keyword Matches in Content (Moderate signal)
      let contentMatches = 0;
      for (const kw of source.statutoryKeywords) {
        const kwLower = kw.toLowerCase();
        // check word boundary or phrase presence
        if (contentLower.includes(kwLower)) {
          score += 2;
          contentMatches++;
          if (!matchedKeywords.includes(kw)) {
            matchedKeywords.push(kw);
          }
        }
      }

      // Only qualify candidates with meaningful contextual relevance
      // Either category match + at least 1 keyword, or multiple strong keywords
      if (score >= 8 || (matchedKeywords.length >= 2 && score >= 6)) {
        scoredCandidates.push({
          source,
          score,
          matchedKeywords,
          isCategoryMatch,
        });
      }
    }

    // 3. Sort candidates by score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // 4. Deduplicate by domain (max 1 link per authority domain per article)
    const seenDomains = new Set<string>();
    const selectedSources: Array<{
      source: AuthoritySource;
      score: number;
      matchedKeywords: string[];
      isCategoryMatch: boolean;
    }> = [];

    for (const candidate of scoredCandidates) {
      const d = candidate.source.domain.toLowerCase();
      if (!seenDomains.has(d)) {
        seenDomains.add(d);
        selectedSources.push(candidate);
      }
      // Cap at top 3 most relevant suggestions for clean editorial review
      if (selectedSources.length >= 3) {
        break;
      }
    }

    // 5. Construct formatted suggestions with reasons and contextual snippets
    return selectedSources.map(({ source, score, matchedKeywords, isCategoryMatch }) => {
      const topKeywords = matchedKeywords.slice(0, 3).join(', ');
      let relevanceReason = source.rationaleTemplate;
      if (matchedKeywords.length > 0) {
        relevanceReason = `Relevant to article terms (${topKeywords}). ${source.rationaleTemplate}`;
      } else if (isCategoryMatch) {
        relevanceReason = `Aligns with "${category}" category. ${source.rationaleTemplate}`;
      }

      return {
        id: `suggestion-${source.id}`,
        sourceName: source.sourceName,
        authorityCategory: source.authorityCategory,
        domain: source.domain,
        targetUrl: source.targetUrl,
        isGovernmentPortal: source.isGovernmentPortal,
        suggestedAnchorText: source.defaultAnchorText,
        relevanceReason,
        contextSnippet: source.contextSnippetTemplate,
        placementRecommendation: source.recommendedPlacement,
        relevanceScore: Math.min(100, Math.round(score * 4.5)),
      };
    });
  }

  /**
   * Helper to extract all domains and target URLs currently present in content
   */
  private extractExistingDomainsAndUrls(content: string): Set<string> {
    const detected = new Set<string>();
    if (!content) return detected;

    // 1. Markdown Links [text](url)
    const mdRegex = /\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/gi;
    let match;
    while ((match = mdRegex.exec(content)) !== null) {
      const url = match[2].trim().toLowerCase();
      detected.add(url);
      try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const parsed = new URL(url);
          detected.add(parsed.hostname.replace(/^www\./, ''));
        }
      } catch {
        // ignore malformed
      }
    }

    // 2. HTML Links <a href="...">
    const htmlRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>/gi;
    while ((match = htmlRegex.exec(content)) !== null) {
      const url = match[1].trim().toLowerCase();
      detected.add(url);
      try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const parsed = new URL(url);
          detected.add(parsed.hostname.replace(/^www\./, ''));
        }
      } catch {
        // ignore malformed
      }
    }

    return detected;
  }
}

export const authorityLinksService = new AuthorityLinksService();
