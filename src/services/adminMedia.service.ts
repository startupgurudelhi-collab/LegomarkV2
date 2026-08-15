import { AdminApiError } from './adminPackage.service';

export interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  category: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

/**
 * Upload a file directly via native multipart/form-data
 */
export async function uploadMediaFile(
  file: File,
  category: 'founder' | 'office' | 'logos' | 'testimonials' | 'media' = 'media'
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await fetch(`/api/admin/upload?category=${category}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }
  if (response.status === 403) {
    throw new AdminApiError('You do not have permission to upload assets.', 403);
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to upload media file.', response.status);
  }

  return data.data;
}

/**
 * Fetch all uploaded media assets from server
 */
export async function fetchMediaAssets(): Promise<MediaAsset[]> {
  const response = await fetch('/api/admin/media', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to load media assets.', response.status);
  }

  return data.data;
}

/**
 * Remove an uploaded media asset
 */
export async function deleteMediaAsset(url: string): Promise<void> {
  const response = await fetch('/api/admin/media', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ url }),
  });

  if (response.status === 401) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new AdminApiError(data.error || 'Failed to delete asset.', response.status);
  }
}
