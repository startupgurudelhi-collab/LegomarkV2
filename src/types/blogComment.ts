export interface BlogComment {
  id: string;
  blogId?: string | null;
  blogSlug: string;
  blogTitle: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string | null;
  adminRepliedAt?: string | null;
  adminRepliedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogCommentInput {
  authorName: string;
  authorEmail?: string;
  content: string;
}

export interface BlogCommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface BlogCommentFilterOptions {
  status?: string;
  search?: string;
  blogSlug?: string;
}
