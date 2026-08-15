import { AdminApiError } from './adminPackage.service';

export interface AdminFounderProfile {
  id: string;
  name: string;
  designation: string;
  organization: string;
  photoUrl: string | null;
  description: string;
  quote: string | null;
  coreAreas: string[];
  isActive: boolean;
  updatedAt?: string;
}

export interface AdminOfficeProfile {
  id: string;
  name: string;
  premisesPhotoUrl: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  fullAddress: string;
  mobile: string;
  mobileRaw: string;
  landline: string;
  landlineRaw: string;
  email: string;
  officeHours: string;
  websites: string[];
  primaryWebsite: string;
  checklist: string[];
  mapEmbedUrl: string | null;
  isActive: boolean;
  updatedAt?: string;
}

/**
 * Fetch founder profile for admin
 */
export async function fetchAdminFounder(): Promise<AdminFounderProfile> {
  const response = await fetch('/api/admin/founder', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }
  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to manage founder profile.', 403);
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to load founder profile.', response.status);
  }

  return data.data;
}

/**
 * Update founder profile
 */
export async function updateAdminFounder(payload: Partial<AdminFounderProfile>): Promise<AdminFounderProfile> {
  const response = await fetch('/api/admin/founder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }
  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to update founder profile.', 403);
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to update founder profile.', response.status);
  }

  return data.data;
}

/**
 * Fetch office profile for admin
 */
export async function fetchAdminOffice(): Promise<AdminOfficeProfile> {
  const response = await fetch('/api/admin/office', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }
  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to manage office profile.', 403);
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to load office profile.', response.status);
  }

  return data.data;
}

/**
 * Update office profile
 */
export async function updateAdminOffice(payload: Partial<AdminOfficeProfile>): Promise<AdminOfficeProfile> {
  const response = await fetch('/api/admin/office', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }
  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to update office profile.', 403);
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to update office profile.', response.status);
  }

  return data.data;
}
