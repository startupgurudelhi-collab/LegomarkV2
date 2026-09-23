import { getDatabase, pingDatabase } from '../config/database';
import {
  services,
  packages,
  packageFeatures,
  servicePackages,
  servicePackageFeatures,
} from '../../db/schema/index';
import { eq, and, or, asc, inArray, count } from 'drizzle-orm';
import { AdminPackage, PackageFormData, ReorderItem, BillingType } from '../../src/types/admin';
import { logger } from '../utils/logger';
import { SERVICES, PACKAGES } from '../../src/data/websiteData';

// Service-scoped package store: Map<serviceKey, Map<packageId, AdminPackage>>
// Keyed by both service id and slug for immediate authoritative retrieval
const servicePackagesStore = new Map<string, Map<string, AdminPackage>>();

// Service-assigned package IDs: Map<serviceKey, string[]>
const serviceAssignedIdsStore = new Map<string, string[]>();

/**
 * Helper to canonicalize a service identifier to its ID and slug
 */
function canonicalizeServiceKey(key: string): { id: string; slug: string } | null {
  if (!key) return null;
  const norm = key.toLowerCase().trim();
  const s = SERVICES.find((item) => item.id.toLowerCase() === norm || item.slug.toLowerCase() === norm);
  if (s) {
    return { id: s.id, slug: s.slug };
  }
  return null;
}

/**
 * Initialize default service-scoped packages from canonical catalogue
 */
function initDefaultServicePackages(serviceKey: string): Map<string, AdminPackage> {
  const normKey = serviceKey.toLowerCase().trim();
  const canon = canonicalizeServiceKey(normKey);
  const idKey = canon ? canon.id : normKey;
  const slugKey = canon ? canon.slug : normKey;

  // If already loaded in store, return existing map without wiping overrides
  if (servicePackagesStore.has(idKey)) {
    const existing = servicePackagesStore.get(idKey)!;
    if (!servicePackagesStore.has(slugKey)) {
      servicePackagesStore.set(slugKey, existing);
    }
    return existing;
  }

  const pkgMap = new Map<string, AdminPackage>();
  PACKAGES.forEach((p, idx) => {
    const rawPriceDigits = p.price.replace(/[^\d.]/g, '') || '0';
    const pkg: AdminPackage = {
      id: p.id,
      name: p.name,
      tagline: p.tagline || null,
      priceAmount: rawPriceDigits,
      currency: 'INR',
      billingType: (p.period?.includes('year') ? 'yearly' : p.period?.includes('mo') ? 'monthly' : 'one_time') as BillingType,
      priceDisplayOverride: p.price,
      idealFor: p.idealFor || '',
      popular: !!p.popular,
      badge: p.badge || null,
      isActive: true,
      displayOrder: idx,
      features: (p.features || []).map((f, i) => ({
        id: `${p.id}-f-${i}`,
        featureText: f,
        displayOrder: i,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    pkgMap.set(p.id, pkg);
  });

  servicePackagesStore.set(idKey, pkgMap);
  servicePackagesStore.set(slugKey, pkgMap);

  const defaultIds = PACKAGES.map((p) => p.id);
  if (!serviceAssignedIdsStore.has(idKey)) {
    serviceAssignedIdsStore.set(idKey, defaultIds);
  }
  if (!serviceAssignedIdsStore.has(slugKey)) {
    serviceAssignedIdsStore.set(slugKey, defaultIds);
  }

  return pkgMap;
}

// Pre-initialize default packages for all known services
SERVICES.forEach((s) => {
  initDefaultServicePackages(s.id);
});

export class ServicePackageRepository {
  /**
   * Get all packages assigned to a specific service with their service-scoped overrides and features
   */
  async getServicePackages(serviceId: string): Promise<AdminPackage[]> {
    const normKey = (serviceId || '').toLowerCase().trim();
    const canon = canonicalizeServiceKey(normKey);
    const lookupKey = canon ? canon.id : normKey;

    const isConnected = await pingDatabase();
    if (isConnected.connected) {
      try {
        const db = getDatabase();

        // 1. Fetch service_packages joined with template packages
        const rows = await db
          .select({
            sp: servicePackages,
            pkg: packages,
          })
          .from(servicePackages)
          .innerJoin(packages, eq(servicePackages.packageId, packages.id))
          .where(
            canon
              ? or(
                  eq(servicePackages.serviceId, canon.id),
                  eq(servicePackages.serviceId, canon.slug)
                )
              : eq(servicePackages.serviceId, lookupKey)
          )
          .orderBy(asc(servicePackages.displayOrder));

        if (rows.length > 0) {
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

          const result: AdminPackage[] = rows.map(({ sp, pkg }) => {
            const scopedFeatures = serviceFeatMap.get(sp.id);
            const finalFeatures = scopedFeatures && scopedFeatures.length > 0
              ? scopedFeatures
              : (templateFeatMap.get(pkg.id) || []);

            const finalPriceAmount = sp.priceAmount !== null && sp.priceAmount !== undefined
              ? String(sp.priceAmount)
              : String(pkg.priceAmount || '0');

            const finalPriceDisplay = sp.priceDisplayOverride !== null && sp.priceDisplayOverride !== undefined && sp.priceDisplayOverride.trim().length > 0
              ? sp.priceDisplayOverride.trim()
              : (Number(finalPriceAmount) > 0 ? `₹${Number(finalPriceAmount).toLocaleString('en-IN')}` : pkg.priceDisplayOverride);

            return {
              id: pkg.id,
              name: sp.customName || pkg.name,
              tagline: sp.customTagline !== null && sp.customTagline !== undefined ? sp.customTagline : pkg.tagline,
              priceAmount: finalPriceAmount,
              currency: sp.currency || pkg.currency || 'INR',
              billingType: (sp.billingType || pkg.billingType || 'one_time') as BillingType,
              priceDisplayOverride: finalPriceDisplay,
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

          // Sync into memory cache
          const storeMap = servicePackagesStore.get(lookupKey) || new Map<string, AdminPackage>();
          result.forEach((p) => storeMap.set(p.id, p));
          servicePackagesStore.set(lookupKey, storeMap);
          if (canon?.slug) {
            servicePackagesStore.set(canon.slug, storeMap);
          }
          if (canon?.id) {
            servicePackagesStore.set(canon.id, storeMap);
          }

          return result;
        }
      } catch (err: any) {
        logger.warn(`Database query failed in getServicePackages for ${serviceId}: ${err?.message || err}`);
      }
    }

    // Offline or DB empty: use in-memory authoritative service-scoped store
    let storeMap = servicePackagesStore.get(lookupKey);
    if (!storeMap && canon) {
      storeMap = servicePackagesStore.get(canon.slug) || servicePackagesStore.get(canon.id);
    }
    if (!storeMap) {
      storeMap = initDefaultServicePackages(lookupKey);
    }

    const assignedIds = this.getAssignedPackageIds(lookupKey);
    let packagesList = Array.from(storeMap.values());

    if (assignedIds !== undefined) {
      if (assignedIds.length === 0) return [];
      packagesList = assignedIds
        .map((id) => storeMap!.get(id))
        .filter((p): p is AdminPackage => Boolean(p));
    }

    return packagesList.sort((a, b) => a.displayOrder - b.displayOrder);
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
    const normKey = (serviceId || '').toLowerCase().trim();
    const canon = canonicalizeServiceKey(normKey);
    const idKey = canon ? canon.id : normKey;
    const slugKey = canon ? canon.slug : normKey;

    // Sanitize price to strict numeric string
    const rawPriceDigits = String(payload.priceAmount ?? '').replace(/[^\d.]/g, '');
    const cleanPrice = rawPriceDigits.length > 0 && !isNaN(parseFloat(rawPriceDigits))
      ? parseFloat(rawPriceDigits).toFixed(2)
      : '0.00';

    const cleanName = (payload.name ?? '').trim().slice(0, 128);
    const cleanTagline = (payload.tagline ?? '').trim().slice(0, 255) || null;
    const cleanCurrency = (payload.currency ?? '').trim().toUpperCase().slice(0, 8) || 'INR';
    const cleanBillingType = payload.billingType ? String(payload.billingType).trim().slice(0, 32) : 'one_time';
    const cleanPriceDisplayOverride = (payload.priceDisplayOverride ?? '').trim().slice(0, 64) || null;
    const cleanIdealFor = (payload.idealFor ?? '').trim() || '';
    const cleanBadge = (payload.badge ?? '').trim().slice(0, 64) || null;
    const cleanPopular = Boolean(payload.popular);
    const cleanDisplayOrder = Number.isInteger(Number(payload.displayOrder)) ? Number(payload.displayOrder) : 0;
    const cleanIsActive = payload.isActive !== undefined ? Boolean(payload.isActive) : true;

    const formattedPriceDisplay = cleanPriceDisplayOverride || `₹${Number(cleanPrice).toLocaleString('en-IN')}`;

    const cleanFeatures = (payload.features || [])
      .filter((f) => (f.featureText ?? '').trim().length > 0)
      .map((f, idx) => ({
        id: f.id || `${packageId}-f-${idx}`,
        featureText: (f.featureText ?? '').trim().slice(0, 255),
        displayOrder: Number.isInteger(f.displayOrder) ? f.displayOrder : idx,
      }));

    // Construct authoritative AdminPackage object
    const updatedPackage: AdminPackage = {
      id: packageId,
      name: cleanName || packageId,
      tagline: cleanTagline,
      priceAmount: cleanPrice,
      currency: cleanCurrency,
      billingType: cleanBillingType as BillingType,
      priceDisplayOverride: formattedPriceDisplay,
      idealFor: cleanIdealFor,
      popular: cleanPopular,
      badge: cleanBadge,
      isActive: cleanIsActive,
      displayOrder: cleanDisplayOrder,
      features: cleanFeatures,
      updatedAt: new Date().toISOString(),
    };

    // 1. Update in-memory authoritative store for both ID and slug
    let storeMap = servicePackagesStore.get(idKey);
    if (!storeMap) {
      storeMap = initDefaultServicePackages(idKey);
    }
    storeMap.set(packageId, updatedPackage);
    servicePackagesStore.set(idKey, storeMap);
    servicePackagesStore.set(slugKey, storeMap);

    // Ensure package is included in assigned IDs
    const currentAssigned = this.getAssignedPackageIds(idKey) || [];
    if (!currentAssigned.includes(packageId)) {
      const nextAssigned = [...currentAssigned, packageId];
      serviceAssignedIdsStore.set(idKey, nextAssigned);
      serviceAssignedIdsStore.set(slugKey, nextAssigned);
    }

    // 2. Synchronize to database if connected
    const isConnected = await pingDatabase();
    if (isConnected.connected) {
      try {
        const db = getDatabase();

        // Check if service exists in DB
        const [serviceRow] = await db
          .select()
          .from(services)
          .where(
            canon
              ? or(
                  eq(services.id, canon.id),
                  eq(services.slug, canon.slug),
                  eq(services.id, canon.slug)
                )
              : eq(services.id, idKey)
          )
          .limit(1);

        const targetServiceId = serviceRow ? serviceRow.id : idKey;

        // Find or create service_packages record
        let [spRow] = await db
          .select()
          .from(servicePackages)
          .where(
            and(
              or(
                eq(servicePackages.serviceId, targetServiceId),
                eq(servicePackages.serviceId, idKey),
                ...(canon ? [eq(servicePackages.serviceId, canon.slug)] : [])
              ),
              eq(servicePackages.packageId, packageId)
            )
          )
          .limit(1);

        if (!spRow) {
          // Ensure template package exists
          const [templatePkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
          if (!templatePkg) {
            await db.insert(packages).values({
              id: packageId,
              name: cleanName || packageId,
              tagline: cleanTagline,
              priceAmount: cleanPrice,
              currency: cleanCurrency,
              billingType: cleanBillingType,
              priceDisplayOverride: formattedPriceDisplay,
              idealFor: cleanIdealFor,
              popular: cleanPopular,
              badge: cleanBadge,
              isActive: cleanIsActive,
              displayOrder: cleanDisplayOrder,
            });
          }

          const [insertedSp] = await db
            .insert(servicePackages)
            .values({
              serviceId: targetServiceId,
              packageId,
              customName: cleanName || null,
              customTagline: cleanTagline,
              priceAmount: cleanPrice,
              currency: cleanCurrency,
              billingType: cleanBillingType,
              priceDisplayOverride: formattedPriceDisplay,
              customIdealFor: cleanIdealFor,
              customBadge: cleanBadge,
              popular: cleanPopular,
              displayOrder: cleanDisplayOrder,
              isActive: cleanIsActive,
            })
            .returning();
          spRow = insertedSp;
        } else {
          const [updatedSp] = await db
            .update(servicePackages)
            .set({
              customName: cleanName || null,
              customTagline: cleanTagline,
              priceAmount: cleanPrice,
              currency: cleanCurrency,
              billingType: cleanBillingType,
              priceDisplayOverride: formattedPriceDisplay,
              customIdealFor: cleanIdealFor,
              customBadge: cleanBadge,
              popular: cleanPopular,
              displayOrder: cleanDisplayOrder,
              isActive: cleanIsActive,
              updatedAt: new Date(),
            })
            .where(eq(servicePackages.id, spRow.id))
            .returning();
          spRow = updatedSp;
        }

        if (spRow && cleanFeatures.length > 0) {
          await db.delete(servicePackageFeatures).where(eq(servicePackageFeatures.servicePackageId, spRow.id));
          await db.insert(servicePackageFeatures).values(
            cleanFeatures.map((f, idx) => ({
              servicePackageId: spRow.id,
              featureText: f.featureText,
              displayOrder: f.displayOrder !== undefined ? f.displayOrder : idx,
            }))
          );
        }
      } catch (dbErr: any) {
        logger.warn(`DB write failed during updateServicePackage for ${serviceId}/${packageId}: ${dbErr?.message || dbErr}`);
      }
    }

    logger.info(
      `Updated service-scoped package '${packageId}' for service '${serviceId}' by '${updatedBy || 'admin'}'`,
      'ServicePackageRepo'
    );

    return updatedPackage;
  }

  /**
   * Assign or create a package under a service
   */
  async assignPackage(
    serviceId: string,
    payload: PackageFormData,
    updatedBy?: string
  ): Promise<AdminPackage> {
    const packageId = (payload.id ?? '').trim();
    return await this.updateServicePackage(serviceId, packageId, payload, updatedBy);
  }

  /**
   * Set explicitly assigned package IDs for a service (1, 2, or 3 packages)
   */
  async setAssignedPackageIds(serviceId: string, packageIds: string[]): Promise<void> {
    const normKey = (serviceId || '').toLowerCase().trim();
    const canon = canonicalizeServiceKey(normKey);
    const idKey = canon ? canon.id : normKey;
    const slugKey = canon ? canon.slug : normKey;

    serviceAssignedIdsStore.set(idKey, packageIds);
    serviceAssignedIdsStore.set(slugKey, packageIds);

    const isConnected = await pingDatabase();
    if (isConnected.connected) {
      try {
        const db = getDatabase();
        for (let i = 0; i < packageIds.length; i++) {
          const pkgId = packageIds[i];
          await db
            .update(servicePackages)
            .set({ displayOrder: i, isActive: true, updatedAt: new Date() })
            .where(
              and(
                canon
                  ? or(eq(servicePackages.serviceId, canon.id), eq(servicePackages.serviceId, canon.slug))
                  : eq(servicePackages.serviceId, idKey),
                eq(servicePackages.packageId, pkgId)
              )
            );
        }
      } catch (err: any) {
        logger.warn(`Could not sync assigned package order to DB for ${serviceId}: ${err?.message || err}`);
      }
    }

    logger.info(`Set assigned package IDs for service '${serviceId}': [${packageIds.join(', ')}]`, 'ServicePackageRepo');
  }

  /**
   * Get explicitly assigned package IDs for a service
   */
  getAssignedPackageIds(serviceId: string): string[] | undefined {
    const normKey = (serviceId || '').toLowerCase().trim();
    const canon = canonicalizeServiceKey(normKey);
    const idKey = canon ? canon.id : normKey;
    const slugKey = canon ? canon.slug : normKey;

    return serviceAssignedIdsStore.get(idKey) || serviceAssignedIdsStore.get(slugKey);
  }

  /**
   * Toggle active/inactive status for a package on a specific service
   */
  async toggleServicePackageStatus(
    serviceId: string,
    packageId: string,
    isActive: boolean
  ): Promise<AdminPackage> {
    const normKey = (serviceId || '').toLowerCase().trim();
    const canon = canonicalizeServiceKey(normKey);
    const idKey = canon ? canon.id : normKey;

    let storeMap = servicePackagesStore.get(idKey);
    if (!storeMap) {
      storeMap = initDefaultServicePackages(idKey);
    }
    const existing = storeMap.get(packageId);
    if (existing) {
      existing.isActive = isActive;
      existing.updatedAt = new Date().toISOString();
    }

    const isConnected = await pingDatabase();
    if (isConnected.connected) {
      try {
        const db = getDatabase();
        await db
          .update(servicePackages)
          .set({ isActive, updatedAt: new Date() })
          .where(
            and(
              canon
                ? or(eq(servicePackages.serviceId, canon.id), eq(servicePackages.serviceId, canon.slug))
                : eq(servicePackages.serviceId, idKey),
              eq(servicePackages.packageId, packageId)
            )
          );
      } catch (err: any) {
        logger.warn(`DB status update failed for ${serviceId}/${packageId}: ${err?.message || err}`);
      }
    }

    const updated = await this.getServicePackageById(serviceId, packageId);
    if (!updated) {
      throw new Error(`Failed to retrieve toggled service package '${packageId}'`);
    }
    return updated;
  }

  /**
   * Reorder packages for a specific service
   */
  async reorderServicePackages(serviceId: string, items: ReorderItem[]): Promise<void> {
    const normKey = (serviceId || '').toLowerCase().trim();
    const canon = canonicalizeServiceKey(normKey);
    const idKey = canon ? canon.id : normKey;

    const storeMap = servicePackagesStore.get(idKey);
    if (storeMap) {
      for (const item of items) {
        const p = storeMap.get(item.id);
        if (p) {
          p.displayOrder = item.displayOrder;
        }
      }
    }

    const isConnected = await pingDatabase();
    if (isConnected.connected) {
      try {
        const db = getDatabase();
        await db.transaction(async (tx) => {
          for (const item of items) {
            await tx
              .update(servicePackages)
              .set({
                displayOrder: item.displayOrder,
                updatedAt: new Date(),
              })
              .where(
                and(
                  canon
                    ? or(eq(servicePackages.serviceId, canon.id), eq(servicePackages.serviceId, canon.slug))
                    : eq(servicePackages.serviceId, idKey),
                  eq(servicePackages.packageId, item.id)
                )
              );
          }
        });
      } catch (err: any) {
        logger.warn(`DB reorder failed for ${serviceId}: ${err?.message || err}`);
      }
    }

    logger.info(`Reordered packages for service '${serviceId}'`, 'ServicePackageRepo');
  }

  /**
   * Unassign / delete a package from a service
   */
  async deleteServicePackage(serviceId: string, packageId: string): Promise<void> {
    const normKey = (serviceId || '').toLowerCase().trim();
    const canon = canonicalizeServiceKey(normKey);
    const idKey = canon ? canon.id : normKey;

    const storeMap = servicePackagesStore.get(idKey);
    if (storeMap) {
      storeMap.delete(packageId);
    }
    const assigned = this.getAssignedPackageIds(idKey);
    if (assigned) {
      this.setAssignedPackageIds(idKey, assigned.filter((id) => id !== packageId));
    }

    const isConnected = await pingDatabase();
    if (isConnected.connected) {
      try {
        const db = getDatabase();
        await db
          .delete(servicePackages)
          .where(
            and(
              canon
                ? or(eq(servicePackages.serviceId, canon.id), eq(servicePackages.serviceId, canon.slug))
                : eq(servicePackages.serviceId, idKey),
              eq(servicePackages.packageId, packageId)
            )
          );
      } catch (err: any) {
        logger.warn(`DB delete failed for ${serviceId}/${packageId}: ${err?.message || err}`);
      }
    }

    logger.info(`Unassigned package '${packageId}' from service '${serviceId}'`, 'ServicePackageRepo');
  }
}

export const servicePackageRepository = new ServicePackageRepository();

