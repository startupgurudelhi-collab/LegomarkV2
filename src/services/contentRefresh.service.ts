import { ContentRefreshScanResult } from '../types/contentRefresh';

export async function fetchContentRefreshAudit(): Promise<ContentRefreshScanResult> {
  const res = await fetch('/api/admin/content-refresh', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success) {
    return data;
  }

  throw new Error(data?.error || 'Failed to fetch content refresh audit');
}
