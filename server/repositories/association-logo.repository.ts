import { getDatabase, pingDatabase } from '../config/database';
import { associationLogos, AssociationLogo, NewAssociationLogo } from '../../db/schema/index';
import { eq, asc, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

export type { AssociationLogo, NewAssociationLogo };

export interface CreateAssociationLogoDto {
  name: string;
  logoUrl: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateAssociationLogoDto {
  name?: string;
  logoUrl?: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}

class AssociationLogoRepository {
  private inMemoryStore: AssociationLogo[] = [];
  private tableInitialized = false;

  /**
   * Idempotent table check to guarantee table exists even before manual migration CLI runs
   */
  private async ensureTable(): Promise<void> {
    if (this.tableInitialized) return;
    try {
      const dbStatus = await pingDatabase();
      if (dbStatus.connected) {
        const db = getDatabase();
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "association_logos" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "name" varchar(255) NOT NULL,
            "logo_url" varchar(512) NOT NULL,
            "category" varchar(100) DEFAULT 'Professional Association' NOT NULL,
            "is_active" boolean DEFAULT true NOT NULL,
            "display_order" integer DEFAULT 1 NOT NULL,
            "created_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
            "updated_by" varchar(128)
          );
          CREATE INDEX IF NOT EXISTS "association_logos_is_active_idx" ON "association_logos" ("is_active");
          CREATE INDEX IF NOT EXISTS "association_logos_display_order_idx" ON "association_logos" ("display_order");
        `);
        this.tableInitialized = true;
      }
    } catch (err) {
      logger.warn('Could not auto-verify association_logos table, falling back to standard Drizzle schema mapping', 'AssociationLogoRepo', err);
    }
  }

  /**
   * Public: Get all active association logos sorted by display order
   */
  async getPublicLogos(): Promise<AssociationLogo[]> {
    await this.ensureTable();
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(associationLogos)
          .where(eq(associationLogos.isActive, true))
          .orderBy(asc(associationLogos.displayOrder));

        return rows.filter((l) => l.logoUrl && l.logoUrl.trim().length > 0);
      } catch (err) {
        logger.error('Error fetching public association logos from DB', 'AssociationLogoRepo', err);
      }
    }

    return this.inMemoryStore
      .filter((l) => l.isActive && l.logoUrl && l.logoUrl.trim().length > 0)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Admin: Get all association logos (active and inactive) sorted by display order
   */
  async getAllLogos(): Promise<AssociationLogo[]> {
    await this.ensureTable();
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(associationLogos)
          .orderBy(asc(associationLogos.displayOrder));

        return rows;
      } catch (err) {
        logger.error('Error fetching admin association logos from DB', 'AssociationLogoRepo', err);
      }
    }

    return [...this.inMemoryStore].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Admin: Get association logo by ID
   */
  async getLogoById(id: string): Promise<AssociationLogo | null> {
    await this.ensureTable();
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(associationLogos)
          .where(eq(associationLogos.id, id as any))
          .limit(1);

        if (rows && rows.length > 0) {
          return rows[0];
        }
      } catch (err) {
        logger.error(`Error fetching association logo by ID ${id} from DB`, 'AssociationLogoRepo', err);
      }
    }

    const found = this.inMemoryStore.find((l) => l.id === id);
    return found || null;
  }

  /**
   * Admin: Create a single association logo record
   */
  async createLogo(dto: CreateAssociationLogoDto, authorUser = 'Admin'): Promise<AssociationLogo> {
    await this.ensureTable();
    const dbStatus = await pingDatabase();
    const now = new Date();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        let displayOrder = dto.displayOrder;
        if (displayOrder === undefined || displayOrder === null) {
          const rows = await db
            .select({ displayOrder: associationLogos.displayOrder })
            .from(associationLogos);
          const maxOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.displayOrder)) : 0;
          displayOrder = maxOrder + 1;
        }

        const inserted = await db
          .insert(associationLogos)
          .values({
            name: dto.name.trim(),
            logoUrl: dto.logoUrl.trim(),
            category: (dto.category || 'Professional Association').trim(),
            isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
            displayOrder,
            createdAt: now,
            updatedAt: now,
            updatedBy: authorUser,
          })
          .returning();

        if (inserted && inserted.length > 0) {
          this.inMemoryStore.push(inserted[0]);
          logger.info(`Association logo created in DB: ${inserted[0].name} (${inserted[0].id})`, 'AssociationLogoRepo');
          return inserted[0];
        }
      } catch (err) {
        logger.error('Error creating association logo in DB', 'AssociationLogoRepo', err);
      }
    }

    const currentMaxOrder = this.inMemoryStore.length > 0
      ? Math.max(...this.inMemoryStore.map((l) => l.displayOrder))
      : 0;
    const fallbackDisplayOrder = dto.displayOrder ?? currentMaxOrder + 1;

    const newRecord: AssociationLogo = {
      id: randomUUID(),
      name: dto.name.trim(),
      logoUrl: dto.logoUrl.trim(),
      category: (dto.category || 'Professional Association').trim(),
      isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
      displayOrder: fallbackDisplayOrder,
      createdAt: now,
      updatedAt: now,
      updatedBy: authorUser,
    };

    this.inMemoryStore.push(newRecord);
    logger.info(`Association logo created in memory fallback: ${newRecord.name} (${newRecord.id})`, 'AssociationLogoRepo');
    return newRecord;
  }

  /**
   * Admin: Update an association logo
   */
  async updateLogo(id: string, dto: UpdateAssociationLogoDto, authorUser = 'Admin'): Promise<AssociationLogo | null> {
    await this.ensureTable();
    const dbStatus = await pingDatabase();
    const now = new Date();

    const patch: Partial<AssociationLogo> = {
      updatedAt: now,
      updatedBy: authorUser,
    };

    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.logoUrl !== undefined) patch.logoUrl = dto.logoUrl.trim();
    if (dto.category !== undefined) patch.category = dto.category.trim();
    if (dto.isActive !== undefined) patch.isActive = Boolean(dto.isActive);
    if (dto.displayOrder !== undefined) patch.displayOrder = dto.displayOrder;

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const updated = await db
          .update(associationLogos)
          .set(patch)
          .where(eq(associationLogos.id, id as any))
          .returning();

        if (updated && updated.length > 0) {
          const index = this.inMemoryStore.findIndex((l) => l.id === id);
          if (index !== -1) {
            this.inMemoryStore[index] = updated[0];
          }
          logger.info(`Association logo updated in DB: ${updated[0].name} (${updated[0].id})`, 'AssociationLogoRepo');
          return updated[0];
        }
      } catch (err) {
        logger.error(`Error updating association logo ${id} in DB`, 'AssociationLogoRepo', err);
      }
    }

    const index = this.inMemoryStore.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const existing = this.inMemoryStore[index];
    const updatedInMemory: AssociationLogo = {
      ...existing,
      ...patch,
    };

    this.inMemoryStore[index] = updatedInMemory;
    logger.info(`Association logo updated in memory fallback: ${updatedInMemory.name} (${updatedInMemory.id})`, 'AssociationLogoRepo');
    return updatedInMemory;
  }

  /**
   * Admin: Delete an association logo
   */
  async deleteLogo(id: string): Promise<boolean> {
    await this.ensureTable();
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        await db.delete(associationLogos).where(eq(associationLogos.id, id as any));
        this.inMemoryStore = this.inMemoryStore.filter((l) => l.id !== id);
        logger.info(`Association logo deleted from DB: ${id}`, 'AssociationLogoRepo');
        return true;
      } catch (err) {
        logger.error(`Error deleting association logo ${id} from DB`, 'AssociationLogoRepo', err);
        return false;
      }
    }

    const prevLen = this.inMemoryStore.length;
    this.inMemoryStore = this.inMemoryStore.filter((l) => l.id !== id);
    return this.inMemoryStore.length < prevLen;
  }

  /**
   * Admin: Reorder association logos
   */
  async reorderLogos(items: { id: string; displayOrder: number }[], authorUser = 'Admin'): Promise<boolean> {
    await this.ensureTable();
    const dbStatus = await pingDatabase();
    const now = new Date();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        for (const item of items) {
          await db
            .update(associationLogos)
            .set({
              displayOrder: item.displayOrder,
              updatedAt: now,
              updatedBy: authorUser,
            })
            .where(eq(associationLogos.id, item.id as any));
        }
        logger.info(`Association logos reordered in DB (${items.length} items)`, 'AssociationLogoRepo');
        return true;
      } catch (err) {
        logger.error('Error reordering association logos in DB', 'AssociationLogoRepo', err);
      }
    }

    for (const item of items) {
      const found = this.inMemoryStore.find((l) => l.id === item.id);
      if (found) {
        found.displayOrder = item.displayOrder;
        found.updatedAt = now;
        found.updatedBy = authorUser;
      }
    }
    return true;
  }
}

export const associationLogoRepository = new AssociationLogoRepository();
