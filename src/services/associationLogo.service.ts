import { AssociationLogoData, CreateAssociationLogoInput, UpdateAssociationLogoInput } from '../types/associationLogo';

/**
 * Public: Fetch active Association Logos for Trust Factor section
 */
export async function fetchPublicAssociationLogos(): Promise<AssociationLogoData[]> {
  try {
    const res = await fetch('/api/association-logos', {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (error) {
    console.error('Failed to fetch association logos:', error);
    return [];
  }
}

/**
 * Admin: Fetch all Association Logos
 */
export async function fetchAdminAssociationLogos(): Promise<AssociationLogoData[]> {
  const res = await fetch('/api/admin/association-logos', {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch admin association logos');
  }
  const json = await res.json();
  return Array.isArray(json) ? json : json?.data || [];
}

/**
 * Admin: Create Association Logo
 */
export async function createAdminAssociationLogo(payload: CreateAssociationLogoInput): Promise<AssociationLogoData> {
  const res = await fetch('/api/admin/association-logos', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create association logo');
  }
  const json = await res.json();
  return json.data || json;
}

/**
 * Admin: Update Association Logo
 */
export async function updateAdminAssociationLogo(id: string, payload: UpdateAssociationLogoInput): Promise<AssociationLogoData> {
  const res = await fetch(`/api/admin/association-logos/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update association logo');
  }
  const json = await res.json();
  return json.data || json;
}

/**
 * Admin: Delete Association Logo
 */
export async function deleteAdminAssociationLogo(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/association-logos/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete association logo');
  }
  return true;
}

/**
 * Admin: Reorder Association Logos
 */
export async function reorderAdminAssociationLogos(items: { id: string; displayOrder: number }[]): Promise<boolean> {
  const res = await fetch('/api/admin/association-logos/reorder', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to reorder association logos');
  }
  return true;
}
