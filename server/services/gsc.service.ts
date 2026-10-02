import { config } from '../config/env';
import { encryptOAuthToken, decryptOAuthToken } from '../utils/encryption';
import {
  gscRepository,
  GscConnection,
  GscConnectionMetadata,
} from '../repositories/gsc.repository';
import { logger } from '../utils/logger';

/**
 * ============================================================================
 * LACS Module #19: Google Search Console (GSC) OAuth Service
 * ============================================================================
 *
 * Implements Google OAuth 2.0 Web Server Flow using native Node.js fetch:
 * 1. OAuth consent URL generation.
 * 2. Authorization-code exchange for refresh and access tokens.
 * 3. Two-way AES-256-GCM token encryption before database storage.
 * 4. Automatic access-token refresh before token expiry.
 *
 * Strict Security Invariants:
 * - Plaintext access and refresh tokens are NEVER exposed to client APIs or UI.
 * - Stored exclusively in PostgreSQL / in-memory as AES-256-GCM ciphertexts.
 * - Required Scope: https://www.googleapis.com/auth/webmasters.readonly
 */

export const GSC_OAUTH_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GSC_OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GSC_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
export const GSC_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

export const GSC_REQUIRED_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

export interface TokenExchangeResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

export class GscService {
  /**
   * Verifies if Google OAuth2 credentials are configured in the environment.
   */
  public isOAuthConfigured(): boolean {
    return Boolean(config.gsc?.clientId && config.gsc?.clientSecret);
  }

  /**
   * Generates the Google OAuth 2.0 authorization consent URL.
   *
   * @param redirectUri Must exactly match an Authorized redirect URI in Google Cloud Console.
   * @param state Cryptographically secure anti-CSRF token.
   */
  public getAuthUrl(redirectUri: string, state?: string): string {
    const clientId = config.gsc?.clientId?.trim();
    if (!clientId) {
      throw new Error(
        'Google Search Console OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.'
      );
    }

    if (!redirectUri || typeof redirectUri !== 'string') {
      throw new Error('A valid redirectUri is required to generate the Google OAuth consent URL.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri.trim(),
      response_type: 'code',
      // Include webmasters.readonly and openid email so we can display connected account
      scope: `${GSC_REQUIRED_SCOPE} openid email`,
      access_type: 'offline', // Required by Google to return a refresh_token
      prompt: 'consent', // Forces Google to re-issue a refresh token on re-authorization
      include_granted_scopes: 'true',
    });

    if (state && typeof state === 'string') {
      params.set('state', state.trim());
    }

    return `${GSC_OAUTH_AUTH_ENDPOINT}?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens,
   * encrypts them using AES-256-GCM, and persists to the GSC repository.
   *
   * @param code The authorization code returned by Google in the redirect query.
   * @param redirectUri Must match the exact redirectUri used during the initial auth URL generation.
   * @param adminUserId The ID of the authenticated administrator authorizing the connection.
   */
  public async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    adminUserId?: string
  ): Promise<GscConnectionMetadata> {
    const clientId = config.gsc?.clientId?.trim();
    const clientSecret = config.gsc?.clientSecret?.trim();

    if (!clientId || !clientSecret) {
      throw new Error(
        'Cannot exchange OAuth code: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.'
      );
    }

    if (!code || typeof code !== 'string') {
      throw new Error('Authorization code is missing or invalid.');
    }

    const bodyParams = new URLSearchParams({
      code: code.trim(),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri.trim(),
      grant_type: 'authorization_code',
    });

    logger.info('Exchanging OAuth authorization code with Google Token API...', 'GscService');

    const tokenRes = await fetch(GSC_OAUTH_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errorJson = (await tokenRes.json().catch(() => ({}))) as any;
      const googleError = errorJson?.error;
      const googleErrorDesc = errorJson?.error_description;
      const statusText = tokenRes.statusText ? ` ${tokenRes.statusText}` : '';

      const errorParts = [`HTTP ${tokenRes.status}${statusText}`];
      if (googleError) {
        errorParts.push(String(googleError));
      }
      if (googleErrorDesc && googleErrorDesc !== googleError) {
        errorParts.push(`(${googleErrorDesc})`);
      }

      const errorMsg = errorParts.join(' - ');
      logger.error('Google token exchange failed', 'GscService', errorMsg);
      throw new Error(`Google OAuth token exchange failed: ${errorMsg}`);
    }

    const tokenData = (await tokenRes.json()) as TokenExchangeResponse;

    if (!tokenData.access_token) {
      throw new Error('Google token response did not contain an access_token.');
    }

    // Refresh token is critical for persistent background sync
    let effectiveRefreshToken = tokenData.refresh_token;
    if (!effectiveRefreshToken) {
      // If re-authenticating and Google did not return a new refresh_token,
      // fallback to the existing stored refresh token if present
      const existing = await gscRepository.getConnection();
      if (existing?.encryptedRefreshToken) {
        effectiveRefreshToken = decryptOAuthToken(existing.encryptedRefreshToken);
      }
    }

    if (!effectiveRefreshToken) {
      throw new Error(
        'Google did not return a refresh_token. Please revoke app access in your Google Account security settings and reconnect with prompt=consent.'
      );
    }

    // Attempt to fetch connected user's email address
    let connectedEmail: string | null = null;
    try {
      const userinfoRes = await fetch(GSC_USERINFO_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      });
      if (userinfoRes.ok) {
        const userInfo = (await userinfoRes.json()) as any;
        if (typeof userInfo?.email === 'string') {
          connectedEmail = userInfo.email.trim();
        }
      }
    } catch (userErr) {
      logger.warn('Failed to retrieve Google userinfo email, proceeding without it', 'GscService');
    }

    // Encrypt sensitive tokens using AES-256-GCM before database write
    const encryptedAccessToken = encryptOAuthToken(tokenData.access_token);
    const encryptedRefreshToken = encryptOAuthToken(effectiveRefreshToken);

    // Compute token expiry with a 60-second safety margin
    const expiresInSeconds = tokenData.expires_in || 3600;
    const tokenExpiry = new Date(Date.now() + Math.max(60, expiresInSeconds - 60) * 1000);

    const saved = await gscRepository.saveConnection({
      connectedByAdminId: adminUserId || null,
      connectedEmail,
      encryptedAccessToken,
      encryptedRefreshToken,
      tokenExpiry,
      scope: tokenData.scope || GSC_REQUIRED_SCOPE,
      isConnected: true,
      lastSyncedAt: null,
    });

    logger.info(
      `Google Search Console successfully connected for account [${connectedEmail || 'Unknown'}]`,
      'GscService'
    );

    return gscRepository.toMetadata(saved);
  }

  /**
   * Retrieves a valid, decrypted access token for server-to-server Google API requests.
   * If the stored access token has expired (or is within 60s of expiration),
   * it automatically uses the refresh token to obtain a fresh access token.
   *
   * @returns Raw decrypted access_token strictly for internal API call dispatch.
   */
  public async getFreshAccessToken(): Promise<string> {
    const connection = await gscRepository.getConnection();

    if (
      !connection ||
      !connection.isConnected ||
      !connection.encryptedAccessToken ||
      !connection.encryptedRefreshToken
    ) {
      throw new Error(
        'Google Search Console is not connected. Please connect your Google account in settings.'
      );
    }

    const decryptedAccessToken = decryptOAuthToken(connection.encryptedAccessToken);
    const decryptedRefreshToken = decryptOAuthToken(connection.encryptedRefreshToken);

    const now = Date.now();
    const tokenExpiryTime = connection.tokenExpiry ? connection.tokenExpiry.getTime() : 0;
    const isExpired = tokenExpiryTime <= now + 60 * 1000; // 60s safety window

    if (!isExpired) {
      return decryptedAccessToken;
    }

    // Token is expired: execute refresh flow
    const clientId = config.gsc?.clientId?.trim();
    const clientSecret = config.gsc?.clientSecret?.trim();

    if (!clientId || !clientSecret) {
      throw new Error(
        'Cannot refresh Google access token: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.'
      );
    }

    logger.info('Refreshing expired Google Search Console access token...', 'GscService');

    const refreshParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: decryptedRefreshToken,
      grant_type: 'refresh_token',
    });

    const refreshRes = await fetch(GSC_OAUTH_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: refreshParams.toString(),
    });

    if (!refreshRes.ok) {
      const errorJson = (await refreshRes.json().catch(() => ({}))) as any;
      const errorMsg = errorJson?.error_description || errorJson?.error || refreshRes.statusText;

      // If user revoked permissions or refresh token is invalid
      if (errorJson?.error === 'invalid_grant') {
        logger.warn(
          'Google Search Console refresh token revoked or expired. Disconnecting...',
          'GscService'
        );
        await gscRepository.disconnect();
        throw new Error(
          'Google Search Console authorization has expired or was revoked. Please reconnect in settings.'
        );
      }

      logger.error('Failed to refresh Google access token', 'GscService', errorMsg);
      throw new Error(`Google access token refresh failed: ${errorMsg}`);
    }

    const refreshData = (await refreshRes.json()) as TokenExchangeResponse;

    if (!refreshData.access_token) {
      throw new Error('Google refresh response did not contain a new access_token.');
    }

    // Re-encrypt the new access token
    const newEncryptedAccessToken = encryptOAuthToken(refreshData.access_token);
    // Google may optionally return a rotated refresh token
    const newEncryptedRefreshToken = refreshData.refresh_token
      ? encryptOAuthToken(refreshData.refresh_token)
      : connection.encryptedRefreshToken;

    const expiresInSeconds = refreshData.expires_in || 3600;
    const newTokenExpiry = new Date(Date.now() + Math.max(60, expiresInSeconds - 60) * 1000);

    await gscRepository.saveConnection({
      connectedByAdminId: connection.connectedByAdminId,
      connectedEmail: connection.connectedEmail,
      selectedProperty: connection.selectedProperty,
      encryptedAccessToken: newEncryptedAccessToken,
      encryptedRefreshToken: newEncryptedRefreshToken,
      tokenExpiry: newTokenExpiry,
      scope: refreshData.scope || connection.scope,
      isConnected: true,
      lastSyncedAt: connection.lastSyncedAt,
    });

    logger.info('Google Search Console access token successfully refreshed', 'GscService');

    return refreshData.access_token;
  }

  /**
   * Retrieves current connection status and metadata without token fields.
   */
  public async getConnectionStatus(): Promise<GscConnectionMetadata | null> {
    return gscRepository.getConnectionMetadata();
  }

  /**
   * Disconnects the Search Console integration and revokes the authorization grant with Google.
   * Revoking the refresh token fully terminates the authorization grant on Google's servers.
   */
  public async disconnect(): Promise<void> {
    try {
      const connection = await gscRepository.getConnection();
      // Prioritize revoking the refresh token to revoke the entire Google OAuth grant;
      // fallback to access token if refresh token is unavailable
      const tokenCipher =
        connection?.encryptedRefreshToken || connection?.encryptedAccessToken;

      if (tokenCipher) {
        const tokenToRevoke = decryptOAuthToken(tokenCipher);
        // Best-effort revocation request with Google
        await fetch(`${GSC_REVOKE_ENDPOINT}?token=${encodeURIComponent(tokenToRevoke)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }).catch((err) => {
          logger.warn('Google OAuth token revocation request failed', 'GscService', err);
        });
      }
    } catch {
      // Ignore decryption or network failure to ensure local disconnect succeeds
    }

    await gscRepository.disconnect();
  }
}

export const gscService = new GscService();
