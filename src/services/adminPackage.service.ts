import { AdminPackage, PackageFormData, ReorderItem } from '../types/admin';

export interface AdminPackagesResponse {
  success: boolean;
  count?: number;
  data?: AdminPackage[];
  error?: string;
}

export interface AdminSinglePackageResponse {
  success: boolean;
  message?: string;
  data?: AdminPackage;
  error?: string;
}

export class AdminApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AdminApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Fetch all packages (active & inactive) from the database via admin API
 */
export async function fetchAdminPackages(): Promise<AdminPackage[]> {
  const response = await fetch('/api/admin/packages', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to manage packages.', 403);
  }

  const data: AdminPackagesResponse = await response.json();

  if (!response.ok || !data.success || !Array.isArray(data.data)) {
    throw new AdminApiError(data.error || 'Failed to load packages from database.', response.status);
  }

  return data.data;
}

/**
 * Create a new package with features in a single atomic transaction
 */
export async function createAdminPackage(payload: PackageFormData): Promise<AdminPackage> {
  const response = await fetch('/api/admin/packages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      id: (payload.id ?? '').trim(),
      name: (payload.name ?? '').trim(),
      tagline: (payload.tagline ?? '').trim() || null,
      priceAmount: String(payload.priceAmount ?? '').trim(),
      currency: (payload.currency ?? '').trim() || 'INR',
      billingType: payload.billingType,
      priceDisplayOverride: (payload.priceDisplayOverride ?? '').trim() || null,
      idealFor: (payload.idealFor ?? '').trim(),
      popular: Boolean(payload.popular),
      badge: (payload.badge ?? '').trim() || null,
      isActive: Boolean(payload.isActive),
      displayOrder: Number(payload.displayOrder) || 0,
      features: (payload.features || []).map((f, idx) => ({
        featureText: (f.featureText ?? '').trim(),
        displayOrder: idx,
      })),
    }),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to create packages.', 403);
  }

  const data: AdminSinglePackageResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new AdminApiError(data.error || 'Failed to create package.', response.status);
  }

  return data.data;
}

/**
 * Update an existing package and replace its features
 */
export async function updateAdminPackage(id: string, payload: PackageFormData): Promise<AdminPackage> {
  const response = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: (payload.name ?? '').trim(),
      tagline: (payload.tagline ?? '').trim() || null,
      priceAmount: String(payload.priceAmount ?? '').trim(),
      currency: (payload.currency ?? '').trim() || 'INR',
      billingType: payload.billingType,
      priceDisplayOverride: (payload.priceDisplayOverride ?? '').trim() || null,
      idealFor: (payload.idealFor ?? '').trim(),
      popular: Boolean(payload.popular),
      badge: (payload.badge ?? '').trim() || null,
      isActive: Boolean(payload.isActive),
      displayOrder: Number(payload.displayOrder) || 0,
      features: (payload.features || []).map((f, idx) => ({
        featureText: (f.featureText ?? '').trim(),
        displayOrder: idx,
      })),
    }),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to update packages.', 403);
  }

  const data: AdminSinglePackageResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new AdminApiError(data.error || 'Failed to update package.', response.status);
  }

  return data.data;
}

/**
 * Quick toggle package active/inactive status
 */
export async function toggleAdminPackageStatus(id: string, isActive: boolean): Promise<AdminPackage> {
  const response = await fetch(`/api/admin/packages/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ isActive }),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to modify package status.', 403);
  }

  const data: AdminSinglePackageResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new AdminApiError(data.error || 'Failed to update status.', response.status);
  }

  return data.data;
}

/**
 * Reorder packages in bulk and persist displayOrder to PostgreSQL
 */
export async function reorderAdminPackages(items: ReorderItem[]): Promise<AdminPackage[]> {
  const response = await fetch('/api/admin/packages/reorder', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ items }),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to reorder packages.', 403);
  }

  const data: AdminPackagesResponse = await response.json();

  if (!response.ok || !data.success || !Array.isArray(data.data)) {
    throw new AdminApiError(data.error || 'Failed to reorder packages.', response.status);
  }

  return data.data;
}

/**
 * Delete a package and cascade delete its feature items
 */
export async function deleteAdminPackage(id: string): Promise<void> {
  const response = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to delete packages.', 403);
  }

  const data: { success: boolean; error?: string } = await response.json();

  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to delete package.', response.status);
  }
}

// ==========================================
// Service-Scoped Package API Client Methods
// ==========================================

/**
 * Fetch all packages configured for a specific service (with service-specific overrides and deliverables)
 */
export async function fetchAdminServicePackages(serviceId: string): Promise<AdminPackage[]> {
  const response = await fetch(`/api/admin/services/${encodeURIComponent(serviceId)}/packages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to view service packages.', 403);
  }

  const data: AdminPackagesResponse = await response.json();

  if (!response.ok || !data.success || !Array.isArray(data.data)) {
    throw new AdminApiError(data.error || 'Failed to load service packages.', response.status);
  }

  return data.data;
}

/**
 * Update package configuration & deliverables for a specific service ONLY (does NOT affect other services or global template)
 */
export async function updateAdminServicePackage(
  serviceId: string,
  packageId: string,
  payload: PackageFormData
): Promise<AdminPackage> {
  const response = await fetch(
    `/api/admin/services/${encodeURIComponent(serviceId)}/packages/${encodeURIComponent(packageId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        id: (payload.id ?? '').trim(),
        name: (payload.name ?? '').trim(),
        tagline: (payload.tagline ?? '').trim() || null,
        priceAmount: String(payload.priceAmount ?? '').trim(),
        currency: (payload.currency ?? '').trim() || 'INR',
        billingType: payload.billingType,
        priceDisplayOverride: (payload.priceDisplayOverride ?? '').trim() || null,
        idealFor: (payload.idealFor ?? '').trim(),
        popular: Boolean(payload.popular),
        badge: (payload.badge ?? '').trim() || null,
        isActive: Boolean(payload.isActive),
        displayOrder: Number(payload.displayOrder) || 0,
        features: (payload.features || []).map((f, idx) => ({
          featureText: (f.featureText ?? '').trim(),
          displayOrder: idx,
        })),
      }),
    }
  );

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to update service packages.', 403);
  }

  const data: AdminSinglePackageResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new AdminApiError(data.error || 'Failed to update service package.', response.status);
  }

  return data.data;
}

/**
 * Assign or create a package under a specific service
 */
export async function createOrAssignAdminServicePackage(
  serviceId: string,
  payload: PackageFormData
): Promise<AdminPackage> {
  const response = await fetch(`/api/admin/services/${encodeURIComponent(serviceId)}/packages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      id: (payload.id ?? '').trim(),
      name: (payload.name ?? '').trim(),
      tagline: (payload.tagline ?? '').trim() || null,
      priceAmount: String(payload.priceAmount ?? '').trim(),
      currency: (payload.currency ?? '').trim() || 'INR',
      billingType: payload.billingType,
      priceDisplayOverride: (payload.priceDisplayOverride ?? '').trim() || null,
      idealFor: (payload.idealFor ?? '').trim(),
      popular: Boolean(payload.popular),
      badge: (payload.badge ?? '').trim() || null,
      isActive: Boolean(payload.isActive),
      displayOrder: Number(payload.displayOrder) || 0,
      features: (payload.features || []).map((f, idx) => ({
        featureText: (f.featureText ?? '').trim(),
        displayOrder: idx,
      })),
    }),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to create service packages.', 403);
  }

  const data: AdminSinglePackageResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new AdminApiError(data.error || 'Failed to assign package to service.', response.status);
  }

  return data.data;
}

/**
 * Toggle active/inactive status for a package on a specific service
 */
export async function toggleAdminServicePackageStatus(
  serviceId: string,
  packageId: string,
  isActive: boolean
): Promise<AdminPackage> {
  const response = await fetch(
    `/api/admin/services/${encodeURIComponent(serviceId)}/packages/${encodeURIComponent(packageId)}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ isActive }),
    }
  );

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to update service package status.', 403);
  }

  const data: AdminSinglePackageResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new AdminApiError(data.error || 'Failed to update service package status.', response.status);
  }

  return data.data;
}

/**
 * Reorder packages for a specific service
 */
export async function reorderAdminServicePackages(
  serviceId: string,
  items: ReorderItem[]
): Promise<void> {
  const response = await fetch(`/api/admin/services/${encodeURIComponent(serviceId)}/packages/reorder`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ items }),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to reorder service packages.', 403);
  }

  const data: { success: boolean; error?: string } = await response.json();

  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to reorder service packages.', response.status);
  }
}

/**
 * Unassign a package from a specific service
 */
export async function deleteAdminServicePackage(serviceId: string, packageId: string): Promise<void> {
  const response = await fetch(
    `/api/admin/services/${encodeURIComponent(serviceId)}/packages/${encodeURIComponent(packageId)}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to remove service package.', 403);
  }

  const data: { success: boolean; error?: string } = await response.json();

  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to unassign package from service.', response.status);
  }
}
