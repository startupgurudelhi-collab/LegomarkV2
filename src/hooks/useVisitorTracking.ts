import { useEffect, useRef } from 'react';

const VISITOR_ID_KEY = 'legomark_vid';
const SESSION_ID_KEY = 'legomark_sid';
const LANDING_RECORDED_KEY = 'legomark_landing_recorded';

/**
 * Custom React hook for tracking anonymous page views on public LEGOMARK pages.
 * - Generates an anonymous random UUID stored strictly in localStorage.
 * - Creates/reuses a tab-scoped anonymous sessionId in sessionStorage (LACS Module #17).
 * - Identifies and flags only the initial entry page as isLandingPage=true.
 * - Prevents the initial document.referrer from leaking into later client-side SPA navigations.
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
    const previousPath = lastTrackedPathRef.current;
    lastTrackedPathRef.current = currentPath;

    try {
      // 1. Retrieve or generate anonymous visitor UUID (persists across visits)
      let visitorId = localStorage.getItem(VISITOR_ID_KEY);
      if (!visitorId) {
        visitorId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'vid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
      }

      // 2. Retrieve or create tab-scoped session ID & landing page flag (LACS Module #17)
      let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
      let isLandingPage = false;

      if (!sessionId) {
        sessionId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'sid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(SESSION_ID_KEY, sessionId);
        sessionStorage.setItem(LANDING_RECORDED_KEY, 'true');
        isLandingPage = true;
      } else if (!sessionStorage.getItem(LANDING_RECORDED_KEY)) {
        sessionStorage.setItem(LANDING_RECORDED_KEY, 'true');
        isLandingPage = true;
      }

      // 3. Referrer Handling:
      // - Landing Page: use the initial external document.referrer (e.g. google.com, bing.com).
      // - Subsequent SPA Route Changes: explicitly PREVENT document.referrer from leaking;
      //   instead, send the previous internal path as the referrer (which the server filters as self-referral).
      let referrer: string | undefined = undefined;
      if (isLandingPage && document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          referrer = `${refUrl.origin}${refUrl.pathname}`;
        } catch {
          referrer = document.referrer.slice(0, 100);
        }
      } else if (!isLandingPage && previousPath) {
        try {
          referrer = `${window.location.origin}${previousPath}`;
        } catch {
          referrer = previousPath;
        }
      }

      // 4. Dispatch non-blocking tracking call
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: currentPath,
          visitorId,
          referrer,
          sessionId,
          isLandingPage,
        }),
        keepalive: true,
      }).catch(() => {
        // Silently swallow any network or offline failures
      });
    } catch {
      // Gracefully handle any localStorage/sessionStorage access restrictions (e.g. strict private browsing)
    }
  }, [currentPath]);
}
