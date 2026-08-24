import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

export interface AssociationLogo {
  id: string;
  name: string;
  logoUrl: string;
  category: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

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
  // Purely independent Association Logos data store (starts empty; no fake records)
  private inMemoryStore: AssociationLogo[] = [];

  /**
   * Public: Get all active association logos sorted by display order
   */
  async getPublicLogos(): Promise<AssociationLogo[]> {
    return this.inMemoryStore
      .filter((l) => l.isActive && l.logoUrl && l.logoUrl.trim().length > 0)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Admin: Get all association logos (active and inactive) sorted by display order
   */
  async getAllLogos(): Promise<AssociationLogo[]> {
    return [...this.inMemoryStore].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * Admin: Get association logo by ID
   */
  async getLogoById(id: string): Promise<AssociationLogo | null> {
    const found = this.inMemoryStore.find((l) => l.id === id);
    return found || null;
  }

  /**
   * Admin: Create a single association logo record
   */
  async createLogo(dto: CreateAssociationLogoDto, authorUser = 'Admin'): Promise<AssociationLogo> {
    const now = new Date();
    const displayOrder =
      dto.displayOrder !== undefined && dto.displayOrder !== null
        ? dto.displayOrder
        : this.inMemoryStore.length + 1;

    const newRecord: AssociationLogo = {
      id: randomUUID(),
      name: dto.name.trim(),
      logoUrl: dto.logoUrl.trim(),
      category: (dto.category || 'Professional Association').trim(),
      isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
      displayOrder,
      createdAt: now,
      updatedAt: now,
      updatedBy: authorUser,
    };

    this.inMemoryStore.push(newRecord);
    logger.info(`Association logo created: ${newRecord.name} (${newRecord.id})`, 'AssociationLogoRepo');
    return newRecord;
  }

  /**
   * Admin: Update an association logo
   */
  async updateLogo(id: string, dto: UpdateAssociationLogoDto, authorUser = 'Admin'): Promise<AssociationLogo | null> {
    const index = this.inMemoryStore.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const existing = this.inMemoryStore[index];
    const now = new Date();

    const updated: AssociationLogo = {
      ...existing,
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      logoUrl: dto.logoUrl !== undefined ? dto.logoUrl.trim() : existing.logoUrl,
      category: dto.category !== undefined ? dto.category.trim() : existing.category,
      isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : existing.isActive,
      displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : existing.displayOrder,
      updatedAt: now,
      updatedBy: authorUser,
    };

    this.inMemoryStore[index] = updated;
    logger.info(`Association logo updated: ${updated.name} (${updated.id})`, 'AssociationLogoRepo');
    return updated;
  }

  /**
   * Admin: Delete an association logo
   */
  async deleteLogo(id: string): Promise<boolean> {
    const prevLen = this.inMemoryStore.length;
    this.inMemoryStore = this.inMemoryStore.filter((l) => l.id !== id);
    return this.inMemoryStore.length < prevLen;
  }

  /**
   * Admin: Reorder association logos
   */
  async reorderLogos(items: { id: string; displayOrder: number }[]): Promise<boolean> {
    for (const item of items) {
      const found = this.inMemoryStore.find((l) => l.id === item.id);
      if (found) {
        found.displayOrder = item.displayOrder;
        found.updatedAt = new Date();
      }
    }
    return true;
  }
}

export const associationLogoRepository = new AssociationLogoRepository();
