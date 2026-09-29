/**
 * Google reCAPTCHA v3 Frontend Configuration
 * Loads the public site key from Vite environment variables (VITE_RECAPTCHA_SITE_KEY).
 */
export const RECAPTCHA_CONFIG = {
  siteKey: (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim() || '',
  isEnabled: Boolean((import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim()),
};
