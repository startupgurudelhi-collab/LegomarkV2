import { GoogleGenAI, Type, Schema } from '@google/genai';
import { blogCommentRepository } from '../repositories/blog-comment.repository';
import { blogRepository } from '../repositories/blog.repository';
import { logger } from '../utils/logger';
import {
  CommentReplySuggestionsResult,
  CommentReplySuggestionItem,
} from '../../src/types/commentReply';

export class CommentReplyService {
  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  /**
   * Generates exactly 3 distinct AI reply suggestions for an admin moderating a blog comment:
   * 1. Authoritative Clarification (Statutory / procedural grounding)
   * 2. Consultative Next Steps (Actionable advisory guidance & consultation pathway)
   * 3. Concise & Appreciative (Succinct, courteous takeaway)
   */
  async generateReplySuggestions(commentId: string): Promise<CommentReplySuggestionsResult> {
    const cleanId = commentId?.trim();
    if (!cleanId) {
      throw new Error('Comment ID is required');
    }

    // 1. Fetch comment from repository
    let comment = typeof blogCommentRepository.getById === 'function'
      ? await blogCommentRepository.getById(cleanId)
      : null;

    if (!comment && typeof blogCommentRepository.getAdminComments === 'function') {
      const adminData = await blogCommentRepository.getAdminComments();
      comment = (adminData.comments || []).find((c) => c.id === cleanId) || null;
    }

    if (!comment) {
      throw new Error(`Comment with ID "${cleanId}" not found`);
    }

    // 2. Fetch parent blog context for grounding
    let parentBlogContext = '';
    let blogCategory = 'Corporate Legal & Statutory Advisory';
    try {
      const blog = await blogRepository.getPublicBlogBySlug(comment.blogSlug);
      if (blog) {
        blogCategory = blog.category || blogCategory;
        const cleanContentSample = (blog.content || '')
          .replace(/[#*`_\[\]()]/g, ' ')
          .slice(0, 1500)
          .trim();
        parentBlogContext = `
Parent Article Title: "${blog.title}"
Category: "${blogCategory}"
Summary / Content Sample:
${cleanContentSample}`;
      }
    } catch (e) {
      logger.warn(`Could not load full blog context for slug "${comment.blogSlug}"`, 'CommentReplyService');
      parentBlogContext = `Parent Article Title: "${comment.blogTitle}"\nCategory: "${blogCategory}"`;
    }

    const ai = this.getClient();

    // If Gemini client is unavailable, return safe deterministic template suggestions
    if (!ai) {
      logger.info('Gemini API key not found. Using structured statutory reply templates.', 'CommentReplyService');
      return this.buildFallbackSuggestions(comment, blogCategory);
    }

    const prompt = `You are a senior corporate attorney and lead compliance editor at LEGOMARK INDIA (legomarkindia.com), an authoritative corporate legal, taxation, trademark, and statutory advisory consultancy based in New Delhi, India.

A reader has left a public comment/inquiry on a LEGOMARK statutory guide. Draft exactly 3 distinct, professional reply suggestions for the admin to review, edit, and approve.

COMMENT DETAILS:
- Reader Name: "${comment.authorName}"
- Reader Comment:
"${comment.content}"

ARTICLE CONTEXT:
${parentBlogContext}

CRITICAL LEGAL & FACTUAL GUIDELINES:
1. Strict Factual Accuracy: Ground replies strictly in recognized Indian corporate law principles (e.g. Companies Act 2013, GST Law, Trade Marks Act 1999, Income Tax Act 1961).
2. DO NOT INVENT FACTS: Do NOT fabricate arbitrary deadlines, specific government filing fees, penalty amounts, or definitive legal conclusions that depend on private documents not provided.
3. INSUFFICIENT CONTEXT RULE: If the reader's question lacks essential corporate details (e.g. share capital, annual turnover, private company specifics, class of goods, or specific notices received), explicitly state that case-specific assessment requires examining the company's records and invite them to connect with the LEGOMARK advisory team.
4. Professional Demeanor: Address the reader respectfully by name (e.g., "Dear ${comment.authorName}," or "Hello ${comment.authorName},"). Maintain a courteous, authoritative, and helpful tone representing LEGOMARK INDIA.
5. NO AUTO-EXECUTION: These are drafts for an attorney/admin to edit before publishing.

REQUIRED 3 SUGGESTIONS:
1. authoritative:
   - label: "Authoritative Clarification"
   - badge: "Statutory Guidance"
   - summary: "Direct compliance logic citing applicable regulatory framework."
   - text: A detailed, fact-grounded explanation clarifying the procedural or statutory mechanism.
2. consultative:
   - label: "Consultative Next Steps"
   - badge: "Advisory Pathway"
   - summary: "Professional recommendations and structured advisory engagement."
   - text: Practical next steps outlining what the business should examine, inviting them to consult LEGOMARK for personalized filing or compliance support.
3. concise:
   - label: "Concise & Appreciative"
   - badge: "Quick Acknowledgment"
   - summary: "Brief, polite summary addressing the core question."
   - text: A crisp 2-3 sentence response thanking them and providing the essential high-level answer.`;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        authoritative: {
          type: Type.OBJECT,
          properties: {
            tone: { type: Type.STRING },
            label: { type: Type.STRING },
            badge: { type: Type.STRING },
            summary: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ['tone', 'label', 'badge', 'summary', 'text'],
        },
        consultative: {
          type: Type.OBJECT,
          properties: {
            tone: { type: Type.STRING },
            label: { type: Type.STRING },
            badge: { type: Type.STRING },
            summary: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ['tone', 'label', 'badge', 'summary', 'text'],
        },
        concise: {
          type: Type.OBJECT,
          properties: {
            tone: { type: Type.STRING },
            label: { type: Type.STRING },
            badge: { type: Type.STRING },
            summary: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ['tone', 'label', 'badge', 'summary', 'text'],
        },
      },
      required: ['authoritative', 'consultative', 'concise'],
    };

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.4,
          },
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          logger.info(`Successfully generated AI reply suggestions using model: ${modelName}`, 'CommentReplyService');
          return {
            commentId: comment.id,
            authorName: comment.authorName,
            blogTitle: comment.blogTitle,
            blogSlug: comment.blogSlug,
            suggestions: {
              authoritative: {
                tone: 'authoritative',
                label: parsed.authoritative?.label || 'Authoritative Clarification',
                badge: parsed.authoritative?.badge || 'Statutory Guidance',
                summary: parsed.authoritative?.summary || 'Direct statutory clarification.',
                text: parsed.authoritative?.text || '',
              },
              consultative: {
                tone: 'consultative',
                label: parsed.consultative?.label || 'Consultative Next Steps',
                badge: parsed.consultative?.badge || 'Advisory Pathway',
                summary: parsed.consultative?.summary || 'Actionable next steps and advisory routing.',
                text: parsed.consultative?.text || '',
              },
              concise: {
                tone: 'concise',
                label: parsed.concise?.label || 'Concise & Appreciative',
                badge: parsed.concise?.badge || 'Quick Acknowledgment',
                summary: parsed.concise?.summary || 'Brief polite acknowledgment.',
                text: parsed.concise?.text || '',
              },
            },
            generatedAt: new Date().toISOString(),
          };
        }
      } catch (err: any) {
        lastError = err;
        logger.warn(`Model ${modelName} failed to generate comment replies: ${err?.message || err}`, 'CommentReplyService');
      }
    }

    logger.error('All Gemini candidate models failed for comment reply generation, utilizing safe statutory fallback.', 'CommentReplyService', lastError);
    return this.buildFallbackSuggestions(comment, blogCategory);
  }

  /**
   * Deterministic fallback when AI is temporarily unreachable.
   * Ensures the admin always receives 3 high-quality, structured reply suggestions.
   */
  private buildFallbackSuggestions(
    comment: any,
    blogCategory: string
  ): CommentReplySuggestionsResult {
    const name = comment.authorName || 'Reader';
    const isQuestion = comment.content.includes('?') || /\b(how|what|when|where|which|why|cost|fee|penalty|can|is)\b/i.test(comment.content);

    let authoritativeText = `Dear ${name},\n\nThank you for reaching out regarding "${comment.blogTitle}". Under applicable Indian statutory provisions in ${blogCategory}, compliance requirements must be evaluated against your entity's specific charter and filing dates. For standardized statutory procedures, filing forms with verified documentation must be submitted through the designated central portal. Please ensure all supporting board resolutions and financial records are reviewed before submission.\n\nWarm regards,\nLEGOMARK INDIA Editorial & Advisory Board`;

    let consultativeText = `Hello ${name},\n\nThank you for engaging with our guide on ${comment.blogTitle}. While standard statutory requirements apply generally across ${blogCategory}, determining the exact filing strategy or resolving procedural notices depends on company-specific circumstances. We recommend scheduling a preliminary advisory session with our corporate legal desk at info@legomarkindia.com so our legal specialists can examine your details and advise on the most compliant route.\n\nBest regards,\nCorporate Advisory Desk | LEGOMARK INDIA`;

    let conciseText = `Dear ${name},\n\nThank you for reading our guide and sharing your feedback. We appreciate your query regarding ${comment.blogTitle} and are pleased to provide guidance on Indian corporate and statutory compliance. Feel free to contact our advisory team if you need further procedural assistance.\n\nWarm regards,\nLEGOMARK INDIA Team`;

    if (!isQuestion) {
      authoritativeText = `Dear ${name},\n\nThank you for your valuable perspective on "${comment.blogTitle}". Our statutory editorial board regularly updates these corporate guides in alignment with recent notifications and judicial precedents. We appreciate you engaging with LEGOMARK INDIA.\n\nWarm regards,\nLEGOMARK INDIA Advisory Board`;
      consultativeText = `Hello ${name},\n\nThank you for reading our article on ${comment.blogTitle}. Constructive feedback from entrepreneurs and practitioners helps us keep our statutory resources comprehensive. Should your organization require tailored advisory in ${blogCategory}, our advisory desk is available to assist.\n\nBest regards,\nLEGOMARK INDIA Team`;
      conciseText = `Dear ${name},\n\nThank you for your feedback on our article! We are glad you found the insights useful. Stay connected for further statutory and compliance updates.\n\nWarm regards,\nLEGOMARK INDIA`;
    }

    return {
      commentId: comment.id,
      authorName: comment.authorName,
      blogTitle: comment.blogTitle,
      blogSlug: comment.blogSlug,
      suggestions: {
        authoritative: {
          tone: 'authoritative',
          label: 'Authoritative Clarification',
          badge: 'Statutory Guidance',
          summary: 'Direct compliance logic based on statutory framework.',
          text: authoritativeText,
        },
        consultative: {
          tone: 'consultative',
          label: 'Consultative Next Steps',
          badge: 'Advisory Pathway',
          summary: 'Professional recommendations and advisory contact routing.',
          text: consultativeText,
        },
        concise: {
          tone: 'concise',
          label: 'Concise & Appreciative',
          badge: 'Quick Acknowledgment',
          summary: 'Brief, courteous acknowledgment and assistance note.',
          text: conciseText,
        },
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

export const commentReplyService = new CommentReplyService();
