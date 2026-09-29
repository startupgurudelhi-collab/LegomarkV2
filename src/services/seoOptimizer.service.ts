import { SeoAnalysisResult, AnalyzeBlogSeoInput, CatalogSeoAuditResult } from '../types/seoOptimizer';

export async function analyzeBlogSeo(input: AnalyzeBlogSeoInput): Promise<SeoAnalysisResult> {
  const res = await fetch('/api/admin/seo-optimizer/analyze', {
    method: 'POST',
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

  throw new Error(data?.error || 'Failed to complete AI SEO analysis');
}

/**
 * LACS Module #18: Fetch latest persisted Catalog SEO Audit from server
 * GET /api/admin/seo-optimizer/catalog/audit
 */
export async function fetchCatalogSeoAudit(autoRun = false): Promise<CatalogSeoAuditResult | null> {
  const url = `/api/admin/seo-optimizer/catalog/audit${autoRun ? '?autoRun=true' : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json();

  if (res.ok && data && data.success) {
    return data.data || null;
  }

  throw new Error(data?.error || 'Failed to fetch catalog SEO audit');
}

/**
 * LACS Module #18: Run + persist a fresh Catalog SEO Audit
 * POST /api/admin/seo-optimizer/catalog/audit
 */
export async function runCatalogSeoAudit(): Promise<CatalogSeoAuditResult> {
  const res = await fetch('/api/admin/seo-optimizer/catalog/audit', {
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

  throw new Error(data?.error || 'Failed to run catalog SEO audit');
}
