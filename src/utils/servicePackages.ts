import { PackageTier, ServiceItem } from '../types/website';
import { PACKAGES } from '../data/websiteData';

/**
 * Retrieves the package tiers for a specific service.
 * Respects explicitly configured/assigned packages on the service object (from database / API / admin)
 * or assigned packages in local storage for that specific service.
 *
 * Required behavior:
 * - 1 selected package → public service page shows only that 1 package.
 * - 2 selected packages → public page shows only those 2.
 * - 3 selected packages → existing 3-package display remains unchanged.
 * - Selection must remain service-specific and persist after Save/refresh.
 * - Do not hard-code package counts.
 * - Public page must use only the packages assigned to that service.
 */
export function getServicePackages(service?: ServiceItem | null): PackageTier[] {
  if (!service) return [];

  // 1. Check service-specific persisted selection (from Admin)
  if (typeof window !== 'undefined') {
    const serviceKeys = [service.id, service.slug].filter(Boolean);
    for (const key of serviceKeys) {
      try {
        const stored = localStorage.getItem(`legomark_service_packages_${key}`);
        if (stored !== null) {
          const parsedIds: string[] = JSON.parse(stored);
          if (Array.isArray(parsedIds)) {
            if (parsedIds.length === 0) {
              return [];
            }
            // Resolve from service.packages (if available) or PACKAGES catalogue
            const sourceList =
              service.packages && service.packages.length > 0
                ? service.packages
                : PACKAGES;

            const resolved: PackageTier[] = [];
            for (const id of parsedIds) {
              const match =
                sourceList.find((p) => p.id === id) ||
                PACKAGES.find((p) => p.id === id);
              if (match && !resolved.some((r) => r.id === match.id)) {
                resolved.push(match);
              }
            }
            return resolved;
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }
  }

  // 2. Explicit packages on the service object (assigned via Admin Service Editor or database)
  const explicitPackageIds = (service as any).packageIds;
  if (service.packages && service.packages.length > 0) {
    if (Array.isArray(explicitPackageIds) && explicitPackageIds.length > 0) {
      const filtered = service.packages.filter((p) => explicitPackageIds.includes(p.id));
      if (filtered.length > 0) return filtered;
    }
    return service.packages;
  }

  // 3. Explicit packages on landingPage
  if (service.landingPage?.packages && service.landingPage.packages.length > 0) {
    return service.landingPage.packages;
  }

  // 4. Fallback for unconfigured services: existing 3-package display
  return PACKAGES;
}

