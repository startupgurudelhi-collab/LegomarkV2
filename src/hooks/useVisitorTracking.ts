import { useEffect, useRef } from 'react';

const VISITOR_ID_KEY = 'legomark_vid';

/**
 * Custom React hook for tracking anonymous page views on public LEGOMARK pages.
 * - Generates an anonymous random UUID stored strictly in localStorage.
 * - Does NOT collect any personal info (no names, emails, IPs, or fingerprints).
 * - Bypasses /admin and /api routes completely.
 * - Executes in a non-blocking background fetch call with keepalive support.
 */
export function useVisitorTracking(currentPath: string) {
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Only execute on browser client
    if (typeof window === 'undefined') return;

    // Ignore admin portals, internal API endpoints, or empty paths
    if (
      !currentPath ||
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/api')
    ) {
      return;
    }

    // Deduplicate consecutive renders of the exact same path
    if (lastTrackedPathRef.current === currentPath) {
      return;
    }
    lastTrackedPathRef.current = currentPath;

    try {
      // 1. Retrieve or generate anonymous visitor UUID
      let visitorId = localStorage.getItem(VISITOR_ID_KEY);
      if (!visitorId) {
        visitorId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'vid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
      }

      // 2. Clean referrer (omit any query parameters or hash to protect privacy)
      let referrer: string | undefined = undefined;
      if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          referrer = `${refUrl.origin}${refUrl.pathname}`;
        } catch {
          referrer = document.referrer.slice(0, 100);
        }
      }

      // 3. Dispatch non-blocking tracking call
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: currentPath,
          visitorId,
          referrer,
        }),
        keepalive: true,
      }).catch(() => {
        // Silently swallow any network or offline failures
      });
    } catch {
      // Gracefully handle any localStorage access restrictions (e.g. strict private browsing)
    }
  }, [currentPath]);
}
