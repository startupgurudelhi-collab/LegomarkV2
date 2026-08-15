import { z } from 'zod';
import {
  serviceCategoryRepository,
  AdminCategoryItem,
  CreateCategoryData,
  UpdateCategoryData,
  ReorderCategoryItem,
} from '../repositories/service-category.repository';
import { logger } from '../utils/logger';

// Zod schema for Creating a Category
export const createCategorySchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Category ID cannot be empty')
    .max(64, 'Category ID cannot exceed 64 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Category ID must be URL-safe slug format (lowercase alphanumeric and single hyphens)'),
  name: z
    .string()
    .trim()
    .min(1, 'Category name cannot be empty')
    .max(128, 'Category name cannot exceed 128 characters'),
  shortLabel: z
    .string()
    .trim()
    .min(1, 'Category shortLabel cannot be empty')
    .max(64, 'Category shortLabel cannot exceed 64 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .nullable()
    .optional(),
  iconName: z
    .string()
    .trim()
    .min(1, 'Icon name cannot be empty')
    .max(64, 'Icon name cannot exceed 64 characters'),
  displayOrder: z
    .number()
    .int('Display order must be an integer')
    .nonnegative('Display order must be a non-negative integer')
    .default(0),
  isActive: z
    .boolean()
    .default(true),
});

// Zod schema for Updating Category Metadata (ID cannot be modified)
export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name cannot be empty')
    .max(128, 'Category name cannot exceed 128 characters'),
  shortLabel: z
    .string()
    .trim()
    .min(1, 'Category shortLabel cannot be empty')
    .max(64, 'Category shortLabel cannot exceed 64 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .nullable()
    .optional(),
  iconName: z
    .string()
    .trim()
    .min(1, 'Icon name cannot be empty')
    .max(64, 'Icon name cannot exceed 64 characters'),
  displayOrder: z
    .number()
    .int('Display order must be an integer')
    .nonnegative('Display order must be a non-negative integer')
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

// Zod schema for Status Toggle
export const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

// Zod schema for Bulk Reordering
export const reorderCategoriesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1, 'Category item ID cannot be empty'),
        displayOrder: z.number().int('displayOrder must be an integer').nonnegative('displayOrder must be non-negative'),
      })
    )
    .min(1, 'Items array must contain at least one element'),
});

export class ServiceCategoryService {
  /**
   * Fetch all categories for administrative review (active + inactive)
   */
  async getAllCategories(): Promise<AdminCategoryItem[]> {
    logger.info('Fetching all categories for admin...', 'ServiceCategoryService');
    return await serviceCategoryRepository.getAllCategories();
  }

  /**
   * Fetch single category by ID
   */
  async getCategoryById(id: string): Promise<AdminCategoryItem | null> {
    logger.info(`Fetching category by id: ${id}`, 'ServiceCategoryService');
    return await serviceCategoryRepository.findById(id);
  }

  /**
   * Create a new category with strict validation
   */
  async createCategory(payload: unknown, updatedBy?: string): Promise<AdminCategoryItem> {
    const parseResult = createCategorySchema.safeParse(payload);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues?.map((e: any) => e.message).join(', ') || parseResult.error.message;
      throw new Error(`Validation Error: ${errorMessages}`);
    }

    const data = parseResult.data;

    // Check uniqueness of ID
    const existing = await serviceCategoryRepository.findById(data.id);
    if (existing) {
      const err = new Error(`Category with ID '${data.id}' already exists.`);
      (err as any).statusCode = 409;
      throw err;
    }

    const createData: CreateCategoryData = {
      id: data.id,
      name: data.name,
      shortLabel: data.shortLabel,
      description: data.description || null,
      iconName: data.iconName,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    };

    logger.info(`Creating category: ${data.id}`, 'ServiceCategoryService');
    return await serviceCategoryRepository.createCategory(createData, updatedBy);
  }

  /**
   * Update existing category metadata
   */
  async updateCategory(id: string, payload: unknown, updatedBy?: string): Promise<AdminCategoryItem> {
    if (!id || typeof id !== 'string') {
      const err = new Error('Category ID is required');
      (err as any).statusCode = 400;
      throw err;
    }

    const parseResult = updateCategorySchema.safeParse(payload);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues?.map((e: any) => e.message).join(', ') || parseResult.error.message;
      throw new Error(`Validation Error: ${errorMessages}`);
    }

    const existing = await serviceCategoryRepository.findById(id);
    if (!existing) {
      const err = new Error(`Category not found with ID '${id}'`);
      (err as any).statusCode = 404;
      throw err;
    }

    const data = parseResult.data;
    const updateData: UpdateCategoryData = {
      name: data.name,
      shortLabel: data.shortLabel,
      description: data.description !== undefined ? data.description : null,
      iconName: data.iconName,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    };

    logger.info(`Updating category: ${id}`, 'ServiceCategoryService');
    const updated = await serviceCategoryRepository.updateCategory(id, updateData, updatedBy);
    if (!updated) {
      const err = new Error(`Failed to update category '${id}'`);
      (err as any).statusCode = 500;
      throw err;
    }

    return updated;
  }

  /**
   * Toggle category active status
   */
  async updateStatus(id: string, payload: unknown, updatedBy?: string): Promise<AdminCategoryItem> {
    if (!id || typeof id !== 'string') {
      const err = new Error('Category ID is required');
      (err as any).statusCode = 400;
      throw err;
    }

    const parseResult = updateStatusSchema.safeParse(payload);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues?.map((e: any) => e.message).join(', ') || parseResult.error.message;
      throw new Error(`Validation Error: ${errorMessages}`);
    }

    const existing = await serviceCategoryRepository.findById(id);
    if (!existing) {
      const err = new Error(`Category not found with ID '${id}'`);
      (err as any).statusCode = 404;
      throw err;
    }

    logger.info(`Updating category status for: ${id} to ${parseResult.data.isActive}`, 'ServiceCategoryService');
    const updated = await serviceCategoryRepository.updateStatus(id, parseResult.data.isActive, updatedBy);
    if (!updated) {
      const err = new Error(`Failed to update status for category '${id}'`);
      (err as any).statusCode = 500;
      throw err;
    }

    return updated;
  }

  /**
   * Bulk reorder categories inside one transaction
   */
  async reorderCategories(payload: unknown, updatedBy?: string): Promise<AdminCategoryItem[]> {
    const parseResult = reorderCategoriesSchema.safeParse(payload);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues?.map((e: any) => e.message).join(', ') || parseResult.error.message;
      throw new Error(`Validation Error: ${errorMessages}`);
    }

    const items = parseResult.data.items;

    // Validate that all referenced category IDs actually exist
    for (const item of items) {
      const existing = await serviceCategoryRepository.findById(item.id);
      if (!existing) {
        const err = new Error(`Category not found with ID '${item.id}' in reorder payload.`);
        (err as any).statusCode = 404;
        throw err;
      }
    }

    logger.info(`Reordering ${items.length} categories...`, 'ServiceCategoryService');
    return await serviceCategoryRepository.reorderCategories(items, updatedBy);
  }

  /**
   * Delete category safely (only if serviceCount === 0)
   */
  async deleteCategory(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      const err = new Error('Category ID is required');
      (err as any).statusCode = 400;
      throw err;
    }

    const existing = await serviceCategoryRepository.findById(id);
    if (!existing) {
      const err = new Error(`Category not found with ID '${id}'`);
      (err as any).statusCode = 404;
      throw err;
    }

    const serviceCount = await serviceCategoryRepository.getAttachedServicesCount(id);
    if (serviceCount > 0) {
      logger.warn(`Rejected deletion of category '${id}': ${serviceCount} services still attached`, 'ServiceCategoryService');
      const err = new Error('Category cannot be deleted while services are assigned to it.');
      (err as any).statusCode = 409;
      throw err;
    }

    logger.info(`Deleting empty category: ${id}`, 'ServiceCategoryService');
    const success = await serviceCategoryRepository.deleteCategory(id);
    if (!success) {
      const err = new Error(`Failed to delete category '${id}'`);
      (err as any).statusCode = 500;
      throw err;
    }
  }
}

export const serviceCategoryService = new ServiceCategoryService();
