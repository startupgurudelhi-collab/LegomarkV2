import { ClientLogoData, CreateClientLogoInput, UpdateClientLogoInput, ReorderClientLogosInput } from '../types/clientLogo';

/**
 * Public: Fetch all active client logos
 */
export async function fetchPublicClientLogos(): Promise<ClientLogoData[]> {
  try {
    const res = await fetch('/api/client-logos');
    if (!res.ok) return [];
    const json = await res.json();
    if (json && json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (err) {
    console.error('Error fetching public client logos:', err);
    return [];
  }
}

/**
 * Admin: Fetch all client logos
 */
export async function fetchAdminClientLogos(): Promise<ClientLogoData[]> {
  const res = await fetch('/api/admin/client-logos', {
    credentials: 'include',
  });

  const json = await res.json();
  if (res.ok && json && json.success && Array.isArray(json.data)) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to load client logos');
}

/**
 * Admin: Create client logo
 */
export async function createAdminClientLogo(input: CreateClientLogoInput): Promise<ClientLogoData> {
  const res = await fetch('/api/admin/client-logos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (res.ok && json && json.success && json.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to create client logo');
}

/**
 * Admin: Update client logo
 */
export async function updateAdminClientLogo(
  id: string,
  input: UpdateClientLogoInput
): Promise<ClientLogoData> {
  const res = await fetch(`/api/admin/client-logos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (res.ok && json && json.success && json.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to update client logo');
}

/**
 * Admin: Delete client logo
 */
export async function deleteAdminClientLogo(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/client-logos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  const json = await res.json();
  if (res.ok && json && json.success) {
    return true;
  }

  throw new Error(json?.error || 'Failed to delete client logo');
}

/**
 * Admin: Reorder client logos
 */
export async function reorderAdminClientLogos(orderedIds: string[]): Promise<ClientLogoData[]> {
  const res = await fetch('/api/admin/client-logos/reorder', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ orderedIds } as ReorderClientLogosInput),
  });

  const json = await res.json();
  if (res.ok && json && json.success && Array.isArray(json.data)) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to reorder client logos');
}
