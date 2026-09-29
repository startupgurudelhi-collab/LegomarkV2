import crypto from 'crypto';
import { getDatabase, pingDatabase } from '../config/database';
import { blogComments, BlogComment, NewBlogComment } from '../../db/schema/index';
import { eq, desc, asc, ilike, or, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface BlogCommentFilterOptions {
  status?: string;
  search?: string;
  blogSlug?: string;
}

export interface BlogCommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface CreateCommentInput {
  blogId?: string;
  blogSlug: string;
  blogTitle: string;
  authorName: string;
  authorEmail?: string;
  content: string;
}

const INITIAL_COMMENTS: BlogComment[] = [
  {
    id: 'c1a2c3d4-0001-4000-8000-000000000001',
    blogId: 'b1a2c3d4-0001-4000-8000-000000000001',
    blogSlug: 'annual-roc-compliance-checklist-private-limited-companies',
    blogTitle: 'Annual ROC Compliance Checklist for Private Limited Companies',
    authorName: 'Sunil Sharma',
    authorEmail: 'sunil@example.com',
    content: 'Is this annual checklist also applicable to a newly incorporated company in its first financial year?',
    status: 'pending',
    adminReply: null,
    adminRepliedAt: null,
    adminRepliedBy: null,
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  },
  {
    id: 'c1a2c3d4-0002-4000-8000-000000000002',
    blogId: 'b1a2c3d4-0001-4000-8000-000000000001',
    blogSlug: 'annual-roc-compliance-checklist-private-limited-companies',
    blogTitle: 'Annual ROC Compliance Checklist for Private Limited Companies',
    authorName: 'Advocate Meenakshi Iyer',
    authorEmail: 'meenakshi@lawfirm.in',
    content: 'Under Section 137 of the Companies Act 2013, what is the exact timeline for filing Form AOC-4 following an adjourned AGM?',
    status: 'approved',
    adminReply: 'Dear Advocate Meenakshi, under Section 137(1) third proviso, where the AGM for any year has not been held, the financial statements along with the reasons for not holding the AGM shall be filed with the Registrar within thirty days of the last day before which the AGM ought to have been held.',
    adminRepliedAt: new Date('2026-03-02T12:00:00.000Z'),
    adminRepliedBy: 'LEGOMARK Team',
    createdAt: new Date('2026-03-02T10:00:00.000Z'),
    updatedAt: new Date('2026-03-02T12:00:00.000Z'),
  },
];

export class BlogCommentRepository {
  private fallbackStore: BlogComment[] = [...INITIAL_COMMENTS];

  /**
   * Public: Fetch approved comments for a specific blog slug.
   * Pending or rejected comments must never appear publicly.
   */
  async getApprovedByBlogSlug(blogSlug: string): Promise<BlogComment[]> {
    const cleanSlug = blogSlug?.trim();
    if (!cleanSlug) return [];

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const records = await db
          .select()
          .from(blogComments)
          .where(
            and(
              eq(blogComments.blogSlug, cleanSlug),
              eq(blogComments.status, 'approved')
            )
          )
          .orderBy(asc(blogComments.createdAt));

        return records || [];
      } catch (err) {
        logger.warn(
          `Error querying approved comments from PostgreSQL for slug: ${cleanSlug}, using memory fallback`,
          'BlogCommentRepo'
        );
      }
    }

    return this.fallbackStore
      .filter((c) => c.blogSlug === cleanSlug && c.status === 'approved')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Fetch a single comment by ID.
   */
  async getById(id: string): Promise<BlogComment | null> {
    const cleanId = id?.trim();
    if (!cleanId) return null;

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const [record] = await db
          .select()
          .from(blogComments)
          .where(eq(blogComments.id, cleanId))
          .limit(1);

        if (record) return record;
      } catch (err) {
        logger.warn(`Error querying comment by id ${cleanId} from PostgreSQL, using memory fallback`, 'BlogCommentRepo');
      }
    }

    return this.fallbackStore.find((c) => c.id === cleanId) || null;
  }

  /**
   * Admin: Fetch all comments with status filters, search, and stats.
   */
  async getAdminComments(options: BlogCommentFilterOptions = {}): Promise<{
    comments: BlogComment[];
    stats: BlogCommentStats;
  }> {
    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();

        // Build filter conditions
        const conditions = [];

        if (options.status && options.status !== 'all') {
          conditions.push(eq(blogComments.status, options.status));
        }

        if (options.blogSlug) {
          conditions.push(eq(blogComments.blogSlug, options.blogSlug));
        }

        if (options.search && options.search.trim().length > 0) {
          const pattern = `%${options.search.trim()}%`;
          conditions.push(
            or(
              ilike(blogComments.authorName, pattern),
              ilike(blogComments.authorEmail, pattern),
              ilike(blogComments.content, pattern),
              ilike(blogComments.blogTitle, pattern),
              ilike(blogComments.blogSlug, pattern)
            )
          );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [comments, allForStats] = await Promise.all([
          db
            .select()
            .from(blogComments)
            .where(whereClause)
            .orderBy(desc(blogComments.createdAt)),
          db.select({ status: blogComments.status }).from(blogComments),
        ]);

        const stats: BlogCommentStats = {
          total: allForStats.length,
          pending: allForStats.filter((c) => c.status === 'pending').length,
          approved: allForStats.filter((c) => c.status === 'approved').length,
          rejected: allForStats.filter((c) => c.status === 'rejected').length,
        };

        return { comments: comments || [], stats };
      } catch (err) {
        logger.warn('Error querying admin comments from PostgreSQL, using memory fallback', 'BlogCommentRepo');
      }
    }

    // Memory fallback
    let list = [...this.fallbackStore];
    if (options.status && options.status !== 'all') {
      list = list.filter((c) => c.status === options.status);
    }
    if (options.blogSlug) {
      list = list.filter((c) => c.blogSlug === options.blogSlug);
    }
    if (options.search && options.search.trim().length > 0) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.authorName.toLowerCase().includes(q) ||
          (c.authorEmail && c.authorEmail.toLowerCase().includes(q)) ||
          c.content.toLowerCase().includes(q) ||
          c.blogTitle.toLowerCase().includes(q) ||
          c.blogSlug.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const stats: BlogCommentStats = {
      total: this.fallbackStore.length,
      pending: this.fallbackStore.filter((c) => c.status === 'pending').length,
      approved: this.fallbackStore.filter((c) => c.status === 'approved').length,
      rejected: this.fallbackStore.filter((c) => c.status === 'rejected').length,
    };

    return { comments: list, stats };
  }

  /**
   * Public: Create a new comment. ALWAYS submitted as 'pending'.
   */
  async createComment(input: CreateCommentInput): Promise<BlogComment> {
    const newCommentData: NewBlogComment = {
      blogId: input.blogId || null,
      blogSlug: input.blogSlug.trim(),
      blogTitle: input.blogTitle.trim(),
      authorName: input.authorName.trim(),
      authorEmail: input.authorEmail?.trim() || null,
      content: input.content.trim(),
      status: 'pending',
    };

    const fallbackRecord: BlogComment = {
      id: crypto.randomUUID(),
      blogId: input.blogId || null,
      blogSlug: input.blogSlug.trim(),
      blogTitle: input.blogTitle.trim(),
      authorName: input.authorName.trim(),
      authorEmail: input.authorEmail?.trim() || null,
      content: input.content.trim(),
      status: 'pending',
      adminReply: null,
      adminRepliedAt: null,
      adminRepliedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const [inserted] = await db.insert(blogComments).values(newCommentData).returning();
        if (inserted) {
          this.fallbackStore.unshift(inserted);
          return inserted;
        }
      } catch (err) {
        logger.warn('Error inserting comment into PostgreSQL, saving to memory fallback', 'BlogCommentRepo');
      }
    }

    this.fallbackStore.unshift(fallbackRecord);
    return fallbackRecord;
  }

  /**
   * Admin: Update comment status (approved, rejected, pending).
   */
  async updateStatus(
    id: string,
    status: 'approved' | 'rejected' | 'pending'
  ): Promise<BlogComment | null> {
    const cleanId = id?.trim();
    if (!cleanId) return null;

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const [updated] = await db
          .update(blogComments)
          .set({
            status,
            updatedAt: new Date(),
          })
          .where(eq(blogComments.id, cleanId))
          .returning();

        if (updated) {
          const idx = this.fallbackStore.findIndex((c) => c.id === cleanId);
          if (idx >= 0) this.fallbackStore[idx] = updated;
          return updated;
        }
      } catch (err) {
        logger.warn(`Error updating comment status in PostgreSQL for id ${cleanId}, updating memory fallback`, 'BlogCommentRepo');
      }
    }

    const idx = this.fallbackStore.findIndex((c) => c.id === cleanId);
    if (idx >= 0) {
      this.fallbackStore[idx] = {
        ...this.fallbackStore[idx],
        status,
        updatedAt: new Date(),
      };
      return this.fallbackStore[idx];
    }

    return null;
  }

  /**
   * Admin: Reply to a specific comment.
   */
  async addReply(
    id: string,
    reply: string,
    adminUser = 'LEGOMARK Team'
  ): Promise<BlogComment | null> {
    const cleanId = id?.trim();
    if (!cleanId) return null;

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const [updated] = await db
          .update(blogComments)
          .set({
            adminReply: reply.trim(),
            adminRepliedAt: new Date(),
            adminRepliedBy: adminUser,
            updatedAt: new Date(),
          })
          .where(eq(blogComments.id, cleanId))
          .returning();

        if (updated) {
          const idx = this.fallbackStore.findIndex((c) => c.id === cleanId);
          if (idx >= 0) this.fallbackStore[idx] = updated;
          return updated;
        }
      } catch (err) {
        logger.warn(`Error adding reply in PostgreSQL for comment id ${cleanId}, updating memory fallback`, 'BlogCommentRepo');
      }
    }

    const idx = this.fallbackStore.findIndex((c) => c.id === cleanId);
    if (idx >= 0) {
      this.fallbackStore[idx] = {
        ...this.fallbackStore[idx],
        adminReply: reply.trim(),
        adminRepliedAt: new Date(),
        adminRepliedBy: adminUser,
        updatedAt: new Date(),
      };
      return this.fallbackStore[idx];
    }

    return null;
  }

  /**
   * Admin: Delete a comment.
   */
  async deleteComment(id: string): Promise<boolean> {
    const cleanId = id?.trim();
    if (!cleanId) return false;

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const res = await db.delete(blogComments).where(eq(blogComments.id, cleanId)).returning();
        if (res.length > 0) {
          this.fallbackStore = this.fallbackStore.filter((c) => c.id !== cleanId);
          return true;
        }
      } catch (err) {
        logger.warn(`Error deleting comment from PostgreSQL for id ${cleanId}, removing from memory fallback`, 'BlogCommentRepo');
      }
    }

    const initialLen = this.fallbackStore.length;
    this.fallbackStore = this.fallbackStore.filter((c) => c.id !== cleanId);
    return this.fallbackStore.length < initialLen;
  }
}

export const blogCommentRepository = new BlogCommentRepository();
