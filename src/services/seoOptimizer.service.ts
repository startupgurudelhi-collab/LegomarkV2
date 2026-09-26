import { SeoAnalysisResult, AnalyzeBlogSeoInput } from '../types/seoOptimizer';

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
