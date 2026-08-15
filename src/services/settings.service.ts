import { WebsiteSettingsData, UpdateWebsiteSettingsInput } from '../types/settings';

/**
 * Public: Fetch global website settings
 */
export async function fetchPublicSettings(): Promise<WebsiteSettingsData | null> {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (err) {
    console.error('Error fetching public settings:', err);
    return null;
  }
}

/**
 * Admin: Fetch website settings
 */
export async function fetchAdminSettings(): Promise<WebsiteSettingsData> {
  const res = await fetch('/api/admin/settings', {
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to load website settings');
}

/**
 * Admin: Update website settings
 */
export async function updateAdminSettings(
  input: UpdateWebsiteSettingsInput
): Promise<WebsiteSettingsData> {
  const res = await fetch('/api/admin/settings', {
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

  throw new Error(data?.error || 'Failed to save website settings');
}
