import React, { ReactNode } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { RECAPTCHA_CONFIG } from '../../config/recaptcha';

interface AppRecaptchaProviderProps {
  children: ReactNode;
}

/**
 * App-level reCAPTCHA v3 Provider wrapper.
 * Mounts GoogleReCaptchaProvider only when a non-empty siteKey is configured.
 * Otherwise renders children directly without loading the external reCAPTCHA script.
 */
export const AppRecaptchaProvider: React.FC<AppRecaptchaProviderProps> = ({ children }) => {
  if (!RECAPTCHA_CONFIG.isEnabled || !RECAPTCHA_CONFIG.siteKey) {
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_CONFIG.siteKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
};
