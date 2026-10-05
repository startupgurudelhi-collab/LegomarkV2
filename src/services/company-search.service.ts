import { NameSearchRequest, NameSearchResponse } from '../types/company-search';

const BASE_URL = '/api/company-search';

/**
 * Public Company Name Search API Client
 */
export async function searchCompanyName(
  params: NameSearchRequest
): Promise<NameSearchResponse> {
  const res = await fetch(`${BASE_URL}/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (res.ok && json?.success && json?.data) {
    return json.data;
  }

  throw new Error(json?.error || 'Failed to evaluate company name availability');
}
