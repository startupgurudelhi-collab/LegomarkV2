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
