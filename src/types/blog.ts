export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  content: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  seoSlug?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface BlogStats {
  total: number;
  published: number;
  drafts: number;
}

export interface BlogFilterOptions {
  search?: string;
  status?: 'all' | 'published' | 'draft';
  category?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBlogPostInput {
  title: string;
  slug?: string;
  category: string;
  author?: string;
  content: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  seoSlug?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  category?: string;
  author?: string;
  content?: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  seoSlug?: string | null;
  isPublished?: boolean;
  publishedAt?: string | null;
}
