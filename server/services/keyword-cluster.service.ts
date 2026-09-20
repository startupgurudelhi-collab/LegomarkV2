import { GoogleGenAI, Type, Schema } from '@google/genai';
import { logger } from '../utils/logger';

export interface KeywordClusterData {
  topic: string;
  targetService?: string;
  searchIntent: {
    primaryIntent: string; // e.g., 'Commercial', 'Informational', 'Transactional', 'Navigational'
    explanation: string;
    targetAudience: string;
  };
  primaryKeyword: {
    keyword: string;
    estimatedCompetition: 'Low' | 'Medium' | 'High';
    rationale: string;
  };
  secondaryKeywords: Array<{
    keyword: string;
    relevance: string;
  }>;
  longTailKeywords: Array<{
    keyword: string;
    userQueryContext: string;
  }>;
  questionKeywords: Array<{
    question: string;
    intentType: string;
  }>;
  summary?: string;
}

export class KeywordClusterService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateCluster(topic: string, targetService?: string): Promise<KeywordClusterData> {
    const cleanTopic = topic?.trim();
    const cleanService = targetService?.trim();

    if (!cleanTopic) {
      throw new Error('Main Topic / Seed Keyword is required');
    }

    const ai = this.getClient();

    const prompt = `You are a premier SEO strategist, keyword research specialist, and corporate legal/tax marketing expert for LEGOMARK INDIA (legomarkindia.com), an authoritative corporate legal, taxation, trademark, and compliance consultancy in New Delhi, India.

Generate an authoritative, highly practical, and semantic AI Keyword Cluster based on:
- Seed Keyword / Main Topic: "${cleanTopic}"
${cleanService ? `- Target Practice Area / Service: "${cleanService}"` : '- Target Domain: Indian Corporate Law, Company Registration, Tax/GST & Trademark Protection'}

Group the results into these 5 strict categories:
1. Search Intent:
   - Identify the primary search intent (Commercial, Transactional, Informational, or Navigational).
   - Explain why users perform this query in India.
   - Describe the target audience (e.g. startup founders, directors, foreign subsidiaries, SMEs, trademark applicants).
2. Primary Keyword:
   - The single best authoritative seed target keyword with optimal search volume and business relevance in India.
   - Estimated competition (Low, Medium, or High).
   - Brief rationale for selecting it as the primary anchor.
3. Secondary Keywords:
   - 6 to 10 closely related semantic (LSI) keywords and commercial variations used in Indian corporate law and business filings.
   - For each, provide a short relevance note.
4. Long-tail Keywords:
   - 6 to 8 specific, low-competition, high-conversion multi-word long-tail queries (e.g. including state/city modifiers, pricing intent, step-by-step procedures, or eligibility).
   - For each, provide the context or stage in the buyer journey.
5. Question Keywords:
   - 6 to 10 high-value question queries asked by Indian entrepreneurs, CFOs, and founders (e.g., "how to...", "is it mandatory to...", "what is the penalty for...", "difference between...").
   - Intent type for each question (e.g. Procedural, Statutory, Cost Analysis, Eligibility).

Provide concise summary insights on how a content strategist should leverage this keyword cluster.`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        targetService: { type: Type.STRING },
        searchIntent: {
          type: Type.OBJECT,
          properties: {
            primaryIntent: { type: Type.STRING, description: 'Commercial, Informational, Transactional, etc.' },
            explanation: { type: Type.STRING, description: 'Why searchers enter this query' },
            targetAudience: { type: Type.STRING, description: 'Who the searchers are' },
          },
          required: ['primaryIntent', 'explanation', 'targetAudience'],
        },
        primaryKeyword: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING, description: 'Primary target keyword' },
            estimatedCompetition: {
              type: Type.STRING,
              description: 'Low, Medium, or High',
            },
            rationale: { type: Type.STRING, description: 'Reason for primary choice' },
          },
          required: ['keyword', 'estimatedCompetition', 'rationale'],
        },
        secondaryKeywords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              relevance: { type: Type.STRING },
            },
            required: ['keyword', 'relevance'],
          },
          description: '6 to 10 secondary LSI keywords',
        },
        longTailKeywords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              userQueryContext: { type: Type.STRING },
            },
            required: ['keyword', 'userQueryContext'],
          },
          description: '6 to 8 long-tail queries',
        },
        questionKeywords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              intentType: { type: Type.STRING },
            },
            required: ['question', 'intentType'],
          },
          description: '6 to 10 user question queries',
        },
        summary: { type: Type.STRING, description: 'Strategic clustering summary' },
      },
      required: [
        'searchIntent',
        'primaryKeyword',
        'secondaryKeywords',
        'longTailKeywords',
        'questionKeywords',
      ],
    };

    logger.info(`Generating AI Keyword Cluster for: "${cleanTopic}"`, 'KeywordClusterService');

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
          logger.info(`Successfully generated keyword cluster using model: ${modelName}`, 'KeywordClusterService');
          break;
        }
      } catch (err: any) {
        lastError = err;
        logger.warn(`Model ${modelName} error in keyword cluster (${err?.message || 'unknown'}), trying fallback...`, 'KeywordClusterService');
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All candidate AI models were unable to generate the keyword cluster');
    }

    try {
      const parsed = JSON.parse(response.text.trim()) as KeywordClusterData;
      parsed.topic = cleanTopic;
      if (cleanService) {
        parsed.targetService = cleanService;
      }
      return parsed;
    } catch (parseErr) {
      logger.error('Failed to parse AI Keyword Cluster JSON', 'KeywordClusterService', parseErr);
      throw new Error('Failed to parse AI keyword cluster output');
    }
  }
}

export const keywordClusterService = new KeywordClusterService();
