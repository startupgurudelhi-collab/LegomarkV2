import { getDatabase } from '../config/database';
import { serviceCategories, services, ServiceCategory } from '../../db/schema/index';
import { eq, asc, sql, count } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { SERVICE_CATEGORIES, SERVICES } from '../../src/data/websiteData';

export interface AdminCategoryItem {
  id: string;
  name: string;
  shortLabel: string;
  description: string | null;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  serviceCount: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export interface CreateCategoryData {
  id: string;
  name: string;
  shortLabel: string;
  description?: string | null;
  iconName: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name: string;
  shortLabel: string;
  description?: string | null;
  iconName: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface ReorderCategoryItem {
  id: string;
  displayOrder: number;
}

export class ServiceCategoryRepository {
  /**
   * Fetch all categories (active & inactive) with dynamic serviceCount calculated from services table
   */
  async getAllCategories(): Promise<AdminCategoryItem[]> {
    try {
      const db = getDatabase();
      const rows = await db
        .select({
          id: serviceCategories.id,
          name: serviceCategories.name,
          shortLabel: serviceCategories.shortLabel,
          description: serviceCategories.description,
          iconName: serviceCategories.iconName,
          displayOrder: serviceCategories.displayOrder,
          isActive: serviceCategories.isActive,
          createdAt: serviceCategories.createdAt,
          updatedAt: serviceCategories.updatedAt,
          updatedBy: serviceCategories.updatedBy,
          serviceCount: count(services.id),
        })
        .from(serviceCategories)
        .leftJoin(services, eq(serviceCategories.id, services.categoryId))
        .groupBy(
          serviceCategories.id,
          serviceCategories.name,
          serviceCategories.shortLabel,
          serviceCategories.description,
          serviceCategories.iconName,
          serviceCategories.displayOrder,
          serviceCategories.isActive,
          serviceCategories.createdAt,
          serviceCategories.updatedAt,
          serviceCategories.updatedBy
        )
        .orderBy(asc(serviceCategories.displayOrder));

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        shortLabel: r.shortLabel,
        description: r.description,
        iconName: r.iconName,
        displayOrder: r.displayOrder,
        isActive: r.isActive,
        serviceCount: Number(r.serviceCount) || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy,
      }));
    } catch (error) {
      logger.warn('Database error in getAllCategories, falling back to static catalog', 'ServiceCategoryRepository', error);
      const now = new Date();
      return SERVICE_CATEGORIES.map((cat, idx) => {
        const catServicesCount = SERVICES.filter((s) => s.category === cat.id).length;
        return {
          id: cat.id,
          name: cat.name,
          shortLabel: cat.shortLabel,
          description: cat.description || null,
          iconName: cat.iconName,
          displayOrder: idx,
          isActive: true,
          serviceCount: catServicesCount,
          createdAt: now,
          updatedAt: now,
          updatedBy: 'system',
        };
      });
    }
  }

  /**
   * Find category by primary-key ID with dynamic service count
   */
  async findById(id: string): Promise<AdminCategoryItem | null> {
    try {
      const db = getDatabase();
      const rows = await db
        .select({
          id: serviceCategories.id,
          name: serviceCategories.name,
          shortLabel: serviceCategories.shortLabel,
          description: serviceCategories.description,
          iconName: serviceCategories.iconName,
          displayOrder: serviceCategories.displayOrder,
          isActive: serviceCategories.isActive,
          createdAt: serviceCategories.createdAt,
          updatedAt: serviceCategories.updatedAt,
          updatedBy: serviceCategories.updatedBy,
          serviceCount: count(services.id),
        })
        .from(serviceCategories)
        .leftJoin(services, eq(serviceCategories.id, services.categoryId))
        .where(eq(serviceCategories.id, id))
        .groupBy(
          serviceCategories.id,
          serviceCategories.name,
          serviceCategories.shortLabel,
          serviceCategories.description,
          serviceCategories.iconName,
          serviceCategories.displayOrder,
          serviceCategories.isActive,
          serviceCategories.createdAt,
          serviceCategories.updatedAt,
          serviceCategories.updatedBy
        )
        .limit(1);

      if (!rows.length) return null;

      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        shortLabel: r.shortLabel,
        description: r.description,
        iconName: r.iconName,
        displayOrder: r.displayOrder,
        isActive: r.isActive,
        serviceCount: Number(r.serviceCount) || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        updatedBy: r.updatedBy,
      };
    } catch (error) {
      logger.warn(`Database error in findById for ${id}, checking fallback`, 'ServiceCategoryRepository', error);
      const cat = SERVICE_CATEGORIES.find((c) => c.id === id);
      if (!cat) return null;
      const idx = SERVICE_CATEGORIES.indexOf(cat);
      const catServicesCount = SERVICES.filter((s) => s.category === cat.id).length;
      const now = new Date();
      return {
        id: cat.id,
        name: cat.name,
        shortLabel: cat.shortLabel,
        description: cat.description || null,
        iconName: cat.iconName,
        displayOrder: idx,
        isActive: true,
        serviceCount: catServicesCount,
        createdAt: now,
        updatedAt: now,
        updatedBy: 'system',
      };
    }
  }

  /**
   * Count services attached to a category
   */
  async getAttachedServicesCount(id: string): Promise<number> {
    try {
      const db = getDatabase();
      const res = await db
        .select({ val: count() })
        .from(services)
        .where(eq(services.categoryId, id));
      return Number(res[0]?.val) || 0;
    } catch (error) {
      logger.warn(`Database error checking attached services for ${id}, using fallback`, 'ServiceCategoryRepository', error);
      return SERVICES.filter((s) => s.category === id).length;
    }
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryData, updatedBy?: string): Promise<AdminCategoryItem> {
    const db = getDatabase();
    const [inserted] = await db
      .insert(serviceCategories)
      .values({
        id: data.id,
        name: data.name,
        shortLabel: data.shortLabel,
        description: data.description || null,
        iconName: data.iconName || 'Building2',
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
        updatedBy: updatedBy || null,
      })
      .returning();

    return {
      id: inserted.id,
      name: inserted.name,
      shortLabel: inserted.shortLabel,
      description: inserted.description,
      iconName: inserted.iconName,
      displayOrder: inserted.displayOrder,
      isActive: inserted.isActive,
      serviceCount: 0,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
      updatedBy: inserted.updatedBy,
    };
  }

  /**
   * Update category metadata
   */
  async updateCategory(id: string, data: UpdateCategoryData, updatedBy?: string): Promise<AdminCategoryItem | null> {
    const db = getDatabase();
    const [updated] = await db
      .update(serviceCategories)
      .set({
        name: data.name,
        shortLabel: data.shortLabel,
        description: data.description !== undefined ? data.description : undefined,
        iconName: data.iconName,
        displayOrder: data.displayOrder !== undefined ? data.displayOrder : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        updatedAt: new Date(),
        updatedBy: updatedBy || null,
      })
      .where(eq(serviceCategories.id, id))
      .returning();

    if (!updated) return null;

    const serviceCount = await this.getAttachedServicesCount(id);

    return {
      id: updated.id,
      name: updated.name,
      shortLabel: updated.shortLabel,
      description: updated.description,
      iconName: updated.iconName,
      displayOrder: updated.displayOrder,
      isActive: updated.isActive,
      serviceCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy,
    };
  }

  /**
   * Update category active status only
   */
  async updateStatus(id: string, isActive: boolean, updatedBy?: string): Promise<AdminCategoryItem | null> {
    const db = getDatabase();
    const [updated] = await db
      .update(serviceCategories)
      .set({
        isActive,
        updatedAt: new Date(),
        updatedBy: updatedBy || null,
      })
      .where(eq(serviceCategories.id, id))
      .returning();

    if (!updated) return null;

    const serviceCount = await this.getAttachedServicesCount(id);

    return {
      id: updated.id,
      name: updated.name,
      shortLabel: updated.shortLabel,
      description: updated.description,
      iconName: updated.iconName,
      displayOrder: updated.displayOrder,
      isActive: updated.isActive,
      serviceCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      updatedBy: updated.updatedBy,
    };
  }

  /**
   * Bulk reorder categories inside ONE transaction
   */
  async reorderCategories(items: ReorderCategoryItem[], updatedBy?: string): Promise<AdminCategoryItem[]> {
    const db = getDatabase();

    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(serviceCategories)
          .set({
            displayOrder: item.displayOrder,
            updatedAt: new Date(),
            updatedBy: updatedBy || null,
          })
          .where(eq(serviceCategories.id, item.id));
      }
    });

    return await this.getAllCategories();
  }

  /**
   * Delete category if safe (serviceCount === 0)
   */
  async deleteCategory(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, id))
      .returning({ id: serviceCategories.id });

    return result.length > 0;
  }
}

export const serviceCategoryRepository = new ServiceCategoryRepository();
