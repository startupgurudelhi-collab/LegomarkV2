import { getDatabase, pingDatabase } from '../config/database';
import { gscConnections, GscConnection, NewGscConnection } from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

export type { GscConnection, NewGscConnection };

/**
 * ============================================================================
 * LACS Module #19: Google Search Console (GSC) Repository
 * ============================================================================
 *
 * Manages persistence for the singleton Google Search Console connection record.
 *
 * Security & Architectural Invariants:
 * 1. Ciphertext Only: Raw tokens are NEVER accepted, decrypted, or logged in this repository.
 *    Tokens are passed and stored purely as AES-256-GCM encrypted strings (`iv:tag:cipher`).
 * 2. Singleton Identity: Fixed primary key `id: 'default'` guarantees strictly one connection.
 * 3. Zero-Failure Fallback: In-memory fallback cache ensures uninterrupted execution if
 *    PostgreSQL is temporarily unavailable or during network partitions.
 * 4. Metadata-Safe Reads: Provides `getConnectionMetadata()` to safely expose non-sensitive
 *    connection status to controllers and admin APIs without token fields.
 */

export const GSC_SINGLETON_ID = 'default';

export interface SaveGscConnectionInput {
  connectedByAdminId?: string | null;
  connectedEmail?: string | null;
  selectedProperty?: string | null;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  tokenExpiry: Date;
  scope?: string | null;
  isConnected?: boolean;
  lastSyncedAt?: Date | null;
}

export interface GscConnectionMetadata {
  id: string;
  connectedByAdminId: string | null;
  connectedEmail: string | null;
  selectedProperty: string | null;
  tokenExpiry: Date | null;
  scope: string | null;
  isConnected: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GscRepository {
  private fallbackStore: GscConnection | null = null;

  /**
   * Internal helper to extract safe metadata from a connection record,
   * completely omitting encrypted token strings.
   */
  public toMetadata(record: GscConnection): GscConnectionMetadata {
    return {
      id: record.id,
      connectedByAdminId: record.connectedByAdminId,
      connectedEmail: record.connectedEmail,
      selectedProperty: record.selectedProperty,
      tokenExpiry: record.tokenExpiry,
      scope: record.scope,
      isConnected: record.isConnected,
      lastSyncedAt: record.lastSyncedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Retrieves the raw connection record (including encrypted tokens).
   * Strictly intended for internal server-side service calls requiring API authorization.
   */
  public async getConnection(): Promise<GscConnection | null> {
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(gscConnections)
          .where(eq(gscConnections.id, GSC_SINGLETON_ID))
          .limit(1);

        if (rows && rows.length > 0) {
          this.fallbackStore = rows[0];
          return rows[0];
        }
      } catch (err) {
        logger.error('Error querying gsc_connections from PostgreSQL', 'GscRepository', err);
      }
    }

    return this.fallbackStore;
  }

  /**
   * Retrieves connection metadata safe for exposure to admin controllers and UI.
   * Completely strips encrypted access and refresh tokens.
   */
  public async getConnectionMetadata(): Promise<GscConnectionMetadata | null> {
    const record = await this.getConnection();
    if (!record) return null;
    return this.toMetadata(record);
  }

  /**
   * Atomically upserts the singleton GSC connection record (`id: 'default'`).
   * Expects pre-encrypted tokens and syncs in-memory fallback store.
   */
  public async saveConnection(input: SaveGscConnectionInput): Promise<GscConnection> {
    const now = new Date();

    const mergedRecord: NewGscConnection = {
      id: GSC_SINGLETON_ID,
      connectedByAdminId: input.connectedByAdminId || null,
      connectedEmail: input.connectedEmail ? input.connectedEmail.trim() : null,
      selectedProperty: input.selectedProperty ? input.selectedProperty.trim() : null,
      encryptedAccessToken: input.encryptedAccessToken,
      encryptedRefreshToken: input.encryptedRefreshToken,
      tokenExpiry: input.tokenExpiry,
      scope: input.scope || 'https://www.googleapis.com/auth/webmasters.readonly',
      isConnected: input.isConnected !== undefined ? input.isConnected : true,
      lastSyncedAt: input.lastSyncedAt || null,
      createdAt: now,
      updatedAt: now,
    };

    const patch: Partial<NewGscConnection> = {
      connectedByAdminId: mergedRecord.connectedByAdminId,
      connectedEmail: mergedRecord.connectedEmail,
      selectedProperty: mergedRecord.selectedProperty,
      encryptedAccessToken: mergedRecord.encryptedAccessToken,
      encryptedRefreshToken: mergedRecord.encryptedRefreshToken,
      tokenExpiry: mergedRecord.tokenExpiry,
      scope: mergedRecord.scope,
      isConnected: mergedRecord.isConnected,
      lastSyncedAt: mergedRecord.lastSyncedAt,
      updatedAt: now,
    };

    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .insert(gscConnections)
          .values(mergedRecord)
          .onConflictDoUpdate({
            target: gscConnections.id,
            set: patch,
          })
          .returning();

        if (rows && rows.length > 0) {
          this.fallbackStore = rows[0];
          return rows[0];
        }
      } catch (err) {
        logger.error('Error saving gsc_connections to PostgreSQL', 'GscRepository', err);
      }
    }

    // In-memory fallback
    const fallbackItem: GscConnection = {
      id: GSC_SINGLETON_ID,
      connectedByAdminId: mergedRecord.connectedByAdminId ?? null,
      connectedEmail: mergedRecord.connectedEmail ?? null,
      selectedProperty: mergedRecord.selectedProperty ?? null,
      encryptedAccessToken: mergedRecord.encryptedAccessToken ?? null,
      encryptedRefreshToken: mergedRecord.encryptedRefreshToken ?? null,
      tokenExpiry: mergedRecord.tokenExpiry ?? null,
      scope: mergedRecord.scope ?? null,
      isConnected: mergedRecord.isConnected ?? true,
      lastSyncedAt: mergedRecord.lastSyncedAt ?? null,
      createdAt: this.fallbackStore?.createdAt || now,
      updatedAt: now,
    };
    this.fallbackStore = fallbackItem;
    return fallbackItem;
  }

  /**
   * Updates only the active selected property URL without modifying stored credentials.
   */
  public async updateSelectedProperty(propertyUrl: string): Promise<GscConnection | null> {
    const existing = await this.getConnection();
    if (!existing) return null;

    const now = new Date();
    const normalizedUrl = propertyUrl.trim();

    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .update(gscConnections)
          .set({
            selectedProperty: normalizedUrl,
            updatedAt: now,
          })
          .where(eq(gscConnections.id, GSC_SINGLETON_ID))
          .returning();

        if (rows && rows.length > 0) {
          this.fallbackStore = rows[0];
          return rows[0];
        }
      } catch (err) {
        logger.error('Error updating selectedProperty in PostgreSQL', 'GscRepository', err);
      }
    }

    if (this.fallbackStore) {
      this.fallbackStore = {
        ...this.fallbackStore,
        selectedProperty: normalizedUrl,
        updatedAt: now,
      };
    }
    return this.fallbackStore;
  }

  /**
   * Updates the lastSyncedAt timestamp after a successful Search Console sync.
   */
  public async updateLastSynced(syncedAt: Date = new Date()): Promise<void> {
    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        await db
          .update(gscConnections)
          .set({
            lastSyncedAt: syncedAt,
            updatedAt: new Date(),
          })
          .where(eq(gscConnections.id, GSC_SINGLETON_ID));
      } catch (err) {
        logger.error('Error updating lastSyncedAt in PostgreSQL', 'GscRepository', err);
      }
    }

    if (this.fallbackStore) {
      this.fallbackStore = {
        ...this.fallbackStore,
        lastSyncedAt: syncedAt,
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Cleanly disconnects the Google Search Console integration.
   * Clears stored encrypted tokens and flags `isConnected: false`.
   */
  public async disconnect(): Promise<void> {
    const now = new Date();
    const dbStatus = await pingDatabase();

    const patch = {
      isConnected: false,
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      tokenExpiry: null,
      selectedProperty: null,
      updatedAt: now,
    };

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        await db
          .update(gscConnections)
          .set(patch)
          .where(eq(gscConnections.id, GSC_SINGLETON_ID));
      } catch (err) {
        logger.error('Error disconnecting gsc_connections in PostgreSQL', 'GscRepository', err);
      }
    }

    if (this.fallbackStore) {
      this.fallbackStore = {
        ...this.fallbackStore,
        ...patch,
      };
    }

    logger.info('Google Search Console connection cleared and marked disconnected', 'GscRepository');
  }
}

export const gscRepository = new GscRepository();
