import { PACKAGES as STATIC_PACKAGES, PACKAGE_MATRIX as STATIC_PACKAGE_MATRIX } from '../data/websiteData';
import { PackageTier } from '../types/website';

export interface PublicApiPackage {
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

export interface PublicMatrixPackage {
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
  // Computed display helpers
  formattedPrice: string;
  period?: string;
  shortName: string;
  ctaLabel: string;
}

export interface PublicMatrixRowItem {
  id: string;
  category: string;
  featureName: string;
  tooltip: string | null;
  displayOrder: number;
  packageValues: Record<string, boolean | string>;
}

export interface PublicMatrixData {
  packages: PublicMatrixPackage[];
  rows: PublicMatrixRowItem[];
  categories: string[];
  isFallback?: boolean;
}

/**
 * Format currency amount to Indian format (e.g. ₹16,999)
 */
export function formatPackagePrice(pkg: {
  priceDisplayOverride?: string | null;
  priceAmount: string;
  currency?: string;
  billingType?: string;
}): { price: string; period?: string } {
  if (pkg.priceDisplayOverride && pkg.priceDisplayOverride.trim()) {
    return {
      price: pkg.priceDisplayOverride.trim(),
      period: pkg.billingType === 'yearly' ? '/ year' : pkg.billingType === 'monthly' ? '/ mo' : undefined,
    };
  }

  const num = parseFloat(pkg.priceAmount || '0');
  const currencySymbol = pkg.currency === 'USD' ? '$' : '₹';
  const formattedNum = isNaN(num) ? pkg.priceAmount : num.toLocaleString('en-IN');

  return {
    price: `${currencySymbol}${formattedNum}`,
    period: pkg.billingType === 'yearly' ? '/ year' : pkg.billingType === 'monthly' ? '/ mo' : undefined,
  };
}

/**
 * Derives a clean CTA label from package name
 */
export function getPackageCtaLabel(pkg: { id: string; name: string }): string {
  if (pkg.id === 'starter') return 'Choose Starter';
  const firstWord = pkg.name.trim().split(' ')[0] || 'Plan';
  return `Select ${firstWord}`;
}

/**
 * Fetch active packages for the public website.
 * Falls back safely to static websiteData.ts if database/API is offline or returns error.
 */
export async function fetchPublicPackages(): Promise<{ packages: PackageTier[]; isFallback: boolean }> {
  try {
    const response = await fetch('/api/packages', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      // 503 or any error -> fallback safely
      return { packages: STATIC_PACKAGES, isFallback: true };
    }

    const json = await response.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      return { packages: STATIC_PACKAGES, isFallback: true };
    }

    const apiPackages: PublicApiPackage[] = json.data;

    // Convert API format to PackageTier model used by frontend
    const mapped: PackageTier[] = apiPackages.map((pkg) => {
      const { price, period } = formatPackagePrice(pkg);
      return {
        id: pkg.id,
        name: pkg.name,
        tagline: pkg.tagline || '',
        price,
        period,
        popular: Boolean(pkg.popular),
        badge: pkg.badge || undefined,
        idealFor: pkg.idealFor || '',
        features: pkg.features || [],
        ctaLabel: getPackageCtaLabel(pkg),
      };
    });

    return { packages: mapped, isFallback: false };
  } catch {
    // Network or parse error -> fallback safely without throwing
    return { packages: STATIC_PACKAGES, isFallback: true };
  }
}

/**
 * Fetch dynamic comparison matrix data for the public website.
 * Falls back safely to static websiteData.ts formatted dynamically if database/API is offline.
 */
export async function fetchPublicMatrix(): Promise<PublicMatrixData> {
  try {
    const response = await fetch('/api/packages/matrix', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return getStaticFallbackMatrix();
    }

    const json = await response.json();
    if (!json.success || !json.data || !Array.isArray(json.data.packages) || json.data.packages.length === 0) {
      return getStaticFallbackMatrix();
    }

    const { packages: rawPackages, rows: rawRows } = json.data;

    const mappedPackages: PublicMatrixPackage[] = rawPackages.map((pkg: any) => {
      const { price, period } = formatPackagePrice(pkg);
      const firstWord = pkg.name.trim().split(' ')[0] || 'Plan';
      return {
        id: pkg.id,
        name: pkg.name,
        tagline: pkg.tagline || null,
        priceAmount: pkg.priceAmount,
        currency: pkg.currency || 'INR',
        billingType: pkg.billingType,
        priceDisplayOverride: pkg.priceDisplayOverride || null,
        popular: Boolean(pkg.popular),
        badge: pkg.badge || null,
        displayOrder: pkg.displayOrder ?? 0,
        formattedPrice: price,
        period,
        shortName: firstWord,
        ctaLabel: getPackageCtaLabel(pkg),
      };
    });

    const mappedRows: PublicMatrixRowItem[] = (rawRows || []).map((r: any, idx: number) => ({
      id: r.id || `row-${idx}`,
      category: r.category || 'General Inclusions',
      featureName: r.featureName,
      tooltip: r.tooltip || null,
      displayOrder: r.displayOrder ?? idx,
      packageValues: r.packageValues || {},
    }));

    // Extract unique categories preserving row appearance order
    const categories: string[] = [];
    const seenCategories = new Set<string>();
    for (const row of mappedRows) {
      if (!seenCategories.has(row.category)) {
        seenCategories.add(row.category);
        categories.push(row.category);
      }
    }

    return {
      packages: mappedPackages,
      rows: mappedRows,
      categories,
      isFallback: false,
    };
  } catch {
    return getStaticFallbackMatrix();
  }
}

/**
 * Transforms static websiteData into the unified dynamic matrix structure
 */
function getStaticFallbackMatrix(): PublicMatrixData {
  const mappedPackages: PublicMatrixPackage[] = STATIC_PACKAGES.map((pkg, idx) => {
    const firstWord = pkg.name.trim().split(' ')[0] || 'Plan';
    return {
      id: pkg.id,
      name: pkg.name,
      tagline: pkg.tagline || null,
      priceAmount: pkg.price.replace(/[^\d.]/g, '') || '0',
      currency: 'INR',
      billingType: pkg.period?.includes('yr') || pkg.period?.includes('year') ? 'yearly' : 'one_time',
      priceDisplayOverride: pkg.price,
      popular: Boolean(pkg.popular),
      badge: pkg.badge || null,
      displayOrder: idx,
      formattedPrice: pkg.price,
      period: pkg.period,
      shortName: firstWord,
      ctaLabel: pkg.ctaLabel || getPackageCtaLabel(pkg),
    };
  });

  const mappedRows: PublicMatrixRowItem[] = STATIC_PACKAGE_MATRIX.map((row, idx) => ({
    id: `static-row-${idx}`,
    category: row.category,
    featureName: row.featureName,
    tooltip: row.tooltip || null,
    displayOrder: idx,
    packageValues: {
      starter: row.starter,
      growth: row.growth,
      enterprise: row.enterprise,
    },
  }));

  const categories: string[] = [];
  const seen = new Set<string>();
  for (const row of mappedRows) {
    if (!seen.has(row.category)) {
      seen.add(row.category);
      categories.push(row.category);
    }
  }

  return {
    packages: mappedPackages,
    rows: mappedRows,
    categories,
    isFallback: true,
  };
}
