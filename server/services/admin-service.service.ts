import { z } from 'zod';
import {
  adminServiceRepository,
  AdminServiceItem,
  CreateServiceInput,
  UpdateServiceInput,
  ReorderServiceItem,
} from '../repositories/admin-service.repository';
import { logger } from '../utils/logger';

// Supported canonical pricing types
export const validPricingTypes = ['fixed', 'recurring', 'custom'] as const;

// Zod Schema for Service Creation
export const createServiceSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Service ID cannot be empty')
    .max(64, 'Service ID cannot exceed 64 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Service ID must be URL-safe slug format (lowercase alphanumeric and single hyphens)'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug cannot be empty')
    .max(96, 'Slug cannot exceed 96 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe slug format (lowercase alphanumeric and single hyphens)'),
  categoryId: z
    .string()
    .trim()
    .min(1, 'Category ID is required'),
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters'),
  shortLabel: z
    .string()
    .trim()
    .max(64, 'Short label cannot exceed 64 characters')
    .nullable()
    .optional(),
  shortDesc: z
    .string()
    .trim()
    .min(1, 'Short description cannot be empty')
    .max(1000, 'Short description cannot exceed 1000 characters'),
  fullDesc: z
    .string()
    .trim()
    .optional(),
  startingPrice: z
    .string()
    .trim()
    .min(1, 'Starting price is required'),
  priceAmount: z
    .union([z.string(), z.number()])
    .optional(),
  currency: z
    .string()
    .trim()
    .default('INR'),
  pricingType: z
    .enum(validPricingTypes, {
      message: `Pricing type must be one of: ${validPricingTypes.join(', ')}`,
    })
    .default('fixed'),
  priceDisplayOverride: z
    .string()
    .trim()
    .nullable()
    .optional(),
  governmentFeeNote: z
    .string()
    .trim()
    .max(500, 'Government fee note cannot exceed 500 characters')
    .nullable()
    .optional(),
  timeline: z
    .string()
    .trim()
    .min(1, 'Timeline is required')
    .max(100, 'Timeline cannot exceed 100 characters'),
  popular: z
    .boolean()
    .default(false),
  badge: z
    .string()
    .trim()
    .max(50, 'Badge cannot exceed 50 characters')
    .nullable()
    .optional(),
  iconName: z
    .string()
    .trim()
    .min(1, 'Icon name cannot be empty')
    .max(64, 'Icon name cannot exceed 64 characters')
    .default('Building2'),
  displayOrder: z
    .number()
    .int('Display order must be an integer')
    .nonnegative('Display order must be a non-negative integer')
    .default(0),
  isActive: z
    .boolean()
    .default(true),
  headline: z
    .string()
    .trim()
    .nullable()
    .optional(),
  overview: z
    .string()
    .trim()
    .nullable()
    .optional(),
  aliases: z
    .array(z.string().trim())
    .optional(),
  seoTitle: z
    .string()
    .trim()
    .max(255, 'SEO title cannot exceed 255 characters')
    .nullable()
    .optional(),
  metaDescription: z
    .string()
    .trim()
    .max(1000, 'Meta description cannot exceed 1000 characters')
    .nullable()
    .optional(),
});

// Zod Schema for Service Updates (ID is immutable)
export const updateServiceSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug cannot be empty')
    .max(96, 'Slug cannot exceed 96 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe slug format (lowercase alphanumeric and single hyphens)'),
  categoryId: z
    .string()
    .trim()
    .min(1, 'Category ID is required'),
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters'),
  shortLabel: z
    .string()
    .trim()
    .max(64, 'Short label cannot exceed 64 characters')
    .nullable()
    .optional(),
  shortDesc: z
    .string()
    .trim()
    .min(1, 'Short description cannot be empty')
    .max(1000, 'Short description cannot exceed 1000 characters'),
  fullDesc: z
    .string()
    .trim()
    .optional(),
  startingPrice: z
    .string()
    .trim()
    .min(1, 'Starting price is required'),
  priceAmount: z
    .union([z.string(), z.number()])
    .optional(),
  currency: z
    .string()
    .trim()
    .default('INR'),
  pricingType: z
    .enum(validPricingTypes, {
      message: `Pricing type must be one of: ${validPricingTypes.join(', ')}`,
    }),
  priceDisplayOverride: z
    .string()
    .trim()
    .nullable()
    .optional(),
  governmentFeeNote: z
    .string()
    .trim()
    .max(500, 'Government fee note cannot exceed 500 characters')
    .nullable()
    .optional(),
  timeline: z
    .string()
    .trim()
    .min(1, 'Timeline is required')
    .max(100, 'Timeline cannot exceed 100 characters'),
  popular: z
    .boolean()
    .optional(),
  badge: z
    .string()
    .trim()
    .max(50, 'Badge cannot exceed 50 characters')
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
  headline: z
    .string()
    .trim()
    .nullable()
    .optional(),
  overview: z
    .string()
    .trim()
    .nullable()
    .optional(),
  aliases: z
    .array(z.string().trim())
    .optional(),
  seoTitle: z
    .string()
    .trim()
    .max(255, 'SEO title cannot exceed 255 characters')
    .nullable()
    .optional(),
  metaDescription: z
    .string()
    .trim()
    .max(1000, 'Meta description cannot exceed 1000 characters')
    .nullable()
    .optional(),
});

// Zod Schema for Status Toggle
export const updateServiceStatusSchema = z.object({
  isActive: z.boolean(),
});

// Zod Schema for Reordering
export const reorderServicesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1, 'Service ID cannot be empty'),
        categoryId: z.string().trim().optional(),
        displayOrder: z.number().int('displayOrder must be an integer').nonnegative('displayOrder must be non-negative'),
      })
    )
    .min(1, 'Items array must contain at least one element'),
});

export class AdminServiceService {
  /**
   * Fetch all services for admin (active & inactive)
   */
  async getAllServices(): Promise<AdminServiceItem[]> {
    logger.info('Fetching all services for admin...', 'AdminServiceService');
    return await adminServiceRepository.getAllAdminServices();
  }

  /**
   * Fetch single service by ID
   */
  async getServiceById(id: string): Promise<AdminServiceItem | null> {
    logger.info(`Fetching service by id: ${id}`, 'AdminServiceService');
    return await adminServiceRepository.findById(id);
  }

  /**
   * Create a new service
   */
  async createService(payload: unknown, updatedBy?: string): Promise<AdminServiceItem> {
    const parseResult = createServiceSchema.safeParse(payload);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues?.map((e: any) => e.message).join(', ') || parseResult.error.message;
      const err = new Error(`Validation Error: ${errorMessages}`);
      (err as any).statusCode = 400;
      throw err;
    }

    const data = parseResult.data;

    // Validate ID uniqueness
    const existingById = await adminServiceRepository.findById(data.id);
    if (existingById) {
      const err = new Error(`Service with ID '${data.id}' already exists.`);
      (err as any).statusCode = 409;
      throw err;
    }

    // Validate Slug uniqueness
    const existingBySlug = await adminServiceRepository.findBySlug(data.slug);
    if (existingBySlug) {
      const err = new Error(`Service with slug '${data.slug}' already exists.`);
      (err as any).statusCode = 409;
      throw err;
    }

    // Validate Category existence
    const catExists = await adminServiceRepository.categoryExists(data.categoryId);
    if (!catExists) {
      const err = new Error(`Category with ID '${data.categoryId}' does not exist.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const createData: CreateServiceInput = {
      id: data.id,
      slug: data.slug,
      categoryId: data.categoryId,
      title: data.title,
      shortLabel: data.shortLabel || null,
      shortDesc: data.shortDesc,
      fullDesc: data.fullDesc || data.shortDesc,
      startingPrice: data.startingPrice,
      priceAmount: data.priceAmount,
      currency: data.currency,
      pricingType: data.pricingType,
      priceDisplayOverride: data.priceDisplayOverride || null,
      governmentFeeNote: data.governmentFeeNote || null,
      timeline: data.timeline,
      popular: data.popular,
      badge: data.badge || null,
      iconName: data.iconName,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      headline: data.headline || null,
      overview: data.overview || null,
      aliases: data.aliases || [],
      seoTitle: data.seoTitle || `${data.title} | LEGOMARK INDIA`,
      metaDescription: data.metaDescription || data.shortDesc,
    };

    logger.info(`Creating service: ${data.id} (slug: ${data.slug})`, 'AdminServiceService');
    return await adminServiceRepository.createService(createData, updatedBy);
  }

  /**
   * Update service metadata (ID remains unchanged)
   */
  async updateService(id: string, payload: unknown, updatedBy?: string): Promise<AdminServiceItem> {
    if (!id || typeof id !== 'string') {
      const err = new Error('Service ID is required');
      (err as any).statusCode = 400;
      throw err;
    }

    const parseResult = updateServiceSchema.safeParse(payload);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues?.map((e: any) => e.message).join(', ') || parseResult.error.message;
      const err = new Error(`Validation Error: ${errorMessages}`);
      (err as any).statusCode = 400;
      throw err;
    }

    const existing = await adminServiceRepository.findById(id);
    if (!existing) {
      const err = new Error(`Service not found with ID '${id}'`);
      (err as any).statusCode = 404;
      throw err;
    }

    const data = parseResult.data;

    // Validate Slug uniqueness if changed
    if (data.slug !== existing.slug) {
      const existingWithSlug = await adminServiceRepository.findBySlug(data.slug);
      if (existingWithSlug && existingWithSlug.id !== id) {
        const err = new Error(`Service with slug '${data.slug}' already exists.`);
        (err as any).statusCode = 409;
        throw err;
      }
    }

    // Validate Category existence
    const catExists = await adminServiceRepository.categoryExists(data.categoryId);
    if (!catExists) {
      const err = new Error(`Category with ID '${data.categoryId}' does not exist.`);
      (err as any).statusCode = 404;
      throw err;
    }

    const updateData: UpdateServiceInput = {
      slug: data.slug,
      categoryId: data.categoryId,
      title: data.title,
      shortLabel: data.shortLabel !== undefined ? data.shortLabel : null,
      shortDesc: data.shortDesc,
      fullDesc: data.fullDesc !== undefined ? data.fullDesc : data.shortDesc,
      startingPrice: data.startingPrice,
      priceAmount: data.priceAmount,
      currency: data.currency,
      pricingType: data.pricingType,
      priceDisplayOverride: data.priceDisplayOverride !== undefined ? data.priceDisplayOverride : null,
      governmentFeeNote: data.governmentFeeNote !== undefined ? data.governmentFeeNote : null,
      timeline: data.timeline,
      popular: data.popular,
      badge: data.badge !== undefined ? data.badge : null,
      iconName: data.iconName,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      headline: data.headline !== undefined ? data.headline : null,
      overview: data.overview !== undefined ? data.overview : null,
      aliases: data.aliases !== undefined ? data.aliases : [],
      seoTitle: data.seoTitle !== undefined ? data.seoTitle : `${data.title} | LEGOMARK INDIA`,
      metaDescription: data.metaDescription !== undefined ? data.metaDescription : data.shortDesc,
    };

    logger.info(`Updating service metadata: ${id}`, 'AdminServiceService');
    const updated = await adminServiceRepository.updateService(id, updateData, updatedBy);
    if (!updated) {
      const err = new Error(`Failed to update service '${id}'`);
      (err as any).statusCode = 500;
      throw err;
    }

    return updated;
  }

  /**
   * Toggle service active status
   */
  async updateStatus(id: string, payload: unknown, updatedBy?: string): Promise<AdminServiceItem> {
    if (!id || typeof id !== 'string') {
      const err = new Error('Service ID is required');
      (err as any).statusCode = 400;
      throw err;
    }

    const parseResult = updateServiceStatusSchema.safeParse(payload);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues?.map((e: any) => e.message).join(', ') || parseResult.error.message;
      const err = new Error(`Validation Error: ${errorMessages}`);
      (err as any).statusCode = 400;
      throw err;
    }

    const existing = await adminServiceRepository.findById(id);
    if (!existing) {
      const err = new Error(`Service not found with ID '${id}'`);
      (err as any).statusCode = 404;
      throw err;
    }

    logger.info(`Updating service active status for ${id} to ${parseResult.data.isActive}`, 'AdminServiceService');
    const updated = await adminServiceRepository.updateStatus(id, parseResult.data.isActive, updatedBy);
    if (!updated) {
      const err = new Error(`Failed to update status for service '${id}'`);
      (err as any).statusCode = 500;
      throw err;
    }

    return updated;
  }

  /**
   * Reorder services across categories in one atomic transaction
   */
  async reorderServices(payload: unknown, updatedBy?: string): Promise<AdminServiceItem[]> {
    const parseResult = reorderServicesSchema.safeParse(payload);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues?.map((e: any) => e.message).join(', ') || parseResult.error.message;
      const err = new Error(`Validation Error: ${errorMessages}`);
      (err as any).statusCode = 400;
      throw err;
    }

    const items = parseResult.data.items;

    // Check all services exist
    for (const item of items) {
      const existing = await adminServiceRepository.findById(item.id);
      if (!existing) {
        const err = new Error(`Service not found with ID '${item.id}' in reorder payload.`);
        (err as any).statusCode = 404;
        throw err;
      }
      if (item.categoryId) {
        const catExists = await adminServiceRepository.categoryExists(item.categoryId);
        if (!catExists) {
          const err = new Error(`Category not found with ID '${item.categoryId}' for service '${item.id}'.`);
          (err as any).statusCode = 404;
          throw err;
        }
      }
    }

    logger.info(`Reordering ${items.length} services...`, 'AdminServiceService');
    return await adminServiceRepository.reorderServices(items, updatedBy);
  }

  /**
   * Safely delete a service (child records cascade)
   */
  async deleteService(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      const err = new Error('Service ID is required');
      (err as any).statusCode = 400;
      throw err;
    }

    const existing = await adminServiceRepository.findById(id);
    if (!existing) {
      const err = new Error(`Service not found with ID '${id}'`);
      (err as any).statusCode = 404;
      throw err;
    }

    logger.info(`Deleting service: ${id}`, 'AdminServiceService');
    const success = await adminServiceRepository.deleteService(id);
    if (!success) {
      const err = new Error(`Failed to delete service '${id}'`);
      (err as any).statusCode = 500;
      throw err;
    }
  }
}

export const adminServiceService = new AdminServiceService();
