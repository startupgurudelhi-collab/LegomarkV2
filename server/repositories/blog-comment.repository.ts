import { getDatabase } from '../config/database';
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

export class BlogCommentRepository {
  /**
   * Public: Fetch approved comments for a specific blog slug directly from PostgreSQL.
   * Pending or rejected comments must never appear publicly.
   */
  async getApprovedByBlogSlug(blogSlug: string): Promise<BlogComment[]> {
    const cleanSlug = blogSlug?.trim();
    if (!cleanSlug) return [];

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
      logger.error(
        `Error querying approved comments from PostgreSQL for slug: ${cleanSlug}`,
        'BlogCommentRepo',
        err
      );
      throw err;
    }
  }

  /**
   * Admin: Fetch all comments with status filters, search, and stats from PostgreSQL.
   */
  async getAdminComments(options: BlogCommentFilterOptions = {}): Promise<{
    comments: BlogComment[];
    stats: BlogCommentStats;
  }> {
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
      logger.error('Error querying admin comments from PostgreSQL', 'BlogCommentRepo', err);
      throw err;
    }
  }

  /**
   * Public: Create a new comment directly in PostgreSQL. ALWAYS submitted as 'pending'.
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

    try {
      const db = getDatabase();
      const [inserted] = await db.insert(blogComments).values(newCommentData).returning();
      if (!inserted) {
        throw new Error('Failed to insert blog comment into PostgreSQL');
      }
      return inserted;
    } catch (err) {
      logger.error('Error inserting comment into PostgreSQL', 'BlogCommentRepo', err);
      throw err;
    }
  }

  /**
   * Admin: Update comment status (approved, rejected, pending) directly in PostgreSQL.
   */
  async updateStatus(
    id: string,
    status: 'approved' | 'rejected' | 'pending'
  ): Promise<BlogComment | null> {
    try {
      const db = getDatabase();
      const [updated] = await db
        .update(blogComments)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(blogComments.id, id))
        .returning();

      return updated || null;
    } catch (err) {
      logger.error(
        `Error updating comment status in PostgreSQL for id ${id}`,
        'BlogCommentRepo',
        err
      );
      throw err;
    }
  }

  /**
   * Admin: Reply to a specific comment in PostgreSQL.
   */
  async addReply(
    id: string,
    reply: string,
    adminUser = 'LEGOMARK Team'
  ): Promise<BlogComment | null> {
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
        .where(eq(blogComments.id, id))
        .returning();

      return updated || null;
    } catch (err) {
      logger.error(`Error adding reply in PostgreSQL for comment id ${id}`, 'BlogCommentRepo', err);
      throw err;
    }
  }

  /**
   * Admin: Delete a comment directly in PostgreSQL.
   */
  async deleteComment(id: string): Promise<boolean> {
    try {
      const db = getDatabase();
      const res = await db.delete(blogComments).where(eq(blogComments.id, id)).returning();
      return res.length > 0;
    } catch (err) {
      logger.error(`Error deleting comment from PostgreSQL for id ${id}`, 'BlogCommentRepo', err);
      throw err;
    }
  }
}

export const blogCommentRepository = new BlogCommentRepository();
