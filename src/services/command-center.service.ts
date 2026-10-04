import { LacsCommandCenterOverview } from '../types/command-center';

const BASE_URL = '/api/admin/command-center';

/**
 * LACS Module #23: Frontend API Client for Command Center Aggregator
 */
export async function fetchCommandCenterOverview(): Promise<LacsCommandCenterOverview> {
  const res = await fetch(BASE_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const json = await res.json();
  if (res.ok && json?.success && json?.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to load SEO Command Center overview');
}
