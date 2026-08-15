import { useState, useEffect, useCallback } from 'react';
import { fetchHealthReport } from './api';
import { SystemHealthReport } from '../types/index';

export function useHealthReport() {
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>('');

  const refreshHealth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHealthReport();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  return { health, loading, lastChecked, refreshHealth };
}
