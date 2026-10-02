import { Request, Response } from 'express';
import crypto from 'crypto';
import { gscService } from '../services/gsc.service';
import { config } from '../config/env';
import { getSessionCookieOptions } from '../utils/cookie';
import { logger } from '../utils/logger';

export const GSC_OAUTH_STATE_COOKIE = 'legomark_gsc_state';
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export class AdminGscController {
  /**
   * Helper to derive the canonical OAuth redirect URI
   */
  private getRedirectUri(req: Request): string {
    const base = config.appUrl.replace(/\/+$/, '');
    return `${base}/api/admin/gsc/oauth2callback`;
  }

  /**
   * GET /api/admin/gsc/auth-url
   * Generates a 32-byte cryptographically secure anti-CSRF state,
   * stores it in an HttpOnly SameSite=Lax cookie, and redirects to Google.
   */
  public async getAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      if (!gscService.isOAuthConfigured()) {
        res.status(400).json({
          success: false,
          error:
            'Google Search Console OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
        });
        return;
      }

      // Generate 32-byte cryptographically random anti-CSRF state nonce
      const stateNonce = crypto.randomBytes(32).toString('hex');
      const cookieOptions = getSessionCookieOptions(req, STATE_MAX_AGE_MS);

      // Store in HttpOnly SameSite=Lax cookie
      res.cookie(GSC_OAUTH_STATE_COOKIE, stateNonce, cookieOptions);

      const redirectUri = this.getRedirectUri(req);
      const authUrl = gscService.getAuthUrl(redirectUri, stateNonce);

      logger.info('Redirecting admin to Google OAuth consent screen...', 'AdminGscController');
      res.redirect(authUrl);
    } catch (error: any) {
      logger.error('Failed to generate Google auth URL', 'AdminGscController', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate Google OAuth flow.',
      });
    }
  }

  /**
   * GET /api/admin/gsc/oauth2callback
   * Validates anti-CSRF state with timingSafeEqual, clears state cookie,
   * exchanges authorization code for encrypted tokens, then redirects to admin SEO analytics.
   */
  public async oauth2callback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error, error_description } = req.query as Record<
        string,
        string | undefined
      >;

      // Always clear the state cookie immediately upon callback
      res.clearCookie(GSC_OAUTH_STATE_COOKIE, getSessionCookieOptions(req));

      // Handle user denial or Google error
      if (error) {
        logger.warn(
          `Google OAuth authorization denied or failed: ${error} - ${error_description || ''}`,
          'AdminGscController'
        );
        const safeError = error === 'access_denied' ? 'access_denied' : 'auth_denied';
        res.redirect(
          `/admin/analytics?tab=seo&gsc_error=${encodeURIComponent(safeError)}`
        );
        return;
      }

      const storedState = req.cookies?.[GSC_OAUTH_STATE_COOKIE];

      // State presence and type checks
      if (
        !state ||
        !storedState ||
        typeof state !== 'string' ||
        typeof storedState !== 'string'
      ) {
        logger.warn(
          'OAuth callback state validation failed: missing or expired state cookie',
          'AdminGscController'
        );
        res.redirect('/admin/analytics?tab=seo&gsc_error=state_mismatch');
        return;
      }

      // Convert state values to Buffers first and compare byte lengths before timingSafeEqual
      const stateBuf = Buffer.from(state, 'utf-8');
      const storedStateBuf = Buffer.from(storedState, 'utf-8');

      if (
        stateBuf.length !== storedStateBuf.length ||
        !crypto.timingSafeEqual(stateBuf, storedStateBuf)
      ) {
        logger.warn(
          'OAuth callback state verification failed: invalid state token',
          'AdminGscController'
        );
        res.redirect('/admin/analytics?tab=seo&gsc_error=invalid_state');
        return;
      }

      if (!code || typeof code !== 'string') {
        logger.warn('OAuth callback missing authorization code', 'AdminGscController');
        res.redirect('/admin/analytics?tab=seo&gsc_error=missing_code');
        return;
      }

      try {
        const redirectUri = this.getRedirectUri(req);
        const adminUserId = req.user?.id;

        await gscService.exchangeCodeForTokens(code, redirectUri, adminUserId);

        logger.info('Google Search Console OAuth flow completed successfully', 'AdminGscController');
        res.redirect('/admin/analytics?tab=seo&gsc=connected');
      } catch (exchangeErr: any) {
        logger.error('Failed to exchange Google OAuth code for tokens', 'AdminGscController', exchangeErr);

        // Map to safe, predefined error codes for the UI without leaking sensitive internals
        let errorCode = 'token_exchange_failed';
        const msg = exchangeErr instanceof Error ? exchangeErr.message.toLowerCase() : '';

        if (msg.includes('invalid_grant')) {
          errorCode = 'invalid_grant';
        } else if (msg.includes('refresh_token')) {
          errorCode = 'missing_refresh_token';
        } else if (msg.includes('google_client_id') || msg.includes('not configured')) {
          errorCode = 'oauth_not_configured';
        }

        res.redirect(`/admin/analytics?tab=seo&gsc_error=${encodeURIComponent(errorCode)}`);
      }
    } catch (unhandledErr: any) {
      logger.error('Unexpected error in Google OAuth callback handler', 'AdminGscController', unhandledErr);
      res.redirect('/admin/analytics?tab=seo&gsc_error=oauth_callback_failed');
    }
  }

  /**
   * GET /api/admin/gsc/status
   * Returns safe GSC connection metadata only (omits all token fields).
   */
  public async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const metadata = await gscService.getConnectionStatus();
      res.status(200).json({
        success: true,
        data: metadata,
        isConfigured: gscService.isOAuthConfigured(),
      });
    } catch (error: any) {
      logger.error('Failed to retrieve GSC connection status', 'AdminGscController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve Google Search Console connection status.',
      });
    }
  }

  /**
   * GET /api/admin/gsc/properties
   * ADMIN-only endpoint that discovers verified sites/properties from Google Search Console.
   * Calls sites.list using stored credentials and returns safe metadata only.
   */
  public async getProperties(req: Request, res: Response): Promise<void> {
    try {
      const discovery = await gscService.listProperties();
      res.status(200).json({
        success: true,
        data: discovery,
      });
    } catch (error: any) {
      logger.error('Failed to discover GSC properties', 'AdminGscController', error);
      const isNotConnected =
        error instanceof Error && error.message.toLowerCase().includes('not connected');
      res.status(isNotConnected ? 400 : 500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve Google Search Console properties.',
      });
    }
  }

  /**
   * POST /api/admin/gsc/select-property
   * ADMIN-only endpoint to validate and save the active Search Console property.
   */
  public async selectProperty(req: Request, res: Response): Promise<void> {
    try {
      const siteUrl = (req.body?.siteUrl || req.body?.propertyUrl) as string | undefined;

      if (!siteUrl || typeof siteUrl !== 'string' || siteUrl.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'A valid siteUrl is required in the request body.',
        });
        return;
      }

      const updatedMetadata = await gscService.selectProperty(siteUrl);

      res.status(200).json({
        success: true,
        message: `Active property successfully set to ${siteUrl.trim()}`,
        data: updatedMetadata,
      });
    } catch (error: any) {
      logger.error('Failed to select GSC property', 'AdminGscController', error);
      const isClientError =
        error instanceof Error &&
        (error.message.includes('not found') ||
          error.message.includes('not connected') ||
          error.message.includes('required'));

      res.status(isClientError ? 400 : 500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save Google Search Console property.',
      });
    }
  }

  /**
   * POST /api/admin/gsc/disconnect
   * ADMIN-only clean disconnect and token grant revocation.
   */
  public async disconnect(req: Request, res: Response): Promise<void> {
    try {
      await gscService.disconnect();
      res.status(200).json({
        success: true,
        message: 'Google Search Console disconnected successfully.',
      });
    } catch (error: any) {
      logger.error('Failed to disconnect Google Search Console', 'AdminGscController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect Google Search Console.',
      });
    }
  }

  /**
   * GET /api/admin/gsc/search-analytics
   * ADMIN-only endpoint that queries Google Search Console Search Analytics API.
   * Returns clicks, impressions, CTR, average position, plus query and page dimensions.
   *
   * Query params:
   *  - days (number, default 28)
   *  - startDate (YYYY-MM-DD, optional)
   *  - endDate (YYYY-MM-DD, optional)
   *  - rowLimit (number, default 100, max 1000)
   */
  public async getSearchAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate.trim() : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate.trim() : undefined;
      const rowLimit = req.query.rowLimit ? parseInt(req.query.rowLimit as string, 10) : undefined;

      const data = await gscService.querySearchAnalytics({
        days,
        startDate,
        endDate,
        rowLimit,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      logger.error('Failed to query GSC search analytics', 'AdminGscController', error);
      const isClientError =
        error instanceof Error &&
        (error.message.includes('not connected') ||
          error.message.includes('No Google Search Console property') ||
          error.message.includes('not found') ||
          error.message.includes('invalid') ||
          error.message.toLowerCase().includes('date range'));

      const status =
        error?.status === 401
          ? 401
          : error?.status === 403
          ? 403
          : isClientError
          ? 400
          : 500;

      res.status(status).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve Google Search Console search analytics.',
      });
    }
  }
}

export const adminGscController = new AdminGscController();
