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
export const GSC_SITES_ENDPOINT = 'https://www.googleapis.com/webmasters/v3/sites';

export const GSC_REQUIRED_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

export interface GscSiteProperty {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscPropertyDiscoveryResult {
  properties: GscSiteProperty[];
  selectedProperty: string | null;
  connectedEmail: string | null;
  lastSyncedAt: Date | null;
}

export interface TokenExchangeResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

export interface GscSearchAnalyticsSummary {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscDateRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSearchAnalyticsResult {
  property: string;
  startDate: string;
  endDate: string;
  days: number;
  summary: GscSearchAnalyticsSummary;
  queries: GscQueryRow[];
  pages: GscPageRow[];
  dates: GscDateRow[];
}

export interface QuerySearchAnalyticsOptions {
  days?: number;
  startDate?: string;
  endDate?: string;
  rowLimit?: number;
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
   * Discovers and lists all verified sites/properties accessible to the connected Google account.
   * Calls Google Search Console sites.list (webmasters/v3/sites) using a fresh access token.
   *
   * @returns Discovered properties list and current selection metadata only (never exposes tokens).
   */
  public async listProperties(): Promise<GscPropertyDiscoveryResult> {
    const connection = await gscRepository.getConnection();
    if (!connection || !connection.isConnected) {
      throw new Error(
        'Google Search Console is not connected. Please connect your Google account in settings.'
      );
    }

    const accessToken = await this.getFreshAccessToken();

    logger.info('Fetching verified properties from Google Search Console sites.list...', 'GscService');

    const sitesRes = await fetch(GSC_SITES_ENDPOINT, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!sitesRes.ok) {
      const errorJson = (await sitesRes.json().catch(() => ({}))) as any;
      const errorMsg =
        errorJson?.error?.message ||
        errorJson?.error_description ||
        `HTTP ${sitesRes.status} ${sitesRes.statusText}`;
      logger.error('Failed to fetch GSC properties from Google API', 'GscService', errorMsg);
      throw new Error(`Google Search Console API error: ${errorMsg}`);
    }

    const data = (await sitesRes.json()) as {
      siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }>;
    };
    const rawEntries = Array.isArray(data?.siteEntry) ? data.siteEntry : [];

    const properties: GscSiteProperty[] = rawEntries
      .filter((entry) => typeof entry?.siteUrl === 'string' && entry.siteUrl.trim().length > 0)
      .map((entry) => ({
        siteUrl: entry.siteUrl!.trim(),
        permissionLevel: entry.permissionLevel || 'unknown',
      }));

    return {
      properties,
      selectedProperty: connection.selectedProperty,
      connectedEmail: connection.connectedEmail,
      lastSyncedAt: connection.lastSyncedAt,
    };
  }

  /**
   * Validates that the property exists in the connected Google Search Console account,
   * then updates the singleton connection's selectedProperty field.
   *
   * @param propertyUrl The siteUrl (e.g. "https://legomarkindia.com/" or "sc-domain:legomarkindia.com")
   * @returns Updated safe connection metadata
   */
  public async selectProperty(propertyUrl: string): Promise<GscConnectionMetadata> {
    if (!propertyUrl || typeof propertyUrl !== 'string' || propertyUrl.trim().length === 0) {
      throw new Error('A valid propertyUrl is required.');
    }

    const normalizedUrl = propertyUrl.trim();

    // 1. Verify connection status
    const connection = await gscRepository.getConnection();
    if (!connection || !connection.isConnected) {
      throw new Error(
        'Google Search Console is not connected. Please connect your Google account before selecting a property.'
      );
    }

    // 2. Discover available verified properties to validate existence
    const discovery = await this.listProperties();
    const propertyExists = discovery.properties.some(
      (p) => p.siteUrl.toLowerCase() === normalizedUrl.toLowerCase()
    );

    if (!propertyExists) {
      throw new Error(
        `Property "${normalizedUrl}" was not found in the verified sites of the connected Google Search Console account.`
      );
    }

    // 3. Persist the validated property URL
    const updated = await gscRepository.updateSelectedProperty(normalizedUrl);
    if (!updated) {
      throw new Error('Failed to update selected property in repository.');
    }

    logger.info(
      `Google Search Console active property updated to [${normalizedUrl}]`,
      'GscService'
    );

    return gscRepository.toMetadata(updated);
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

  /**
   * Helper to execute a Search Analytics query against Google Search Console API.
   * Path: /sites/{siteUrl}/searchAnalytics/query
   */
  private async executeSearchAnalyticsQuery(
    propertyUrl: string,
    accessToken: string,
    body: {
      startDate: string;
      endDate: string;
      dimensions?: string[];
      rowLimit?: number;
      startRow?: number;
    }
  ): Promise<any[]> {
    const endpoint = `${GSC_SITES_ENDPOINT}/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorJson = (await res.json().catch(() => ({}))) as any;
      const errorMsg =
        errorJson?.error?.message ||
        errorJson?.error_description ||
        `HTTP ${res.status} ${res.statusText}`;
      logger.error('Google Search Analytics API query failed', 'GscService', errorMsg);
      const err: any = new Error(`Google Search Console API error (HTTP ${res.status}): ${errorMsg}`);
      err.status = res.status;
      throw err;
    }

    const data = (await res.json()) as { rows?: any[] };
    return Array.isArray(data?.rows) ? data.rows : [];
  }

  /**
   * Queries Google Search Console Search Analytics for the active selected property.
   * Returns clicks, impressions, CTR, average position, plus query and page dimensions.
   */
  public async querySearchAnalytics(
    options: QuerySearchAnalyticsOptions = {}
  ): Promise<GscSearchAnalyticsResult> {
    const connection = await gscRepository.getConnection();
    if (!connection || !connection.isConnected) {
      throw new Error(
        'Google Search Console is not connected. Please connect your Google account in settings.'
      );
    }

    if (!connection.selectedProperty || connection.selectedProperty.trim().length === 0) {
      throw new Error(
        'No Google Search Console property is selected. Please select a verified property first.'
      );
    }

    const selectedProperty = connection.selectedProperty.trim();
    const accessToken = await this.getFreshAccessToken();

    // Date range resolution (default 28 days)
    const days = Math.max(1, Math.min(options.days ?? 28, 365));
    const now = new Date();
    // Default to 2 days prior to account for standard Search Console data latency
    const defaultEnd = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const defaultStart = new Date(defaultEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const startDate =
      options.startDate && /^\d{4}-\d{2}-\d{2}$/.test(options.startDate)
        ? options.startDate
        : formatDate(defaultStart);

    const endDate =
      options.endDate && /^\d{4}-\d{2}-\d{2}$/.test(options.endDate)
        ? options.endDate
        : formatDate(defaultEnd);

    // Validate that startDate <= endDate
    if (startDate > endDate) {
      const rangeErr: any = new Error(
        `Invalid date range: startDate (${startDate}) must be less than or equal to endDate (${endDate}).`
      );
      rangeErr.status = 400;
      throw rangeErr;
    }

    const rowLimit = Math.max(1, Math.min(options.rowLimit ?? 100, 1000));

    logger.info(
      `Querying Search Analytics for [${selectedProperty}] (${startDate} to ${endDate}, limit ${rowLimit})...`,
      'GscService'
    );

    let lastError: Error | null = null;
    let failedCount = 0;

    const handleSubQueryError = (name: string, err: any) => {
      logger.warn(`Failed to query GSC ${name}`, 'GscService', err);
      lastError = err instanceof Error ? err : new Error(String(err));
      failedCount++;

      const status = (err as any)?.status;
      // Immediately propagate 401 (unauthorized) and 403 (forbidden/unverified)
      if (status === 401 || status === 403) {
        throw err;
      }
      return [];
    };

    // Parallel requests: Summary aggregate, Query breakdown, Page breakdown, and Daily trend
    const [rawSummary, rawQueries, rawPages, rawDates] = await Promise.all([
      // 1. Overall property totals (no dimension)
      this.executeSearchAnalyticsQuery(selectedProperty, accessToken, {
        startDate,
        endDate,
        dimensions: [],
      }).catch((err) => handleSubQueryError('summary aggregate', err)),

      // 2. Query dimension breakdown
      this.executeSearchAnalyticsQuery(selectedProperty, accessToken, {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit,
      }).catch((err) => handleSubQueryError('query dimension', err)),

      // 3. Page dimension breakdown
      this.executeSearchAnalyticsQuery(selectedProperty, accessToken, {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit,
      }).catch((err) => handleSubQueryError('page dimension', err)),

      // 4. Daily date dimension breakdown
      this.executeSearchAnalyticsQuery(selectedProperty, accessToken, {
        startDate,
        endDate,
        dimensions: ['date'],
      }).catch((err) => handleSubQueryError('date dimension', err)),
    ]);

    // If all four sub-queries failed, propagate the error instead of returning empty zero data
    if (failedCount === 4 && lastError) {
      throw lastError;
    }

    const queries: GscQueryRow[] = rawQueries.map((r) => ({
      query: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Number((r.ctr || 0).toFixed(4)),
      position: Number((r.position || 0).toFixed(1)),
    }));

    const pages: GscPageRow[] = rawPages.map((r) => ({
      page: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Number((r.ctr || 0).toFixed(4)),
      position: Number((r.position || 0).toFixed(1)),
    }));

    const dates: GscDateRow[] = rawDates
      .map((r) => ({
        date: r.keys?.[0] || '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: Number((r.ctr || 0).toFixed(4)),
        position: Number((r.position || 0).toFixed(1)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate or map summary metrics
    let summaryClicks = 0;
    let summaryImpressions = 0;
    let summaryCtr = 0;
    let summaryPosition = 0;

    if (rawSummary.length > 0 && rawSummary[0]) {
      summaryClicks = rawSummary[0].clicks || 0;
      summaryImpressions = rawSummary[0].impressions || 0;
      summaryCtr = Number((rawSummary[0].ctr || 0).toFixed(4));
      summaryPosition = Number((rawSummary[0].position || 0).toFixed(1));
    } else if (dates.length > 0) {
      summaryClicks = dates.reduce((acc, d) => acc + d.clicks, 0);
      summaryImpressions = dates.reduce((acc, d) => acc + d.impressions, 0);
      summaryCtr = summaryImpressions > 0 ? Number((summaryClicks / summaryImpressions).toFixed(4)) : 0;
      summaryPosition = Number(
        (dates.reduce((acc, d) => acc + d.position, 0) / dates.length).toFixed(1)
      );
    }

    const summary: GscSearchAnalyticsSummary = {
      clicks: summaryClicks,
      impressions: summaryImpressions,
      ctr: summaryCtr,
      position: summaryPosition,
    };

    // Update lastSyncedAt on successful query
    await gscRepository.updateLastSynced().catch(() => {});

    return {
      property: selectedProperty,
      startDate,
      endDate,
      days,
      summary,
      queries,
      pages,
      dates,
    };
  }
}

export const gscService = new GscService();
