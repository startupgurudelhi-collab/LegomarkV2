import { GoogleGenAI, Type, Schema } from '@google/genai';
import { logger } from '../utils/logger';

export interface BlogSeriesArticleData {
  sequenceNumber: number;
  suggestedTitle: string;
  primaryKeyword: string;
  searchIntent: string; // e.g. 'Informational', 'Commercial', 'Transactional', 'Procedural'
  contentAngle: string; // e.g. 'Foundational overview', 'Step-by-step statutory filing roadmap', etc.
  keyTakeaways?: string[];
}

export interface BlogSeriesData {
  topic: string;
  targetService?: string;
  articleCount: number;
  seriesOverview?: string;
  articles: BlogSeriesArticleData[];
}

export class BlogSeriesService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateSeries(
    topic: string,
    targetService?: string,
    articleCount: number = 5
  ): Promise<BlogSeriesData> {
    const cleanTopic = topic?.trim();
    const cleanService = targetService?.trim();

    if (!cleanTopic) {
      throw new Error('Series Topic / Main Theme is required');
    }

    // Enforce 3 to 8 range
    const validCount = Math.min(Math.max(Math.round(articleCount) || 5, 3), 8);

    const ai = this.getClient();

    const prompt = `You are a master corporate legal content strategist, senior compliance editor, and SEO director for LEGOMARK INDIA (legomarkindia.com), India's premier corporate legal, taxation, trademark, and statutory compliance consultancy in New Delhi.

Your task is to plan a highly strategic, cohesive, and logically sequential ${validCount}-part AI Blog Series on the following theme:
- Series Topic / Main Theme: "${cleanTopic}"
${cleanService ? `- Target Practice Area / Service: "${cleanService}"` : '- Domain: Indian Corporate Law, Company Registration, Taxation (GST & Income Tax), MCA Compliance & Intellectual Property'}
- Total Articles to Plan: Exactly ${validCount} articles in logical sequential progression.

STRATEGIC EDITORIAL DIRECTIVES FOR THE SERIES:
1. Progression & Structure:
   - Part 1 should establish foundational clarity, legal necessity, eligibility, or concept comparison.
   - Middle installments should cover procedural step-by-step filings, statutory documentation, MCA/GST portal workflows, thresholds, and timelines in India.
   - Later installments should address common pitfalls/penalties, tax optimization, compliance maintenance, disputes/objections, or scaling strategy.
2. For EACH of the ${validCount} articles, you MUST provide:
   - Sequence Number: Exactly 1 through ${validCount} in sequential order.
   - Suggested Title: A high-CTR, SEO-optimized title specifically written for Indian entrepreneurs and corporate leaders (under 75 characters).
   - Primary Keyword: High-intent primary target search term for this specific article in India.
   - Search Intent: The predominant user search intent (e.g., 'Informational', 'Commercial Investigation', 'Transactional', 'Procedural / How-To', or 'Statutory Compliance').
   - Content Angle: The unique editorial angle and perspective of this article explaining why it is critical and how it avoids duplicating other articles in the series.
   - Key Takeaways: 2 to 3 concise bullet points outlining what the reader will learn.
3. Provide a brief high-level series overview summarizing the cohesive objective of the publication sequence.`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        targetService: { type: Type.STRING },
        articleCount: { type: Type.INTEGER },
        seriesOverview: {
          type: Type.STRING,
          description: 'High-level editorial summary of the series objective',
        },
        articles: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sequenceNumber: {
                type: Type.INTEGER,
                description: 'Sequence number from 1 to N',
              },
              suggestedTitle: {
                type: Type.STRING,
                description: 'SEO-optimized article title under 75 characters',
              },
              primaryKeyword: {
                type: Type.STRING,
                description: 'Target search keyword in India',
              },
              searchIntent: {
                type: Type.STRING,
                description: 'Search intent: Informational, Commercial, Procedural, Transactional, etc.',
              },
              contentAngle: {
                type: Type.STRING,
                description: 'Unique perspective, scope, and editorial angle',
              },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 core takeaway learnings',
              },
            },
            required: [
              'sequenceNumber',
              'suggestedTitle',
              'primaryKeyword',
              'searchIntent',
              'contentAngle',
            ],
          },
          description: `Array of exactly ${validCount} articles in sequence`,
        },
      },
      required: ['topic', 'articleCount', 'articles'],
    };

    logger.info(
      `Generating AI Blog Series for: "${cleanTopic}" (${validCount} articles)`,
      'BlogSeriesService'
    );

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
            temperature: 0.5,
          },
        });
        if (response && response.text) {
          logger.info(
            `Successfully generated blog series using model: ${modelName}`,
            'BlogSeriesService'
          );
          break;
        }
      } catch (err: any) {
        lastError = err;
        logger.warn(
          `Failed generating blog series with ${modelName}: ${err?.message || err}. Attempting fallback...`,
          'BlogSeriesService'
        );
      }
    }

    if (!response || !response.text) {
      throw new Error(
        lastError?.message ||
          'Failed to generate blog series from Gemini API. Please check your API key and try again.'
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(response.text.trim());
    } catch (parseErr) {
      logger.error('Failed to parse Gemini JSON output', 'BlogSeriesService', parseErr);
      throw new Error('Invalid JSON structure returned by AI model.');
    }

    // Normalization & sorting guarantees
    const rawArticles: any[] = Array.isArray(parsed.articles) ? parsed.articles : [];
    const normalizedArticles: BlogSeriesArticleData[] = rawArticles.map((art, idx) => ({
      sequenceNumber: typeof art.sequenceNumber === 'number' ? art.sequenceNumber : idx + 1,
      suggestedTitle: String(art.suggestedTitle || `Article ${idx + 1}`).trim(),
      primaryKeyword: String(art.primaryKeyword || cleanTopic).trim(),
      searchIntent: String(art.searchIntent || 'Informational').trim(),
      contentAngle: String(art.contentAngle || 'Comprehensive practical guide').trim(),
      keyTakeaways: Array.isArray(art.keyTakeaways)
        ? art.keyTakeaways.map((k: any) => String(k).trim()).filter(Boolean)
        : [],
    }));

    normalizedArticles.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    return {
      topic: cleanTopic,
      targetService: cleanService || undefined,
      articleCount: normalizedArticles.length,
      seriesOverview: parsed.seriesOverview || undefined,
      articles: normalizedArticles,
    };
  }
}

export const blogSeriesService = new BlogSeriesService();
