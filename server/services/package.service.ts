import { packageRepository, PackageWithFeatures, DynamicMatrixResponse, CreatePackageData, UpdatePackageData, ReorderPackageItem } from '../repositories/package.repository';
import { logger } from '../utils/logger';

export interface FormattedPublicPackage {
  id: string;
  name: string;
  tagline: string | null;
  priceAmount: string;
  currency: string;
  billingType: string;
  priceDisplayOverride: string | null;
  idealFor: string;
  popular: boolean;
  badge: string | null;
  displayOrder: number;
  features: string[];
}

export interface AdminPackageFeatureItem {
  id: string;
  featureText: string;
  displayOrder: number;
}

export interface FormattedAdminPackage {
  id: string;
  name: string;
  tagline: string | null;
  priceAmount: string;
  currency: string;
  billingType: string;
  priceDisplayOverride: string | null;
  idealFor: string;
  popular: boolean;
  badge: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
  features: AdminPackageFeatureItem[];
}

export interface PublicMatrixResponse {
  packages: Array<{
    id: string;
    name: string;
    tagline: string | null;
    priceAmount: string;
    currency: string;
    billingType: string;
    priceDisplayOverride: string | null;
    popular: boolean;
    badge: string | null;
    displayOrder: number;
  }>;
  rows: Array<{
    id: string;
    category: string;
    featureName: string;
    tooltip: string | null;
    displayOrder: number;
    packageValues: Record<string, boolean | string>;
  }>;
}

const SUPPORTED_BILLING_TYPES = ['one_time', 'monthly', 'yearly', 'custom'] as const;

export class PackageService {
  /**
   * Helper to format a PackageWithFeatures into FormattedAdminPackage
   */
  private formatAdminPackage(pkg: PackageWithFeatures): FormattedAdminPackage {
    return {
      id: pkg.id,
      name: pkg.name,
      tagline: pkg.tagline,
      priceAmount: pkg.priceAmount,
      currency: pkg.currency,
      billingType: pkg.billingType,
      priceDisplayOverride: pkg.priceDisplayOverride,
      idealFor: pkg.idealFor,
      popular: pkg.popular,
      badge: pkg.badge,
      isActive: pkg.isActive,
      displayOrder: pkg.displayOrder,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
      updatedBy: pkg.updatedBy,
      features: (pkg.features || []).map((f) => ({
        id: f.id,
        featureText: f.featureText,
        displayOrder: f.displayOrder,
      })),
    };
  }

  /**
   * Get all active packages formatted for public consumption
   */
  async getPublicPackages(): Promise<FormattedPublicPackage[]> {
    logger.info('Fetching public active packages from database...', 'PackageService');
    const packages = await packageRepository.getActivePackages();

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      tagline: pkg.tagline,
      priceAmount: pkg.priceAmount,
      currency: pkg.currency,
      billingType: pkg.billingType,
      priceDisplayOverride: pkg.priceDisplayOverride,
      idealFor: pkg.idealFor,
      popular: pkg.popular,
      badge: pkg.badge,
      displayOrder: pkg.displayOrder,
      features: pkg.features.map((f) => f.featureText),
    }));
  }

  /**
   * Get dynamic matrix comparison data
   */
  async getPublicMatrix(): Promise<PublicMatrixResponse> {
    logger.info('Fetching public matrix comparison data from database...', 'PackageService');
    const matrixData = await packageRepository.getMatrixData();

    return {
      packages: matrixData.packages,
      rows: matrixData.rows.map((r) => ({
        id: r.id,
        category: r.category,
        featureName: r.featureName,
        tooltip: r.tooltip,
        displayOrder: r.displayOrder,
        packageValues: r.packageValues,
      })),
    };
  }

  /**
   * Admin: Get all packages including inactive packages
   */
  async getAllPackagesForAdmin(): Promise<FormattedAdminPackage[]> {
    logger.info('Admin: Fetching all packages from database...', 'PackageService');
    const packages = await packageRepository.getAllPackagesForAdmin();
    return packages.map((pkg) => this.formatAdminPackage(pkg));
  }

  /**
   * Admin: Create a new package with features
   */
  async createPackage(payload: unknown, updatedBy?: string): Promise<FormattedAdminPackage> {
    const raw = payload as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid request body. Object expected.');
    }

    // Validate ID
    const rawId = typeof raw.id === 'string' ? raw.id.trim() : '';
    if (!rawId) {
      throw new Error('Package ID is required.');
    }
    if (!/^[a-z0-9-_]+$/i.test(rawId)) {
      throw new Error('Package ID must only contain alphanumeric characters, hyphens, and underscores.');
    }
    if (rawId.length > 64) {
      throw new Error('Package ID must not exceed 64 characters.');
    }

    // Validate Name
    const rawName = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!rawName) {
      throw new Error('Package name is required.');
    }
    if (rawName.length > 128) {
      throw new Error('Package name must not exceed 128 characters.');
    }

    // Validate Price
    let formattedPrice = '0.00';
    if (raw.priceAmount !== undefined && raw.priceAmount !== null && raw.priceAmount !== '') {
      const num = parseFloat(String(raw.priceAmount).replace(/[^\d.]/g, ''));
      if (isNaN(num) || num < 0) {
        throw new Error('Invalid priceAmount. Must be a valid positive number.');
      }
      formattedPrice = num.toFixed(2);
    } else {
      throw new Error('priceAmount is required.');
    }

    // Validate Billing Type
    const billingType = typeof raw.billingType === 'string' ? raw.billingType.trim() : 'one_time';
    if (!SUPPORTED_BILLING_TYPES.includes(billingType as typeof SUPPORTED_BILLING_TYPES[number])) {
      throw new Error(`Invalid billingType '${billingType}'. Supported: ${SUPPORTED_BILLING_TYPES.join(', ')}`);
    }

    // Validate Ideal For
    const idealFor = typeof raw.idealFor === 'string' ? raw.idealFor.trim() : '';
    if (!idealFor) {
      throw new Error('idealFor description is required.');
    }

    // Validate Features
    const features: Array<{ featureText: string; displayOrder?: number }> = [];
    if (raw.features !== undefined && raw.features !== null) {
      if (!Array.isArray(raw.features)) {
        throw new Error('features must be an array.');
      }
      for (let i = 0; i < raw.features.length; i++) {
        const item = raw.features[i];
        if (!item || typeof item !== 'object') {
          throw new Error(`Feature item at index ${i} is invalid.`);
        }
        const text = typeof item.featureText === 'string' ? item.featureText.trim() : '';
        if (!text) {
          throw new Error(`Feature item at index ${i} has empty featureText.`);
        }
        const order = typeof item.displayOrder === 'number' && Number.isInteger(item.displayOrder) ? item.displayOrder : i;
        features.push({
          featureText: text,
          displayOrder: order,
        });
      }
    }

    const packageData: CreatePackageData = {
      id: rawId,
      name: rawName,
      tagline: typeof raw.tagline === 'string' ? raw.tagline.trim() : null,
      priceAmount: formattedPrice,
      currency: typeof raw.currency === 'string' && raw.currency.trim() ? raw.currency.trim().toUpperCase() : 'INR',
      billingType,
      priceDisplayOverride: typeof raw.priceDisplayOverride === 'string' && raw.priceDisplayOverride.trim() ? raw.priceDisplayOverride.trim() : null,
      idealFor,
      popular: typeof raw.popular === 'boolean' ? raw.popular : false,
      badge: typeof raw.badge === 'string' && raw.badge.trim() ? raw.badge.trim() : null,
      isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
      displayOrder: typeof raw.displayOrder === 'number' && Number.isInteger(raw.displayOrder) ? raw.displayOrder : 0,
      features,
    };

    const created = await packageRepository.createPackage(packageData, updatedBy);
    return this.formatAdminPackage(created);
  }

  /**
   * Admin: Update an existing package and replace its features atomically
   */
  async updatePackage(id: string, payload: unknown, updatedBy?: string): Promise<FormattedAdminPackage> {
    if (!id || typeof id !== 'string') {
      throw new Error('Package ID is required.');
    }

    const raw = payload as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid request body. Object expected.');
    }

    // Validate Name
    const rawName = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!rawName) {
      throw new Error('Package name is required.');
    }
    if (rawName.length > 128) {
      throw new Error('Package name must not exceed 128 characters.');
    }

    // Validate Price
    let formattedPrice = '0.00';
    if (raw.priceAmount !== undefined && raw.priceAmount !== null && raw.priceAmount !== '') {
      const num = parseFloat(String(raw.priceAmount).replace(/[^\d.]/g, ''));
      if (isNaN(num) || num < 0) {
        throw new Error('Invalid priceAmount. Must be a valid positive number.');
      }
      formattedPrice = num.toFixed(2);
    } else {
      throw new Error('priceAmount is required.');
    }

    // Validate Billing Type
    const billingType = typeof raw.billingType === 'string' ? raw.billingType.trim() : 'one_time';
    if (!SUPPORTED_BILLING_TYPES.includes(billingType as typeof SUPPORTED_BILLING_TYPES[number])) {
      throw new Error(`Invalid billingType '${billingType}'. Supported: ${SUPPORTED_BILLING_TYPES.join(', ')}`);
    }

    // Validate Ideal For
    const idealFor = typeof raw.idealFor === 'string' ? raw.idealFor.trim() : '';
    if (!idealFor) {
      throw new Error('idealFor description is required.');
    }

    // Validate Features
    const features: Array<{ featureText: string; displayOrder?: number }> = [];
    if (raw.features !== undefined && raw.features !== null) {
      if (!Array.isArray(raw.features)) {
        throw new Error('features must be an array.');
      }
      for (let i = 0; i < raw.features.length; i++) {
        const item = raw.features[i];
        if (!item || typeof item !== 'object') {
          throw new Error(`Feature item at index ${i} is invalid.`);
        }
        const text = typeof item.featureText === 'string' ? item.featureText.trim() : '';
        if (!text) {
          throw new Error(`Feature item at index ${i} has empty featureText.`);
        }
        const order = typeof item.displayOrder === 'number' && Number.isInteger(item.displayOrder) ? item.displayOrder : i;
        features.push({
          featureText: text,
          displayOrder: order,
        });
      }
    }

    const packageData: UpdatePackageData = {
      name: rawName,
      tagline: typeof raw.tagline === 'string' ? raw.tagline.trim() : null,
      priceAmount: formattedPrice,
      currency: typeof raw.currency === 'string' && raw.currency.trim() ? raw.currency.trim().toUpperCase() : 'INR',
      billingType,
      priceDisplayOverride: typeof raw.priceDisplayOverride === 'string' && raw.priceDisplayOverride.trim() ? raw.priceDisplayOverride.trim() : null,
      idealFor,
      popular: typeof raw.popular === 'boolean' ? raw.popular : false,
      badge: typeof raw.badge === 'string' && raw.badge.trim() ? raw.badge.trim() : null,
      isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
      displayOrder: typeof raw.displayOrder === 'number' && Number.isInteger(raw.displayOrder) ? raw.displayOrder : 0,
      features,
    };

    const updated = await packageRepository.updatePackage(id, packageData, updatedBy);
    if (!updated) {
      const notFoundErr = new Error(`Package with ID '${id}' not found.`);
      (notFoundErr as any).statusCode = 404;
      throw notFoundErr;
    }

    return this.formatAdminPackage(updated);
  }

  /**
   * Admin: Toggle active/inactive status of a package
   */
  async updatePackageStatus(id: string, isActiveRaw: unknown, updatedBy?: string): Promise<FormattedAdminPackage> {
    if (!id || typeof id !== 'string') {
      throw new Error('Package ID is required.');
    }

    if (typeof isActiveRaw !== 'boolean') {
      throw new Error("isActive must be a boolean value ('true' or 'false').");
    }

    const updated = await packageRepository.updatePackageStatus(id, isActiveRaw, updatedBy);
    if (!updated) {
      const notFoundErr = new Error(`Package with ID '${id}' not found.`);
      (notFoundErr as any).statusCode = 404;
      throw notFoundErr;
    }

    return this.formatAdminPackage(updated);
  }

  /**
   * Admin: Reorder multiple packages in one transaction
   */
  async reorderPackages(payload: unknown, updatedBy?: string): Promise<FormattedAdminPackage[]> {
    const raw = payload as { items?: unknown } | null;
    if (!raw || !Array.isArray(raw.items) || raw.items.length === 0) {
      throw new Error('items array is required and must contain at least one package item.');
    }

    const items: ReorderPackageItem[] = [];
    const seenIds = new Set<string>();
    const seenOrders = new Set<number>();

    for (let i = 0; i < raw.items.length; i++) {
      const item = raw.items[i];
      if (!item || typeof item !== 'object') {
        throw new Error(`Reorder item at index ${i} is invalid.`);
      }

      const id = typeof item.id === 'string' ? item.id.trim() : '';
      if (!id) {
        throw new Error(`Reorder item at index ${i} is missing 'id'.`);
      }

      if (seenIds.has(id)) {
        throw new Error(`Duplicate package ID '${id}' in reorder request.`);
      }
      seenIds.add(id);

      if (typeof item.displayOrder !== 'number' || !Number.isInteger(item.displayOrder) || item.displayOrder < 0) {
        throw new Error(`Reorder item for package '${id}' has invalid 'displayOrder'. Must be a non-negative integer.`);
      }

      if (seenOrders.has(item.displayOrder)) {
        throw new Error(`Duplicate displayOrder '${item.displayOrder}' in reorder request.`);
      }
      seenOrders.add(item.displayOrder);

      items.push({
        id,
        displayOrder: item.displayOrder,
      });
    }

    const reordered = await packageRepository.reorderPackages(items, updatedBy);
    return reordered.map((pkg) => this.formatAdminPackage(pkg));
  }

  /**
   * Admin: Delete a package
   */
  async deletePackage(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('Package ID is required.');
    }

    const deleted = await packageRepository.deletePackage(id);
    if (!deleted) {
      const notFoundErr = new Error(`Package with ID '${id}' not found.`);
      (notFoundErr as any).statusCode = 404;
      throw notFoundErr;
    }
  }
}

export const packageService = new PackageService();

