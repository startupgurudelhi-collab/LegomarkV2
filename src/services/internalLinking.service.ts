import { InternalLinkingScanResult } from '../types/internalLinking';

export async function scanInternalLinkingOpportunities(): Promise<InternalLinkingScanResult> {
  const res = await fetch('/api/admin/internal-linking/scan', {
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

  throw new Error(data?.error || 'Failed to scan internal linking opportunities');
}
