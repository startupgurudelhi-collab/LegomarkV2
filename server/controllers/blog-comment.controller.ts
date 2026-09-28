import { Request, Response } from 'express';
import { blogCommentRepository } from '../repositories/blog-comment.repository';
import { blogRepository } from '../repositories/blog.repository';
import { commentReplyService } from '../services/comment-reply.service';
import { logger } from '../utils/logger';

export class BlogCommentController {
  /**
   * Public: Get only approved comments for a blog article
   */
  async getApprovedComments(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug?.trim();
      if (!slug) {
        res.status(400).json({ success: false, error: 'Blog slug is required' });
        return;
      }

      const comments = await blogCommentRepository.getApprovedByBlogSlug(slug);

      res.json({
        success: true,
        data: comments,
      });
    } catch (err: any) {
      logger.error('Error in getApprovedComments', 'BlogCommentCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch blog comments',
      });
    }
  }

  /**
   * Public: Submit a comment (ALWAYS saved as pending)
   */
  async createPublicComment(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug?.trim();
      if (!slug) {
        res.status(400).json({ success: false, error: 'Blog slug is required' });
        return;
      }

      const { authorName, authorEmail, content } = req.body;

      if (!authorName || typeof authorName !== 'string' || authorName.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Your name is required' });
        return;
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Comment message is required' });
        return;
      }

      if (content.trim().length < 3) {
        res.status(400).json({ success: false, error: 'Comment message must be at least 3 characters' });
        return;
      }

      if (content.trim().length > 2000) {
        res.status(400).json({ success: false, error: 'Comment message cannot exceed 2000 characters' });
        return;
      }

      // Lookup blog to fetch proper title & id
      let blogTitle = slug;
      let blogId: string | undefined;

      try {
        const blog = await blogRepository.getPublicBlogBySlug(slug);
        if (blog) {
          blogTitle = blog.title;
          blogId = blog.id;
        }
      } catch (e) {
        logger.warn(`Could not lookup blog title for comment submission on slug: ${slug}`, 'BlogCommentCtrl');
      }

      const comment = await blogCommentRepository.createComment({
        blogId,
        blogSlug: slug,
        blogTitle,
        authorName: authorName.trim(),
        authorEmail: typeof authorEmail === 'string' ? authorEmail.trim() : undefined,
        content: content.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Thank you! Your comment has been submitted and will appear once approved by our moderation team.',
        data: comment,
      });
    } catch (err: any) {
      logger.error('Error in createPublicComment', 'BlogCommentCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to submit comment. Please try again.',
      });
    }
  }

  /**
   * Admin: Get all comments with filtering & moderation stats
   */
  async getAdminComments(req: Request, res: Response): Promise<void> {
    try {
      const { status, search, blogSlug } = req.query;

      const result = await blogCommentRepository.getAdminComments({
        status: typeof status === 'string' ? status : undefined,
        search: typeof search === 'string' ? search : undefined,
        blogSlug: typeof blogSlug === 'string' ? blogSlug : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error('Error in getAdminComments', 'BlogCommentCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve comments for moderation',
      });
    }
  }

  /**
   * Admin: Approve, Reject, or mark Pending
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const { status } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'Comment ID is required' });
        return;
      }

      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Valid status ("approved", "rejected", "pending") is required',
        });
        return;
      }

      const updated = await blogCommentRepository.updateStatus(id, status);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Comment not found' });
        return;
      }

      res.json({
        success: true,
        message: `Comment status updated to ${status}`,
        data: updated,
      });
    } catch (err: any) {
      logger.error('Error in updateStatus', 'BlogCommentCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to update comment status',
      });
    }
  }

  /**
   * Admin: Reply to a specific comment
   */
  async replyComment(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const { reply } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'Comment ID is required' });
        return;
      }

      if (!reply || typeof reply !== 'string' || reply.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Reply text is required' });
        return;
      }

      const adminUser = (req as any).user?.username || 'LEGOMARK Team';
      const updated = await blogCommentRepository.addReply(id, reply.trim(), adminUser);

      if (!updated) {
        res.status(404).json({ success: false, error: 'Comment not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Reply saved successfully',
        data: updated,
      });
    } catch (err: any) {
      logger.error('Error in replyComment', 'BlogCommentCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to save reply',
      });
    }
  }

  /**
   * Admin: Delete comment
   */
  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ success: false, error: 'Comment ID is required' });
        return;
      }

      const success = await blogCommentRepository.deleteComment(id);
      if (!success) {
        res.status(404).json({ success: false, error: 'Comment not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (err: any) {
      logger.error('Error in deleteComment', 'BlogCommentCtrl', err);
      res.status(500).json({
        success: false,
        error: 'Failed to delete comment',
      });
    }
  }

  /**
   * Admin: Generate AI reply suggestions for a specific comment
   * POST /api/admin/blog-comments/:id/suggest-replies
   */
  async suggestReplies(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ success: false, error: 'Comment ID is required' });
        return;
      }

      const suggestions = await commentReplyService.generateReplySuggestions(id);
      res.json({
        success: true,
        data: suggestions,
      });
    } catch (err: any) {
      logger.error('Error in suggestReplies', 'BlogCommentCtrl', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate reply suggestions',
      });
    }
  }
}

export const blogCommentController = new BlogCommentController();
