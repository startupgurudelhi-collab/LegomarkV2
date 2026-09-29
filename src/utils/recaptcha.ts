import { RECAPTCHA_CONFIG } from '../config/recaptcha';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Helper to briefly wait for `window.grecaptcha` to become available if the script is still loading.
 * Polls every 50ms up to `timeoutMs` (default: 2500ms).
 */
async function waitForGrecaptcha(timeoutMs = 2500): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') return true;

  const startTime = Date.now();
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime >= timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 50);
  });
}

/**
 * Execute Google reCAPTCHA v3 for a specific user action (e.g. 'lead_submission', 'consultation_request').
 * Resolves with the token string if reCAPTCHA is configured and executed, or null if disabled/not configured.
 * Briefly waits for grecaptcha to become available if the script is still loading.
 */
export async function executeRecaptcha(action = 'lead_submission'): Promise<string | null> {
  if (!RECAPTCHA_CONFIG.isEnabled || !RECAPTCHA_CONFIG.siteKey) {
    return null;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const isReady = await waitForGrecaptcha(2500);
  if (!isReady || !window.grecaptcha) {
    console.warn('Google reCAPTCHA was not ready within timeout, proceeding with null token.');
    return null;
  }

  return new Promise((resolve) => {
    try {
      window.grecaptcha?.ready(async () => {
        try {
          const token = await window.grecaptcha?.execute(RECAPTCHA_CONFIG.siteKey, { action });
          resolve(token || null);
        } catch (err) {
          console.warn('Google reCAPTCHA execution notice:', err);
          resolve(null);
        }
      });
    } catch (err) {
      console.warn('Google reCAPTCHA invocation error:', err);
      resolve(null);
    }
  });
}
