import { LeadItem, LeadStats, LeadFilters, PublicConsultationPayload, LeadStatus } from '../types/lead';

export interface AdminLeadsResponse {
  success: boolean;
  data: LeadItem[];
  total: number;
  stats: LeadStats;
  error?: string;
}

export interface AdminLeadSingleResponse {
  success: boolean;
  data: LeadItem;
  message?: string;
  error?: string;
}

export interface AdminLeadStatsResponse {
  success: boolean;
  data: LeadStats;
  error?: string;
}

export class LeadApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'LeadApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Public Consultation Submission
 * Called when a visitor submits a consultation request from anywhere on the website
 */
export async function submitPublicConsultation(payload: PublicConsultationPayload): Promise<{ success: boolean; message: string; lead?: any }> {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new LeadApiError(data.error || 'Failed to submit consultation request.', response.status);
  }

  return data;
}

/**
 * Admin: Fetch leads list with filtering and search
 */
export async function fetchAdminLeads(filters: LeadFilters = {}): Promise<{ leads: LeadItem[]; total: number; stats: LeadStats }> {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.service && filters.service !== 'all') params.append('service', filters.service);
  if (filters.dateRange && filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const url = `/api/admin/leads${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new LeadApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new LeadApiError('You do not have permission to view leads.', 403);
  }

  const data: AdminLeadsResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new LeadApiError(data.error || 'Failed to retrieve leads.', response.status);
  }

  return {
    leads: data.data || [],
    total: data.total || 0,
    stats: data.stats || { total: 0, new: 0, contacted: 0, inProgress: 0, converted: 0, closed: 0 },
  };
}

/**
 * Admin: Fetch aggregate statistics
 */
export async function fetchAdminLeadStats(): Promise<LeadStats> {
  const response = await fetch('/api/admin/leads/stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new LeadApiError('Your session has expired. Please sign in again.', 401);
  }

  const data: AdminLeadStatsResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new LeadApiError(data.error || 'Failed to retrieve lead statistics.', response.status);
  }

  return data.data;
}

/**
 * Admin: Fetch single lead by ID
 */
export async function fetchAdminLeadById(id: string): Promise<LeadItem> {
  const response = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new LeadApiError('Your session has expired. Please sign in again.', 401);
  }

  const data: AdminLeadSingleResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new LeadApiError(data.error || 'Failed to retrieve lead details.', response.status);
  }

  return data.data;
}

/**
 * Admin: Update lead workflow status
 */
export async function updateAdminLeadStatus(id: string, status: LeadStatus): Promise<LeadItem> {
  const response = await fetch(`/api/admin/leads/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  if (response.status === 401) {
    throw new LeadApiError('Your session has expired. Please sign in again.', 401);
  }

  const data: AdminLeadSingleResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new LeadApiError(data.error || 'Failed to update lead status.', response.status);
  }

  return data.data;
}

/**
 * Admin: Update internal notes
 */
export async function updateAdminLeadNotes(id: string, notes: string): Promise<LeadItem> {
  const response = await fetch(`/api/admin/leads/${encodeURIComponent(id)}/notes`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ notes }),
  });

  if (response.status === 401) {
    throw new LeadApiError('Your session has expired. Please sign in again.', 401);
  }

  const data: AdminLeadSingleResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new LeadApiError(data.error || 'Failed to update admin notes.', response.status);
  }

  return data.data;
}

/**
 * Admin: Delete a lead record
 */
export async function deleteAdminLead(id: string): Promise<void> {
  const response = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new LeadApiError('Your session has expired. Please sign in again.', 401);
  }

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new LeadApiError(data.error || 'Failed to delete lead record.', response.status);
  }
}
