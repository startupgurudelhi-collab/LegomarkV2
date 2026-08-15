import { SystemHealthReport } from '../types/index';

export async function fetchHealthReport(): Promise<SystemHealthReport> {
  const response = await fetch('/api/health');
  if (!response.ok && response.status !== 503) {
    throw new Error(`Health check request failed with HTTP status ${response.status}`);
  }
  const data: SystemHealthReport = await response.json();
  return data;
}

export async function fetchLiveness(): Promise<{ status: string; uptime: number; timestamp: string }> {
  const response = await fetch('/api/liveness');
  if (!response.ok) {
    throw new Error(`Liveness check failed with HTTP ${response.status}`);
  }
  return response.json();
}
