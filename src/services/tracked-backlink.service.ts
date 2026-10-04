import {
  TrackedBacklinksResponseData,
  TrackedBacklinksFilterOptions,
  TrackedBacklink,
  CreateTrackedBacklinkInput,
  UpdateTrackedBacklinkInput,
  BatchVerificationSummary,
} from '../types/tracked-backlink';

const BASE_URL = '/api/admin/backlinks/tracked';

/**
 * LACS Module #22: Frontend API Client for Tracked Backlinks
 */
export async function fetchTrackedBacklinks(
  filters: TrackedBacklinksFilterOptions = {}
): Promise<TrackedBacklinksResponseData> {
  const query = new URLSearchParams();

  if (filters.status) query.set('status', filters.status);
  if (filters.linkType) query.set('linkType', filters.linkType);
  if (filters.targetUrl) query.set('targetUrl', filters.targetUrl);
  if (filters.sourceDomain) query.set('sourceDomain', filters.sourceDomain);
  if (filters.search) query.set('search', filters.search);

  const qs = query.toString();
  const url = `${BASE_URL}${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const json = await res.json();
  if (res.ok && json?.success && json?.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to fetch tracked backlinks');
}

/**
 * Creates a new tracked backlink record.
 */
export async function createTrackedBacklink(
  input: CreateTrackedBacklinkInput
): Promise<TrackedBacklink> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (res.ok && json?.success && json?.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to create tracked backlink');
}

/**
 * Updates an existing tracked backlink record.
 */
export async function updateTrackedBacklink(
  id: string,
  input: UpdateTrackedBacklinkInput
): Promise<TrackedBacklink> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (res.ok && json?.success && json?.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to update tracked backlink');
}

/**
 * Deletes a tracked backlink record by ID.
 */
export async function deleteTrackedBacklink(id: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const json = await res.json();
  if (res.ok && json?.success) {
    return true;
  }

  throw new Error(json?.error || 'Failed to delete tracked backlink');
}

/**
 * Triggers live crawler verification for a single tracked backlink.
 */
export async function verifyTrackedBacklink(id: string): Promise<TrackedBacklink> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const json = await res.json();
  if (res.ok && json?.success && json?.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to verify tracked backlink');
}

/**
 * Triggers batch crawler verification across tracked backlinks.
 */
export async function verifyAllTrackedBacklinks(
  limit: number = 50
): Promise<BatchVerificationSummary> {
  const res = await fetch(`${BASE_URL}/verify-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ limit }),
  });

  const json = await res.json();
  if (res.ok && json?.success && json?.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to execute batch verification');
}
