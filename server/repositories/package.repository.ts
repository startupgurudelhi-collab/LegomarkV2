import { getDatabase, pingDatabase } from '../config/database';
import { packages, packageFeatures, matrixRows, matrixCellValues, Package, PackageFeature, MatrixRow } from '../../db/schema/index';
import { eq, asc, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface PackageWithFeatures extends Package {
  features: PackageFeature[];
}

export interface MatrixRowWithValues extends MatrixRow {
  packageValues: Record<string, boolean | string>;
}

export interface DynamicMatrixResponse {
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
  rows: MatrixRowWithValues[];
}

export interface CreatePackageData {
  id: string;
  name: string;
  tagline?: string | null;
  priceAmount: string;
  currency?: string;
  billingType: string;
  priceDisplayOverride?: string | null;
  idealFor: string;
  popular?: boolean;
  badge?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  features?: Array<{
    featureText: string;
    displayOrder?: number;
  }>;
}

export interface UpdatePackageData {
  name: string;
  tagline?: string | null;
  priceAmount: string;
  currency?: string;
  billingType: string;
  priceDisplayOverride?: string | null;
  idealFor: string;
  popular?: boolean;
  badge?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  features?: Array<{
    featureText: string;
    displayOrder?: number;
  }>;
}

export interface ReorderPackageItem {
  id: string;
  displayOrder: number;
}

export class PackageRepository {
  /**
   * Fetch all active packages with their associated features ordered by display_order ASC
   */
  async getActivePackages(): Promise<PackageWithFeatures[]> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    // 1. Fetch active packages ordered by display_order ASC
    const activePackages = await db
      .select()
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(asc(packages.displayOrder));

    if (activePackages.length === 0) {
      return [];
    }

    const activePackageIds = activePackages.map((p) => p.id);

    // 2. Fetch features for active packages ordered by display_order ASC
    const features = await db
      .select()
      .from(packageFeatures)
      .where(inArray(packageFeatures.packageId, activePackageIds))
      .orderBy(asc(packageFeatures.displayOrder));

    // Group features by packageId
    const featuresByPackageId = new Map<string, PackageFeature[]>();
    for (const feat of features) {
      const list = featuresByPackageId.get(feat.packageId) || [];
      list.push(feat);
      featuresByPackageId.set(feat.packageId, list);
    }

    return activePackages.map((pkg) => ({
      ...pkg,
      features: featuresByPackageId.get(pkg.id) || [],
    }));
  }

  /**
   * Fetch ALL packages (including inactive) with their associated features ordered by display_order ASC
   */
  async getAllPackagesForAdmin(): Promise<PackageWithFeatures[]> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    // 1. Fetch all packages ordered by display_order ASC
    const allPackages = await db
      .select()
      .from(packages)
      .orderBy(asc(packages.displayOrder));

    if (allPackages.length === 0) {
      return [];
    }

    const allPackageIds = allPackages.map((p) => p.id);

    // 2. Fetch features for all packages ordered by display_order ASC
    const features = await db
      .select()
      .from(packageFeatures)
      .where(inArray(packageFeatures.packageId, allPackageIds))
      .orderBy(asc(packageFeatures.displayOrder));

    // Group features by packageId
    const featuresByPackageId = new Map<string, PackageFeature[]>();
    for (const feat of features) {
      const list = featuresByPackageId.get(feat.packageId) || [];
      list.push(feat);
      featuresByPackageId.set(feat.packageId, list);
    }

    return allPackages.map((pkg) => ({
      ...pkg,
      features: featuresByPackageId.get(pkg.id) || [],
    }));
  }

  /**
   * Fetch a single package by ID with its features
   */
  async getPackageById(id: string): Promise<PackageWithFeatures | null> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    const pkgRows = await db
      .select()
      .from(packages)
      .where(eq(packages.id, id))
      .limit(1);

    if (pkgRows.length === 0) {
      return null;
    }

    const pkg = pkgRows[0];

    const features = await db
      .select()
      .from(packageFeatures)
      .where(eq(packageFeatures.packageId, id))
      .orderBy(asc(packageFeatures.displayOrder));

    return {
      ...pkg,
      features,
    };
  }

  /**
   * Create a new package and its features atomically in a transaction
   */
  async createPackage(data: CreatePackageData, updatedBy?: string): Promise<PackageWithFeatures> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    return await db.transaction(async (tx) => {
      // 1. Check if ID already exists
      const existing = await tx
        .select({ id: packages.id })
        .from(packages)
        .where(eq(packages.id, data.id))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(`Package with ID '${data.id}' already exists.`);
      }

      // 2. Insert package row
      const [insertedPkg] = await tx
        .insert(packages)
        .values({
          id: data.id,
          name: data.name,
          tagline: data.tagline || null,
          priceAmount: data.priceAmount,
          currency: data.currency || 'INR',
          billingType: data.billingType,
          priceDisplayOverride: data.priceDisplayOverride || null,
          idealFor: data.idealFor,
          popular: data.popular ?? false,
          badge: data.badge || null,
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder ?? 0,
          updatedBy: updatedBy || null,
        })
        .returning();

      // 3. Insert features if provided
      let insertedFeatures: PackageFeature[] = [];
      if (data.features && data.features.length > 0) {
        const featureValues = data.features.map((f, idx) => ({
          packageId: data.id,
          featureText: f.featureText,
          displayOrder: typeof f.displayOrder === 'number' ? f.displayOrder : idx,
        }));

        insertedFeatures = await tx
          .insert(packageFeatures)
          .values(featureValues)
          .returning();

        // Sort by displayOrder
        insertedFeatures.sort((a, b) => a.displayOrder - b.displayOrder);
      }

      logger.info(`Admin created package [${insertedPkg.id}] with ${insertedFeatures.length} features`, 'PackageRepository');

      return {
        ...insertedPkg,
        features: insertedFeatures,
      };
    });
  }

  /**
   * Update package metadata and synchronize its features atomically in a transaction
   */
  async updatePackage(id: string, data: UpdatePackageData, updatedBy?: string): Promise<PackageWithFeatures | null> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    return await db.transaction(async (tx) => {
      // 1. Verify existence
      const existing = await tx
        .select()
        .from(packages)
        .where(eq(packages.id, id))
        .limit(1);

      if (existing.length === 0) {
        return null;
      }

      // 2. Update package record
      const [updatedPkg] = await tx
        .update(packages)
        .set({
          name: data.name,
          tagline: data.tagline !== undefined ? data.tagline : existing[0].tagline,
          priceAmount: data.priceAmount,
          currency: data.currency || existing[0].currency,
          billingType: data.billingType,
          priceDisplayOverride: data.priceDisplayOverride !== undefined ? data.priceDisplayOverride : existing[0].priceDisplayOverride,
          idealFor: data.idealFor,
          popular: data.popular !== undefined ? data.popular : existing[0].popular,
          badge: data.badge !== undefined ? data.badge : existing[0].badge,
          isActive: data.isActive !== undefined ? data.isActive : existing[0].isActive,
          displayOrder: data.displayOrder !== undefined ? data.displayOrder : existing[0].displayOrder,
          updatedAt: new Date(),
          updatedBy: updatedBy || null,
        })
        .where(eq(packages.id, id))
        .returning();

      // 3. Synchronize package features: delete old rows and insert updated list
      await tx
        .delete(packageFeatures)
        .where(eq(packageFeatures.packageId, id));

      let insertedFeatures: PackageFeature[] = [];
      if (data.features && data.features.length > 0) {
        const featureValues = data.features.map((f, idx) => ({
          packageId: id,
          featureText: f.featureText,
          displayOrder: typeof f.displayOrder === 'number' ? f.displayOrder : idx,
        }));

        insertedFeatures = await tx
          .insert(packageFeatures)
          .values(featureValues)
          .returning();

        insertedFeatures.sort((a, b) => a.displayOrder - b.displayOrder);
      }

      logger.info(`Admin updated package [${id}] and replaced features (${insertedFeatures.length} features)`, 'PackageRepository');

      return {
        ...updatedPkg,
        features: insertedFeatures,
      };
    });
  }

  /**
   * Update active/inactive status of a package
   */
  async updatePackageStatus(id: string, isActive: boolean, updatedBy?: string): Promise<PackageWithFeatures | null> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    return await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(packages)
        .where(eq(packages.id, id))
        .limit(1);

      if (existing.length === 0) {
        return null;
      }

      const [updatedPkg] = await tx
        .update(packages)
        .set({
          isActive,
          updatedAt: new Date(),
          updatedBy: updatedBy || null,
        })
        .where(eq(packages.id, id))
        .returning();

      const features = await tx
        .select()
        .from(packageFeatures)
        .where(eq(packageFeatures.packageId, id))
        .orderBy(asc(packageFeatures.displayOrder));

      logger.info(`Admin updated package [${id}] status to [isActive=${isActive}]`, 'PackageRepository');

      return {
        ...updatedPkg,
        features,
      };
    });
  }

  /**
   * Reorder multiple packages in a single transaction
   */
  async reorderPackages(items: ReorderPackageItem[], updatedBy?: string): Promise<PackageWithFeatures[]> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    return await db.transaction(async (tx) => {
      const itemIds = items.map((i) => i.id);

      // Verify all package IDs exist
      const existing = await tx
        .select({ id: packages.id })
        .from(packages)
        .where(inArray(packages.id, itemIds));

      const existingIds = new Set(existing.map((e) => e.id));
      const missingIds = itemIds.filter((id) => !existingIds.has(id));

      if (missingIds.length > 0) {
        throw new Error(`Cannot reorder: Package(s) not found: ${missingIds.join(', ')}`);
      }

      // Update display_order for each package
      const now = new Date();
      for (const item of items) {
        await tx
          .update(packages)
          .set({
            displayOrder: item.displayOrder,
            updatedAt: now,
            updatedBy: updatedBy || null,
          })
          .where(eq(packages.id, item.id));
      }

      // Fetch all packages after reordering
      const allPkgs = await tx
        .select()
        .from(packages)
        .orderBy(asc(packages.displayOrder));

      const allIds = allPkgs.map((p) => p.id);
      const features = await tx
        .select()
        .from(packageFeatures)
        .where(inArray(packageFeatures.packageId, allIds))
        .orderBy(asc(packageFeatures.displayOrder));

      const featuresByPackageId = new Map<string, PackageFeature[]>();
      for (const feat of features) {
        const list = featuresByPackageId.get(feat.packageId) || [];
        list.push(feat);
        featuresByPackageId.set(feat.packageId, list);
      }

      logger.info(`Admin reordered ${items.length} packages successfully`, 'PackageRepository');

      return allPkgs.map((pkg) => ({
        ...pkg,
        features: featuresByPackageId.get(pkg.id) || [],
      }));
    });
  }

  /**
   * Delete a package safely.
   * Cascade deletes associated package_features and matrix_cell_values.
   * Shared matrix_rows are untouched.
   */
  async deletePackage(id: string): Promise<boolean> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: packages.id })
        .from(packages)
        .where(eq(packages.id, id))
        .limit(1);

      if (existing.length === 0) {
        return false;
      }

      await tx
        .delete(packages)
        .where(eq(packages.id, id));

      logger.info(`Admin deleted package [${id}] (cascaded features & matrix cells)`, 'PackageRepository');
      return true;
    });
  }

  /**
   * Fetch comparison matrix data: active packages, matrix rows, and populated cell values
   */
  async getMatrixData(): Promise<DynamicMatrixResponse> {
    const isConn = await pingDatabase();
    if (!isConn.connected) {
      throw new Error(`Database connection unavailable: ${isConn.error || 'PostgreSQL unreachable'}`);
    }

    const db = getDatabase();

    // 1. Fetch active packages only (ordered by displayOrder)
    const activePackages = await db
      .select()
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(asc(packages.displayOrder));

    const activePackageIds = activePackages.map((p) => p.id);

    if (activePackages.length === 0) {
      return { packages: [], rows: [] };
    }

    // 2. Fetch matrix rows ordered by displayOrder ASC
    const rows = await db
      .select()
      .from(matrixRows)
      .orderBy(asc(matrixRows.displayOrder));

    if (rows.length === 0) {
      return {
        packages: activePackages.map((p) => ({
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          priceAmount: p.priceAmount,
          currency: p.currency,
          billingType: p.billingType,
          priceDisplayOverride: p.priceDisplayOverride,
          popular: p.popular,
          badge: p.badge,
          displayOrder: p.displayOrder,
        })),
        rows: [],
      };
    }

    // 3. Fetch matrix cells ONLY for active packages
    const cells = await db
      .select()
      .from(matrixCellValues)
      .where(inArray(matrixCellValues.packageId, activePackageIds));

    // Map cells by `${matrixRowId}:::${packageId}`
    const cellValueMap = new Map<string, boolean | string>();
    for (const cell of cells) {
      const key = `${cell.matrixRowId}:::${cell.packageId}`;
      if (cell.valueType === 'boolean') {
        cellValueMap.set(key, cell.booleanVal ?? false);
      } else {
        cellValueMap.set(key, cell.textVal ?? '');
      }
    }

    // Build matrix rows with dynamically keyed packageValues
    const mappedRows: MatrixRowWithValues[] = rows.map((row) => {
      const packageValues: Record<string, boolean | string> = {};
      for (const pkg of activePackages) {
        const val = cellValueMap.get(`${row.id}:::${pkg.id}`);
        packageValues[pkg.id] = val !== undefined ? val : false;
      }

      return {
        ...row,
        packageValues,
      };
    });

    return {
      packages: activePackages.map((p) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        priceAmount: p.priceAmount,
        currency: p.currency,
        billingType: p.billingType,
        priceDisplayOverride: p.priceDisplayOverride,
        popular: p.popular,
        badge: p.badge,
        displayOrder: p.displayOrder,
      })),
      rows: mappedRows,
    };
  }
}

export const packageRepository = new PackageRepository();

