import {
  BlogPost,
  BlogStats,
  BlogFilterOptions,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from '../types/blog';

/**
 * Public: Fetch published blog articles
 */
export async function fetchPublicBlogs(
  category?: string,
  search?: string
): Promise<BlogPost[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);

    const qs = params.toString();
    const res = await fetch(`/api/blogs${qs ? `?${qs}` : ''}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (err) {
    console.error('Error fetching public blogs:', err);
    return [];
  }
}

/**
 * Public: Fetch single blog by slug
 */
export async function fetchPublicBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (data && data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (err) {
    console.error('Error fetching public blog by slug:', err);
    return null;
  }
}

/**
 * Admin: Fetch all blogs with filters & stats
 */
export async function fetchAdminBlogs(filters: BlogFilterOptions = {}): Promise<{
  blogs: BlogPost[];
  total: number;
  stats: BlogStats;
}> {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.set('search', filters.search);
  if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);
  if (filters.category && filters.category !== 'all') queryParams.set('category', filters.category);
  if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
  if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);

  const qs = queryParams.toString();
  const url = `/api/admin/blogs${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success) {
    return {
      blogs: data.data || [],
      total: data.total || 0,
      stats: data.stats || { total: 0, published: 0, drafts: 0 },
    };
  }

  throw new Error(data?.error || 'Failed to load blogs');
}

/**
 * Admin: Create blog article
 */
export async function createBlogPost(input: CreateBlogPostInput): Promise<BlogPost> {
  const res = await fetch('/api/admin/blogs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to create article');
}

/**
 * Admin: Update blog article
 */
export async function updateBlogPost(
  id: string,
  input: UpdateBlogPostInput
): Promise<BlogPost> {
  const res = await fetch(`/api/admin/blogs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to update article');
}

/**
 * Admin: Toggle publication state
 */
export async function toggleBlogPublish(id: string): Promise<BlogPost> {
  const res = await fetch(`/api/admin/blogs/${encodeURIComponent(id)}/toggle-publish`, {
    method: 'PATCH',
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to update publication status');
}

/**
 * Admin: Delete blog article
 */
export async function deleteBlogPost(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/blogs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await res.json();
  return Boolean(res.ok && data && data.success);
}
