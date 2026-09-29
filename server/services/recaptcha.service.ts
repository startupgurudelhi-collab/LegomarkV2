import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
  errorMessage?: string;
  skipped?: boolean;
}

/**
 * Backend Google reCAPTCHA v3 Verification Service
 * Handles server-to-server token verification with Google's siteverify endpoint.
 */
export class RecaptchaService {
  private readonly verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  private readonly defaultMinScore = 0.5;

  /**
   * Verify a reCAPTCHA v3 response token with Google.
   *
   * @param token The token received from client-side executeRecaptcha().
   * @param expectedAction Optional expected action string (e.g. 'lead_submission') to guard against replay attacks.
   * @param minScore Minimum acceptable score between 0.0 and 1.0 (default: 0.5).
   * @param remoteIp Optional client IP address.
   */
  async verifyToken(
    token?: string | null,
    expectedAction?: string,
    minScore = this.defaultMinScore,
    remoteIp?: string
  ): Promise<RecaptchaVerificationResult> {
    const secretKey = config.recaptcha.secretKey || process.env.RECAPTCHA_SECRET_KEY?.trim();

    // If no secret key is configured on the server:
    // In production: Fail closed with success: false
    // In dev/staging: Skip verification safely with success: true
    if (!secretKey) {
      if (config.env === 'production' || process.env.NODE_ENV === 'production') {
        logger.error(
          'reCAPTCHA verification failed: RECAPTCHA_SECRET_KEY is required in production environment.',
          'RecaptchaService'
        );
        return {
          success: false,
          skipped: false,
          errorMessage: 'Server security configuration error: RECAPTCHA_SECRET_KEY missing in production',
        };
      }

      logger.info('reCAPTCHA verification skipped: RECAPTCHA_SECRET_KEY not configured.', 'RecaptchaService');
      return {
        success: true,
        skipped: true,
      };
    }

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return {
        success: false,
        errorMessage: 'Missing or empty reCAPTCHA token',
      };
    }

    try {
      const params = new URLSearchParams();
      params.append('secret', secretKey);
      params.append('response', token.trim());
      if (remoteIp) {
        params.append('remoteip', remoteIp);
      }

      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        logger.error(`reCAPTCHA verify HTTP error: ${response.status}`, 'RecaptchaService');
        return {
          success: false,
          errorMessage: `Google reCAPTCHA service returned HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      const success = Boolean(data.success);
      const score = typeof data.score === 'number' ? data.score : undefined;
      const action = typeof data.action === 'string' ? data.action : undefined;

      // Validate action match if expectedAction is specified
      if (success && expectedAction && action && action !== expectedAction) {
        logger.warn(
          `reCAPTCHA action mismatch: expected "${expectedAction}", got "${action}"`,
          'RecaptchaService'
        );
        return {
          success: false,
          score,
          action,
          errorMessage: `Action mismatch (expected "${expectedAction}", received "${action}")`,
        };
      }

      // Validate score threshold
      if (success && score !== undefined && score < minScore) {
        logger.warn(
          `reCAPTCHA score too low: ${score} < ${minScore} threshold`,
          'RecaptchaService'
        );
        return {
          success: false,
          score,
          action,
          errorMessage: `Bot score threshold not met (${score} < ${minScore})`,
        };
      }

      return {
        success,
        score,
        action,
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
        errorCodes: data['error-codes'],
      };
    } catch (err: any) {
      logger.error('Error during reCAPTCHA verification request:', 'RecaptchaService', err);
      return {
        success: false,
        errorMessage: err.message || 'Internal error verifying reCAPTCHA token',
      };
    }
  }
}

export const recaptchaService = new RecaptchaService();
