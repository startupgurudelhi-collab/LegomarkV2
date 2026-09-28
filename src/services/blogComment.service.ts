import {
  BlogComment,
  CreateBlogCommentInput,
  BlogCommentStats,
  BlogCommentFilterOptions,
} from '../types/blogComment';
import { CommentReplySuggestionsResult } from '../types/commentReply';

/**
 * Public: Fetch approved comments for a blog article
 */
export async function fetchPublicBlogComments(slug: string): Promise<BlogComment[]> {
  try {
    const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/comments`);
    if (!res.ok) return [];

    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (err) {
    console.error('Error fetching public blog comments:', err);
    return [];
  }
}

/**
 * Public: Submit a comment (submitted as Pending; never shown publicly until approved)
 */
export async function submitPublicBlogComment(
  slug: string,
  input: CreateBlogCommentInput
): Promise<{ success: boolean; message: string; data?: BlogComment }> {
  const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (res.ok && data && data.success) {
    return {
      success: true,
      message:
        data.message ||
        'Thank you! Your comment has been submitted and will appear once approved by our moderation team.',
      data: data.data,
    };
  }

  throw new Error(data?.error || 'Failed to submit comment. Please check required fields.');
}

/**
 * Admin: Fetch all comments with filter options & stats
 */
export async function fetchAdminBlogComments(
  options: BlogCommentFilterOptions = {}
): Promise<{ comments: BlogComment[]; stats: BlogCommentStats }> {
  const params = new URLSearchParams();
  if (options.status && options.status !== 'all') params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  if (options.blogSlug) params.set('blogSlug', options.blogSlug);

  const qs = params.toString();
  const res = await fetch(`/api/admin/blog-comments${qs ? `?${qs}` : ''}`, {
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to fetch admin blog comments');
}

/**
 * Admin: Update comment status (approve, reject, pending)
 */
export async function updateAdminBlogCommentStatus(
  id: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<BlogComment> {
  const res = await fetch(`/api/admin/blog-comments/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to update comment status');
}

/**
 * Admin: Reply to a comment
 */
export async function replyAdminBlogComment(
  id: string,
  reply: string
): Promise<BlogComment> {
  const res = await fetch(`/api/admin/blog-comments/${encodeURIComponent(id)}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ reply }),
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to save comment reply');
}

/**
 * Admin: Delete a comment
 */
export async function deleteAdminBlogComment(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/blog-comments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success) {
    return true;
  }

  throw new Error(data?.error || 'Failed to delete comment');
}

/**
 * Admin: Generate AI reply suggestions for a comment
 */
export async function fetchCommentReplySuggestions(
  commentId: string
): Promise<CommentReplySuggestionsResult> {
  const res = await fetch(`/api/admin/blog-comments/${encodeURIComponent(commentId)}/suggest-replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to generate reply suggestions');
}

