import { GoogleGenAI, Type, Schema } from '@google/genai';
import { logger } from '../utils/logger';

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
}

export class AiBlogService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    return new GoogleGenAI({ apiKey });
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.7,
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error('Gemini API returned an empty response');
    }

    try {
      const parsed = JSON.parse(rawText) as GeneratedBlogDraft;
      return parsed;
    } catch (parseErr) {
      logger.error('Failed to parse AI blog JSON', 'AiBlogService', parseErr);
      throw new Error('Failed to parse AI generated blog response structure');
    }
  }
}

export const aiBlogService = new AiBlogService();
