import { BlogSeriesResult, GenerateBlogSeriesInput } from '../types/blogSeries';

export async function generateBlogSeries(
  input: GenerateBlogSeriesInput
): Promise<BlogSeriesResult> {
  const res = await fetch('/api/admin/blog-series/generate', {
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

  throw new Error(data?.error || 'Failed to generate AI blog series');
}
