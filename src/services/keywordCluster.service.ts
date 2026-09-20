import { KeywordClusterResult, GenerateKeywordClusterInput } from '../types/keywordCluster';

export async function generateKeywordCluster(
  input: GenerateKeywordClusterInput
): Promise<KeywordClusterResult> {
  const res = await fetch('/api/admin/keyword-cluster/generate', {
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

  throw new Error(data?.error || 'Failed to generate AI keyword cluster');
}
