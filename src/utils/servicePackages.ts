import { PackageTier, ServiceItem } from '../types/website';
import { PACKAGES } from '../data/websiteData';

/**
 * Retrieves the package tiers for a specific service.
 * Respects explicitly configured/assigned packages on the service object (from database / API / admin),
 * then checks packages on landingPage, and falls back to the authoritative canonical PACKAGES catalog.
 */
export function getServicePackages(service?: ServiceItem | null): PackageTier[] {
  if (!service) return [];

  // 1. Explicit packages on the service object (assigned via Admin Service Editor or database)
  if (service.packages && service.packages.length > 0) {
    return service.packages;
  }

  // 2. Explicit packages on landingPage
  if (service.landingPage?.packages && service.landingPage.packages.length > 0) {
    return service.landingPage.packages;
  }

  // 3. Authoritative Canonical Packages Catalogue (Starter Incorporation, Growth & Compliance, Corporate Annual Retainer)
  return PACKAGES;
}
