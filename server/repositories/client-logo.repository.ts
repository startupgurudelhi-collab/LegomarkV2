import { getDatabase, pingDatabase } from '../config/database';
import { clientLogos, ClientLogo, NewClientLogo } from '../../db/schema/index';
import { eq, asc } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface CreateClientLogoDto {
  name: string;
  logoUrl: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateClientLogoDto {
  name?: string;
  logoUrl?: string;
  category?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// 32 Curated Enterprise Client Brands across Fintech, D2C, Healthcare, Tech, Infra & Manufacturing
export const DEFAULT_CLIENT_LOGOS_SEED: ClientLogo[] = [
  { id: '11111111-1111-4111-8111-000000000001', name: 'Razorpay Software', logoUrl: '', category: 'Fintech & Payments', isActive: true, displayOrder: 1, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000002', name: 'Zomato Limited', logoUrl: '', category: 'E-Commerce & Tech', isActive: true, displayOrder: 2, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000003', name: 'Swiggy Bundl Tech', logoUrl: '', category: 'Foodtech & Logistics', isActive: true, displayOrder: 3, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000004', name: 'Delhivery Logistics', logoUrl: '', category: 'Supply Chain & Logistics', isActive: true, displayOrder: 4, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000005', name: 'Groww Nextbillion', logoUrl: '', category: 'Fintech & Wealth', isActive: true, displayOrder: 5, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000006', name: 'Nykaa FSN E-Commerce', logoUrl: '', category: 'Beauty & Retail', isActive: true, displayOrder: 6, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000007', name: 'Mamaearth Honasa', logoUrl: '', category: 'D2C FMCG', isActive: true, displayOrder: 7, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000008', name: 'Lenskart Solutions', logoUrl: '', category: 'Omnichannel Retail', isActive: true, displayOrder: 8, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000009', name: 'PhonePe Financial', logoUrl: '', category: 'Digital Payments', isActive: true, displayOrder: 9, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000010', name: 'CRED Dreamplug Tech', logoUrl: '', category: 'Fintech & Rewards', isActive: true, displayOrder: 10, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000011', name: 'Zerodha Broking', logoUrl: '', category: 'Stock Broking', isActive: true, displayOrder: 11, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000012', name: 'Pine Labs Payments', logoUrl: '', category: 'Merchant Commerce', isActive: true, displayOrder: 12, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000013', name: 'Urban Company', logoUrl: '', category: 'Home Services', isActive: true, displayOrder: 13, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000014', name: 'CarDekho Girnar', logoUrl: '', category: 'Auto Tech', isActive: true, displayOrder: 14, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000015', name: 'PolicyBazaar PB Fin', logoUrl: '', category: 'Insurtech', isActive: true, displayOrder: 15, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000016', name: 'BharatPe Resilient', logoUrl: '', category: 'Fintech & QR', isActive: true, displayOrder: 16, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000017', name: 'Spinny Valuedrive', logoUrl: '', category: 'Used Car Platform', isActive: true, displayOrder: 17, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000018', name: 'Boat Imagine Marketing', logoUrl: '', category: 'Consumer Electronics', isActive: true, displayOrder: 18, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000019', name: 'Purplle Manash Lifestyle', logoUrl: '', category: 'E-Commerce Retail', isActive: true, displayOrder: 19, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000020', name: 'Ather Energy Electric', logoUrl: '', category: 'EV & Clean Energy', isActive: true, displayOrder: 20, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000021', name: 'Shadowfax Tech Logistics', logoUrl: '', category: 'Hyperlocal Logistics', isActive: true, displayOrder: 21, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000022', name: 'Shiprocket BigFoot', logoUrl: '', category: 'D2C Fulfillment', isActive: true, displayOrder: 22, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000023', name: 'Infra.Market Hella', logoUrl: '', category: 'Construction Tech', isActive: true, displayOrder: 23, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000024', name: 'BlackBuck Zinka Logistics', logoUrl: '', category: 'Trucking & Freight', isActive: true, displayOrder: 24, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000025', name: 'OfBusiness Oxyzo', logoUrl: '', category: 'B2B Raw Materials', isActive: true, displayOrder: 25, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000026', name: 'Cars24 Services', logoUrl: '', category: 'Auto Retail', isActive: true, displayOrder: 26, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000027', name: 'Rebel Foods Behrouz', logoUrl: '', category: 'Cloud Kitchens', isActive: true, displayOrder: 27, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000028', name: 'PharmEasy API Holdings', logoUrl: '', category: 'Health & Pharmacy', isActive: true, displayOrder: 28, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000029', name: '1mg Healthcare Tata', logoUrl: '', category: 'Digital Diagnostics', isActive: true, displayOrder: 29, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000030', name: 'HealthKart Bright Life', logoUrl: '', category: 'Nutrition & Health', isActive: true, displayOrder: 30, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000031', name: 'Zepto Kirana Tech', logoUrl: '', category: 'Quick Commerce', isActive: true, displayOrder: 31, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
  { id: '11111111-1111-4111-8111-000000000032', name: 'Blinkit Commerce', logoUrl: '', category: 'Instant Delivery', isActive: true, displayOrder: 32, createdAt: new Date(), updatedAt: new Date(), updatedBy: 'System Seed' },
];

class ClientLogoRepository {
  private inMemoryStore: ClientLogo[] = [];

  /**
   * Public: Get all active client logos sorted by display order
   */
  async getPublicLogos(): Promise<ClientLogo[]> {
    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(clientLogos)
          .where(eq(clientLogos.isActive, true))
          .orderBy(asc(clientLogos.displayOrder));

        return rows;
      } catch (err) {
        logger.error('Error fetching public client logos from DB', 'ClientLogoRepo', err);
      }
    }

    return this.inMemoryStore
      .filter((l) => l.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Admin: Get all client logos (both active and inactive) sorted by display order
   */
  async getAllLogos(): Promise<ClientLogo[]> {
    const dbStatus = await pingDatabase();
    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(clientLogos)
          .orderBy(asc(clientLogos.displayOrder));

        return rows;
      } catch (err) {
        logger.error('Error fetching admin client logos from DB', 'ClientLogoRepo', err);
      }
    }

    return [...this.inMemoryStore].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Admin: Create a single client logo record
   */
  async createLogo(dto: CreateClientLogoDto, authorUser = 'Admin'): Promise<ClientLogo> {
    const dbStatus = await pingDatabase();
    const now = new Date();

    const currentMaxOrder = this.inMemoryStore.length > 0
      ? Math.max(...this.inMemoryStore.map((l) => l.displayOrder))
      : 0;

    const displayOrder = dto.displayOrder ?? currentMaxOrder + 1;

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const inserted = await db
          .insert(clientLogos)
          .values({
            name: dto.name.trim(),
            logoUrl: dto.logoUrl.trim(),
            category: dto.category?.trim() || 'General Corporate',
            isActive: dto.isActive !== undefined ? dto.isActive : true,
            displayOrder,
            createdAt: now,
            updatedAt: now,
            updatedBy: authorUser,
          })
          .returning();

        if (inserted && inserted.length > 0) {
          this.inMemoryStore.push(inserted[0]);
          return inserted[0];
        }
      } catch (err) {
        logger.error('Error creating client logo in DB', 'ClientLogoRepo', err);
      }
    }

    const newLogo: ClientLogo = {
      id: `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: dto.name.trim(),
      logoUrl: dto.logoUrl.trim(),
      category: dto.category?.trim() || 'General Corporate',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      displayOrder,
      createdAt: now,
      updatedAt: now,
      updatedBy: authorUser,
    };

    this.inMemoryStore.push(newLogo);
    return newLogo;
  }

  /**
   * Admin: Update a single client logo record atomically
   */
  async updateLogo(id: string, dto: UpdateClientLogoDto, authorUser = 'Admin'): Promise<ClientLogo | null> {
    const dbStatus = await pingDatabase();
    const now = new Date();

    const patch: Partial<ClientLogo> = {
      updatedAt: now,
      updatedBy: authorUser,
    };

    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.logoUrl !== undefined) patch.logoUrl = dto.logoUrl.trim();
    if (dto.category !== undefined) patch.category = dto.category.trim();
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) patch.displayOrder = dto.displayOrder;

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const updated = await db
          .update(clientLogos)
          .set(patch)
          .where(eq(clientLogos.id, id as any))
          .returning();

        if (updated && updated.length > 0) {
          const index = this.inMemoryStore.findIndex((l) => l.id === id);
          if (index !== -1) {
            this.inMemoryStore[index] = updated[0];
          }
          return updated[0];
        }
      } catch (err) {
        logger.error(`Error updating client logo ${id} in DB`, 'ClientLogoRepo', err);
      }
    }

    const index = this.inMemoryStore.findIndex((l) => l.id === id);
    if (index === -1) return null;

    this.inMemoryStore[index] = {
      ...this.inMemoryStore[index],
      ...patch,
    };

    return this.inMemoryStore[index];
  }

  /**
   * Admin: Delete a single client logo record
   */
  async deleteLogo(id: string): Promise<boolean> {
    const dbStatus = await pingDatabase();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        await db.delete(clientLogos).where(eq(clientLogos.id, id as any));
      } catch (err) {
        logger.error(`Error deleting client logo ${id} from DB`, 'ClientLogoRepo', err);
      }
    }

    this.inMemoryStore = this.inMemoryStore.filter((l) => l.id !== id);
    return true;
  }

  /**
   * Admin: Persist reordered logo IDs safely
   */
  async reorderLogos(orderedIds: string[], authorUser = 'Admin'): Promise<ClientLogo[]> {
    const dbStatus = await pingDatabase();
    const now = new Date();

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        for (let i = 0; i < orderedIds.length; i++) {
          const targetId = orderedIds[i];
          await db
            .update(clientLogos)
            .set({
              displayOrder: i + 1,
              updatedAt: now,
              updatedBy: authorUser,
            })
            .where(eq(clientLogos.id, targetId as any));
        }
      } catch (err) {
        logger.error('Error reordering client logos in DB', 'ClientLogoRepo', err);
      }
    }

    // Update in-memory positions
    for (let i = 0; i < orderedIds.length; i++) {
      const targetId = orderedIds[i];
      const found = this.inMemoryStore.find((l) => l.id === targetId);
      if (found) {
        found.displayOrder = i + 1;
        found.updatedAt = now;
        found.updatedBy = authorUser;
      }
    }

    return [...this.inMemoryStore].sort((a, b) => a.displayOrder - b.displayOrder);
  }
}

export const clientLogoRepository = new ClientLogoRepository();
