import {
  TestimonialItem,
  TestimonialStats,
  CreateTestimonialInput,
  UpdateTestimonialInput,
  TestimonialsResponse,
} from '../types/testimonial';

/**
 * Public: Fetch active testimonials for website rendering
 */
export async function fetchPublicTestimonials(): Promise<TestimonialItem[]> {
  try {
    const res = await fetch('/api/testimonials');
    if (!res.ok) return [];
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (err) {
    console.error('Error fetching public testimonials:', err);
    return [];
  }
}

export interface AdminTestimonialFilters {
  search?: string;
  status?: 'all' | 'published' | 'draft';
  hasVideo?: boolean;
  sortBy?: 'displayOrder' | 'createdAt' | 'clientName';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Admin: Fetch all testimonials with filters and metrics
 */
export async function fetchAdminTestimonials(
  filters: AdminTestimonialFilters = {}
): Promise<TestimonialsResponse> {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.set('search', filters.search);
  if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);
  if (filters.hasVideo) queryParams.set('hasVideo', 'true');
  if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
  if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);

  const qs = queryParams.toString();
  const url = `/api/admin/testimonials${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success) {
    return {
      testimonials: data.data || [],
      total: data.total || 0,
      stats: data.stats || { total: 0, published: 0, draft: 0, withVideo: 0 },
    };
  }

  throw new Error(data?.error || 'Failed to load testimonials');
}

/**
 * Admin: Create new testimonial
 */
export async function createTestimonial(input: CreateTestimonialInput): Promise<TestimonialItem> {
  const res = await fetch('/api/admin/testimonials', {
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
  throw new Error(data?.error || 'Failed to create testimonial');
}

/**
 * Admin: Update testimonial
 */
export async function updateTestimonial(
  id: string,
  input: UpdateTestimonialInput
): Promise<TestimonialItem> {
  const res = await fetch(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
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
  throw new Error(data?.error || 'Failed to update testimonial');
}

/**
 * Admin: Reorder testimonials
 */
export async function reorderTestimonials(
  orders: { id: string; displayOrder: number }[]
): Promise<boolean> {
  const res = await fetch('/api/admin/testimonials/reorder', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ orders }),
  });

  const data = await res.json();
  return Boolean(res.ok && data && data.success);
}

/**
 * Admin: Delete testimonial
 */
export async function deleteTestimonial(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = await res.json();
  return Boolean(res.ok && data && data.success);
}
