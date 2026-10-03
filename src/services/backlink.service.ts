import {
  BacklinkOpportunityResult,
  BacklinkOpportunityFilterOptions,
} from '../types/backlink';

/**
 * LACS Module #21: Frontend Service for Backlink Opportunities
 * Calls the protected /api/admin/backlinks/opportunities endpoint.
 */
export async function fetchBacklinkOpportunities(
  filters: BacklinkOpportunityFilterOptions = {}
): Promise<BacklinkOpportunityResult> {
  const query = new URLSearchParams();

  if (filters.days) query.set('days', String(filters.days));
  if (filters.outreachType) query.set('outreachType', filters.outreachType);
  if (filters.priority) query.set('priority', filters.priority);
  if (filters.onlyStrikingDistance) query.set('onlyStrikingDistance', 'true');
  if (filters.minImpressions !== undefined) query.set('minImpressions', String(filters.minImpressions));
  if (filters.limit) query.set('limit', String(filters.limit));

  const qs = query.toString();
  const url = `/api/admin/backlinks/opportunities${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const json = await res.json();

  if (res.ok && json && json.success && json.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to retrieve backlink opportunities');
}
