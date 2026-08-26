import { PackageTier, ServiceItem } from '../types/website';

/**
 * Retrieves the package tiers for a specific service.
 * Respects explicitly configured/assigned packages on the service object (from database / API / admin)
 * or assigned packages on landingPage.
 * 
 * If a service has zero assigned packages, returns an empty array ([]) so no unrelated or default
 * packages are displayed on the public landing page.
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

  // 3. No packages assigned -> return empty array (do not inject generic fallback catalog)
  return [];
}

