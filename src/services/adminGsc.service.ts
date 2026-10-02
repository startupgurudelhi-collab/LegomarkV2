/**
 * ============================================================================
 * LACS Module #19: Admin Google Search Console (GSC) Frontend Service
 * ============================================================================
 */

export interface GscConnectionMetadata {
  isConnected: boolean;
  connectedEmail: string | null;
  selectedProperty: string | null;
  lastSyncedAt: string | null;
  tokenExpiry: string | null;
  connectedByAdminId: string | null;
  updatedAt: string | null;
}

export interface GscStatusResponse {
  success: boolean;
  data: GscConnectionMetadata | null;
  isConfigured: boolean;
  error?: string;
}

export async function fetchGscStatus(): Promise<GscStatusResponse> {
  const res = await fetch('/api/admin/gsc/status', {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to retrieve GSC connection status (HTTP ${res.status})`);
  }

  return res.json();
}

export interface GscSiteProperty {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscPropertyDiscoveryResult {
  properties: GscSiteProperty[];
  selectedProperty: string | null;
  connectedEmail: string | null;
  lastSyncedAt: string | null;
}

export interface GscPropertiesResponse {
  success: boolean;
  data: GscPropertyDiscoveryResult | null;
  error?: string;
}

export async function fetchGscProperties(): Promise<GscPropertiesResponse> {
  const res = await fetch('/api/admin/gsc/properties', {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorJson = (await res.json().catch(() => ({}))) as any;
    throw new Error(errorJson?.error || `Failed to fetch GSC properties (HTTP ${res.status})`);
  }

  return res.json();
}

export async function selectGscProperty(siteUrl: string): Promise<{
  success: boolean;
  message?: string;
  data?: GscConnectionMetadata;
  error?: string;
}> {
  const res = await fetch('/api/admin/gsc/select-property', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ siteUrl }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to save selected property (HTTP ${res.status})`);
  }

  return json;
}

export interface GscSearchAnalyticsSummary {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscDateRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSearchAnalyticsData {
  property: string;
  startDate: string;
  endDate: string;
  days: number;
  summary: GscSearchAnalyticsSummary;
  queries: GscQueryRow[];
  pages: GscPageRow[];
  dates: GscDateRow[];
}

export interface GscSearchAnalyticsResponse {
  success: boolean;
  data: GscSearchAnalyticsData | null;
  error?: string;
}

export async function fetchGscSearchAnalytics(params?: {
  days?: number;
  startDate?: string;
  endDate?: string;
  rowLimit?: number;
}): Promise<GscSearchAnalyticsResponse> {
  const query = new URLSearchParams();
  if (params?.days) query.set('days', String(params.days));
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.rowLimit) query.set('rowLimit', String(params.rowLimit));

  const qs = query.toString();
  const url = `/api/admin/gsc/search-analytics${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to fetch Search Analytics (HTTP ${res.status})`);
  }

  return json;
}

export async function disconnectGsc(): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch('/api/admin/gsc/disconnect', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to disconnect GSC (HTTP ${res.status})`);
  }

  return res.json();
}
