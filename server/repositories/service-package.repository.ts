import { getDatabase } from '../config/database';
import {
  services,
  packages,
  packageFeatures,
  servicePackages,
  servicePackageFeatures,
} from '../../db/schema/index';
import { eq, and, asc, inArray, count } from 'drizzle-orm';
import { AdminPackage, PackageFormData, ReorderItem, BillingType } from '../../src/types/admin';
import { logger } from '../utils/logger';

export class ServicePackageRepository {
  /**
   * Get all packages assigned to a specific service with their service-scoped overrides and features
   */
  async getServicePackages(serviceId: string): Promise<AdminPackage[]> {
    const db = getDatabase();

    // 1. Fetch service_packages joined with template packages
    const rows = await db
      .select({
        sp: servicePackages,
        pkg: packages,
      })
      .from(servicePackages)
      .innerJoin(packages, eq(servicePackages.packageId, packages.id))
      .where(eq(servicePackages.serviceId, serviceId))
      .orderBy(asc(servicePackages.displayOrder));

    if (rows.length === 0) {
      return [];
    }

    const servicePkgIds = rows.map((r) => r.sp.id);
    const templatePkgIds = rows.map((r) => r.pkg.id);

    // 2. Fetch service-scoped features and template fallback features concurrently
    const [serviceFeatRows, templateFeatRows] = await Promise.all([
      db
        .select()
        .from(servicePackageFeatures)
        .where(inArray(servicePackageFeatures.servicePackageId, servicePkgIds))
        .orderBy(asc(servicePackageFeatures.displayOrder))
        .catch(() => []),
      db
        .select()
        .from(packageFeatures)
        .where(inArray(packageFeatures.packageId, templatePkgIds))
        .orderBy(asc(packageFeatures.displayOrder))
        .catch(() => []),
    ]);

    const serviceFeatMap = new Map<string, Array<{ id?: string; featureText: string; displayOrder: number }>>();
    for (const sf of serviceFeatRows) {
      const list = serviceFeatMap.get(sf.servicePackageId) || [];
      list.push({
        id: sf.id,
        featureText: sf.featureText,
        displayOrder: sf.displayOrder,
      });
      serviceFeatMap.set(sf.servicePackageId, list);
    }

    const templateFeatMap = new Map<string, Array<{ id?: string; featureText: string; displayOrder: number }>>();
    for (const tf of templateFeatRows) {
      const list = templateFeatMap.get(tf.packageId) || [];
      list.push({
        id: tf.id,
        featureText: tf.featureText,
        displayOrder: tf.displayOrder,
      });
      templateFeatMap.set(tf.packageId, list);
    }

    // 3. Map into AdminPackage model
    return rows.map(({ sp, pkg }) => {
      const scopedFeatures = serviceFeatMap.get(sp.id);
      const finalFeatures = scopedFeatures && scopedFeatures.length > 0
        ? scopedFeatures
        : (templateFeatMap.get(pkg.id) || []);

      const finalPriceAmount = sp.priceAmount !== null && sp.priceAmount !== undefined
        ? String(sp.priceAmount)
        : String(pkg.priceAmount || '0');

      return {
        id: pkg.id,
        name: sp.customName || pkg.name,
        tagline: sp.customTagline !== null && sp.customTagline !== undefined ? sp.customTagline : pkg.tagline,
        priceAmount: finalPriceAmount,
        currency: sp.currency || pkg.currency || 'INR',
        billingType: (sp.billingType || pkg.billingType || 'one_time') as BillingType,
        priceDisplayOverride: sp.priceDisplayOverride !== null && sp.priceDisplayOverride !== undefined
          ? sp.priceDisplayOverride
          : pkg.priceDisplayOverride,
        idealFor: sp.customIdealFor !== null && sp.customIdealFor !== undefined ? sp.customIdealFor : (pkg.idealFor || ''),
        popular: sp.popular !== null && sp.popular !== undefined ? Boolean(sp.popular) : Boolean(pkg.popular),
        badge: sp.customBadge !== null && sp.customBadge !== undefined ? sp.customBadge : pkg.badge,
        isActive: Boolean(sp.isActive),
        displayOrder: sp.displayOrder,
        createdAt: sp.createdAt ? sp.createdAt.toISOString() : undefined,
        updatedAt: sp.updatedAt ? sp.updatedAt.toISOString() : undefined,
        features: finalFeatures,
      };
    });
  }

  /**
   * Get single service-scoped package
   */
  async getServicePackageById(serviceId: string, packageId: string): Promise<AdminPackage | null> {
    const list = await this.getServicePackages(serviceId);
    return list.find((p) => p.id === packageId) || null;
  }

  /**
   * Update service-scoped package configuration and deliverables (does NOT touch other services or global template)
   */
  async updateServicePackage(
    serviceId: string,
    packageId: string,
    payload: PackageFormData,
    updatedBy?: string
  ): Promise<AdminPackage> {
    const db = getDatabase();

    // 1. Check if service exists
    const [serviceRow] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (!serviceRow) {
      throw new Error(`Service '${serviceId}' not found.`);
    }

    // 2. Find or create service_packages record
    let [spRow] = await db
      .select()
      .from(servicePackages)
      .where(and(eq(servicePackages.serviceId, serviceId), eq(servicePackages.packageId, packageId)))
      .limit(1);

    if (!spRow) {
      // Ensure template package exists
      const [templatePkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
      if (!templatePkg) {
        // Create base package template first
        await db.insert(packages).values({
          id: packageId,
          name: payload.name.trim(),
          tagline: payload.tagline.trim() || null,
          priceAmount: payload.priceAmount.trim() || '0',
          currency: payload.currency.trim() || 'INR',
          billingType: payload.billingType,
          priceDisplayOverride: payload.priceDisplayOverride.trim() || null,
          idealFor: payload.idealFor.trim(),
          popular: Boolean(payload.popular),
          badge: payload.badge.trim() || null,
          isActive: Boolean(payload.isActive),
          displayOrder: Number(payload.displayOrder) || 0,
        });
      }

      // Insert service_packages junction
      const [insertedSp] = await db
        .insert(servicePackages)
        .values({
          serviceId,
          packageId,
          customName: payload.name.trim(),
          customTagline: payload.tagline.trim() || null,
          priceAmount: payload.priceAmount.trim() || '0',
          currency: payload.currency.trim() || 'INR',
          billingType: payload.billingType,
          priceDisplayOverride: payload.priceDisplayOverride.trim() || null,
          customIdealFor: payload.idealFor.trim(),
          customBadge: payload.badge.trim() || null,
          popular: Boolean(payload.popular),
          displayOrder: Number(payload.displayOrder) || 0,
          isActive: Boolean(payload.isActive),
        })
        .returning();

      spRow = insertedSp;
    } else {
      // Update existing service_packages row
      const [updatedSp] = await db
        .update(servicePackages)
        .set({
          customName: payload.name.trim(),
          customTagline: payload.tagline.trim() || null,
          priceAmount: payload.priceAmount.trim() || '0',
          currency: payload.currency.trim() || 'INR',
          billingType: payload.billingType,
          priceDisplayOverride: payload.priceDisplayOverride.trim() || null,
          customIdealFor: payload.idealFor.trim(),
          customBadge: payload.badge.trim() || null,
          popular: Boolean(payload.popular),
          displayOrder: Number(payload.displayOrder) || 0,
          isActive: Boolean(payload.isActive),
          updatedAt: new Date(),
        })
        .where(eq(servicePackages.id, spRow.id))
        .returning();

      spRow = updatedSp;
    }

    // 3. Synchronize service-specific deliverables in service_package_features
    if (payload.features && Array.isArray(payload.features)) {
      // Delete old features for this service package
      await db.delete(servicePackageFeatures).where(eq(servicePackageFeatures.servicePackageId, spRow.id));

      const validFeatures = payload.features.filter((f) => f.featureText.trim().length > 0);
      if (validFeatures.length > 0) {
        await db.insert(servicePackageFeatures).values(
          validFeatures.map((f, idx) => ({
            servicePackageId: spRow.id,
            featureText: f.featureText.trim(),
            displayOrder: idx,
          }))
        );
      }
    }

    logger.info(
      `Updated service-scoped package '${packageId}' for service '${serviceId}' by '${updatedBy || 'admin'}'`,
      'ServicePackageRepo'
    );

    const updated = await this.getServicePackageById(serviceId, packageId);
    if (!updated) {
      throw new Error(`Failed to retrieve updated service package '${packageId}' for service '${serviceId}'`);
    }
    return updated;
  }

  /**
   * Assign or create a package under a service
   */
  async assignPackage(
    serviceId: string,
    payload: PackageFormData,
    updatedBy?: string
  ): Promise<AdminPackage> {
    const db = getDatabase();
    const packageId = payload.id.trim();

    // Check if template exists
    const [templatePkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
    if (!templatePkg) {
      // Create template package
      await db.insert(packages).values({
        id: packageId,
        name: payload.name.trim(),
        tagline: payload.tagline.trim() || null,
        priceAmount: payload.priceAmount.trim() || '0',
        currency: payload.currency.trim() || 'INR',
        billingType: payload.billingType,
        priceDisplayOverride: payload.priceDisplayOverride.trim() || null,
        idealFor: payload.idealFor.trim(),
        popular: Boolean(payload.popular),
        badge: payload.badge.trim() || null,
        isActive: Boolean(payload.isActive),
        displayOrder: Number(payload.displayOrder) || 0,
      });

      // Insert template features
      if (payload.features && payload.features.length > 0) {
        await db.insert(packageFeatures).values(
          payload.features.map((f, i) => ({
            packageId,
            featureText: f.featureText.trim(),
            displayOrder: i,
          }))
        );
      }
    }

    // Now update/create service_packages entry
    return await this.updateServicePackage(serviceId, packageId, payload, updatedBy);
  }

  /**
   * Toggle active/inactive status for a package on a specific service
   */
  async toggleServicePackageStatus(
    serviceId: string,
    packageId: string,
    isActive: boolean
  ): Promise<AdminPackage> {
    const db = getDatabase();

    const [updated] = await db
      .update(servicePackages)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(servicePackages.serviceId, serviceId), eq(servicePackages.packageId, packageId)))
      .returning();

    if (!updated) {
      throw new Error(`Service package association not found for service '${serviceId}' and package '${packageId}'`);
    }

    const full = await this.getServicePackageById(serviceId, packageId);
    if (!full) {
      throw new Error(`Failed to retrieve toggled service package '${packageId}'`);
    }
    return full;
  }

  /**
   * Reorder packages for a specific service
   */
  async reorderServicePackages(serviceId: string, items: ReorderItem[]): Promise<void> {
    const db = getDatabase();

    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(servicePackages)
          .set({
            displayOrder: item.displayOrder,
            updatedAt: new Date(),
          })
          .where(and(eq(servicePackages.serviceId, serviceId), eq(servicePackages.packageId, item.id)));
      }
    });

    logger.info(`Reordered packages for service '${serviceId}'`, 'ServicePackageRepo');
  }

  /**
   * Unassign / delete a package from a service (does NOT delete global template package or other services' packages)
   */
  async deleteServicePackage(serviceId: string, packageId: string): Promise<void> {
    const db = getDatabase();

    await db
      .delete(servicePackages)
      .where(and(eq(servicePackages.serviceId, serviceId), eq(servicePackages.packageId, packageId)));

    logger.info(`Unassigned package '${packageId}' from service '${serviceId}'`, 'ServicePackageRepo');
  }
}

export const servicePackageRepository = new ServicePackageRepository();
