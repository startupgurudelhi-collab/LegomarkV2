import { OrphanPageScanResult } from '../types/orphanPage';

export async function scanOrphanPages(): Promise<OrphanPageScanResult> {
  const res = await fetch('/api/admin/orphan-pages/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success && data.data) {
    return data.data;
  }

  throw new Error(data?.error || 'Failed to scan orphan pages');
}
