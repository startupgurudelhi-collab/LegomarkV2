import { useState, useEffect, useCallback } from 'react';
import {
  SERVICE_CATEGORIES,
  SERVICES,
  PACKAGES,
  getServiceBySlug,
  getRelatedServices,
} from '../data/websiteData';
import { ServiceCategory, ServiceCategoryMeta, ServiceItem } from '../types/website';

export interface ClientPublicCategoryItem {
  id: string;
  name: string;
  shortLabel: string;
  description: string | null;
  iconName: string;
  displayOrder: number;
  count: string;
}

export interface ClientPublicServiceSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  shortDesc: string;
  fullDesc: string;
  startingPrice: string;
  pricingType: string;
  governmentFeeNote: string | null;
  timeline: string;
  popular: boolean;
  badge: string | null;
  iconName: string;
  displayOrder: number;
  features: string[];
}

export interface ClientPublicServiceDetail extends ClientPublicServiceSummary {
  headline: string;
  overview: string;
  highlights: Array<{
    id: string;
    title: string;
    description: string;
    iconName: string;
    displayOrder: number;
  }>;
  benefits: string[];
  deliverables: string[];
  documents: string[];
  processSteps: Array<{
    step: string;
    title: string;
    description: string;
    displayOrder: number;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    displayOrder: number;
  }>;
  relatedServices: Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    shortDesc: string;
    startingPrice: string;
    timeline: string;
    iconName: string;
  }>;
  packages?: Array<{
    id: string;
    name: string;
    tagline: string | null;
    price: string;
    priceAmount?: number;
    billingType?: string;
    idealFor: string;
    popular?: boolean;
    badge?: string | null;
    features: string[];
    displayOrder?: number;
  }>;
  seo: {
    title: string | null;
    metaDescription: string | null;
  };
}

/**
 * Static fallback helper: Return all categories
 */
export function getStaticFallbackCategories(): ClientPublicCategoryItem[] {
  return SERVICE_CATEGORIES.map((c, idx) => ({
    id: c.id,
    name: c.name,
    shortLabel: c.shortLabel,
    description: c.description || null,
    iconName: c.iconName,
    displayOrder: idx,
    count: c.count || '0',
  }));
}

/**
 * Static fallback helper: Return all services
 */
export function getStaticFallbackServices(): ClientPublicServiceSummary[] {
  return SERVICES.map((s, idx) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    category: s.category,
    shortDesc: s.shortDesc,
    fullDesc: s.fullDesc,
    startingPrice: s.startingPrice,
    pricingType: s.pricingType || 'fixed',
    governmentFeeNote: s.governmentFeeNote || null,
    timeline: s.timeline,
    popular: !!s.popular,
    badge: s.badge || null,
    iconName: s.iconName,
    displayOrder: idx,
    features: s.features || [],
  }));
}

/**
 * Static fallback helper: Return single service detail by slug
 */
export function getStaticFallbackServiceBySlug(slug: string): ClientPublicServiceDetail | null {
  const s = getServiceBySlug(slug);
  if (!s) return null;

  const landing = s.landingPage;
  const related = getRelatedServices(s) || [];

  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    category: s.category,
    shortDesc: s.shortDesc,
    fullDesc: s.fullDesc,
    startingPrice: s.startingPrice,
    pricingType: s.pricingType || 'fixed',
    governmentFeeNote: s.governmentFeeNote || null,
    timeline: s.timeline,
    popular: !!s.popular,
    badge: s.badge || null,
    iconName: s.iconName,
    displayOrder: 0,
    headline: landing?.headline || s.title,
    overview: landing?.overview || s.fullDesc,
    highlights: [
      {
        id: 'hl-1',
        title: 'CA / CS & Legal Verification',
        description: 'Processed by practicing corporate professionals',
        iconName: 'ShieldCheck',
        displayOrder: 0,
      },
      {
        id: 'hl-2',
        title: 'Official Portal Processing',
        description: 'Direct MCA / GST / IP India portal filings',
        iconName: 'FileCheck2',
        displayOrder: 1,
      },
    ],
    features: s.features || [],
    benefits: landing?.benefits || [],
    deliverables: landing?.deliverables || [],
    documents: landing?.documents || [],
    processSteps: (landing?.process || []).map((p, pIdx) => ({
      step: p.step,
      title: p.title,
      description: p.description,
      displayOrder: pIdx,
    })),
    faqs: (landing?.faqs || []).map((f, fIdx) => ({
      question: f.question,
      answer: f.answer,
      displayOrder: fIdx,
    })),
    relatedServices: related.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      shortDesc: r.shortDesc,
      startingPrice: r.startingPrice,
      timeline: r.timeline,
      iconName: r.iconName,
    })),
    packages: s.packages && s.packages.length > 0
      ? s.packages.map((pkg, idx) => ({
          id: pkg.id,
          name: pkg.name,
          tagline: pkg.tagline || null,
          price: pkg.price,
          priceAmount: parseFloat(String(pkg.price).replace(/[^\d.]/g, '')) || 0,
          billingType: pkg.period?.includes('year') ? 'yearly' : pkg.period?.includes('mo') ? 'monthly' : 'one_time',
          idealFor: pkg.idealFor,
          popular: !!pkg.popular,
          badge: pkg.badge || null,
          features: pkg.features || [],
          displayOrder: idx,
        }))
      : s.slug === 'private-limited-company-registration'
        ? PACKAGES.map((p, idx) => ({
            id: p.id,
            name: p.name,
            tagline: p.tagline || null,
            price: p.price,
            priceAmount: parseFloat(p.price.replace(/[^\d.]/g, '')) || 0,
            billingType: p.period?.includes('year') ? 'yearly' : p.period?.includes('mo') ? 'monthly' : 'one_time',
            idealFor: p.idealFor,
            popular: !!p.popular,
            badge: p.badge || null,
            features: p.features || [],
            displayOrder: idx,
          }))
        : [],
    seo: {
      title: `${s.title} | Corporate Legal & Tax Advisory | LEGOMARK INDIA`,
      metaDescription: s.shortDesc,
    },
  };
}

/**
 * Fetch all active categories from API with automatic fallback
 */
export async function fetchPublicCategories(): Promise<ClientPublicCategoryItem[]> {
  try {
    const res = await fetch('/api/services/categories', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return getStaticFallbackCategories();
    }
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return getStaticFallbackCategories();
  } catch {
    return getStaticFallbackCategories();
  }
}

/**
 * Fetch all active services from API with automatic fallback
 */
export async function fetchPublicServices(): Promise<ClientPublicServiceSummary[]> {
  try {
    const res = await fetch('/api/services', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return getStaticFallbackServices();
    }
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return getStaticFallbackServices();
  } catch {
    return getStaticFallbackServices();
  }
}

/**
 * Fetch active services for a category from API with automatic fallback
 */
export async function fetchPublicServicesByCategory(
  categoryId: string
): Promise<{ category: ClientPublicCategoryItem; services: ClientPublicServiceSummary[] } | null> {
  try {
    const res = await fetch(`/api/services/category/${encodeURIComponent(categoryId)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      const all = getStaticFallbackServices();
      const cat = getStaticFallbackCategories().find((c) => c.id === categoryId);
      if (!cat) return null;
      const filtered = all.filter((s) => s.category === categoryId);
      return { category: cat, services: filtered };
    }
    const json = await res.json();
    if (json.success && json.data) {
      return {
        category: json.category,
        services: json.data,
      };
    }
    return null;
  } catch {
    const all = getStaticFallbackServices();
    const cat = getStaticFallbackCategories().find((c) => c.id === categoryId);
    if (!cat) return null;
    const filtered = all.filter((s) => s.category === categoryId);
    return { category: cat, services: filtered };
  }
}

/**
 * Fetch single service landing-page payload by canonical slug with automatic fallback
 */
export async function fetchPublicServiceBySlug(
  slug: string
): Promise<ClientPublicServiceDetail | null> {
  try {
    const res = await fetch(`/api/services/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      return getStaticFallbackServiceBySlug(slug);
    }
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return getStaticFallbackServiceBySlug(slug);
  } catch {
    return getStaticFallbackServiceBySlug(slug);
  }
}

/**
 * Maps a summary service into the canonical ServiceItem interface
 */
export function mapSummaryToServiceItem(summary: ClientPublicServiceSummary): ServiceItem {
  const fallback = getServiceBySlug(summary.slug);
  return {
    id: summary.id,
    slug: summary.slug,
    category: summary.category as ServiceCategory,
    title: summary.title,
    shortDesc: summary.shortDesc,
    fullDesc: summary.fullDesc,
    startingPrice: summary.startingPrice,
    pricingType: summary.pricingType as 'fixed' | 'recurring' | 'custom',
    governmentFeeNote: summary.governmentFeeNote || undefined,
    timeline: summary.timeline,
    popular: summary.popular,
    badge: summary.badge || undefined,
    iconName: summary.iconName,
    features: summary.features,
    landingPage: fallback?.landingPage,
  };
}

/**
 * Maps a full detail payload from the database into the canonical ServiceItem interface
 */
export function mapDetailToServiceItem(detail: ClientPublicServiceDetail): ServiceItem {
  const fallback = getServiceBySlug(detail.slug);
  const mappedPackages = Array.isArray(detail.packages)
    ? detail.packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        tagline: pkg.tagline || '',
        price: pkg.price,
        period: pkg.billingType === 'yearly' ? 'year' : pkg.billingType === 'monthly' ? 'month' : undefined,
        popular: !!pkg.popular,
        idealFor: pkg.idealFor,
        features: pkg.features || [],
        ctaLabel: 'Buy Package',
        badge: pkg.badge || undefined,
      }))
    : (fallback?.packages || []);

  return {
    id: detail.id,
    slug: detail.slug,
    category: detail.category as ServiceCategory,
    title: detail.title,
    shortDesc: detail.shortDesc,
    fullDesc: detail.fullDesc,
    startingPrice: detail.startingPrice,
    pricingType: detail.pricingType as 'fixed' | 'recurring' | 'custom',
    governmentFeeNote: detail.governmentFeeNote || undefined,
    timeline: detail.timeline,
    popular: detail.popular,
    badge: detail.badge || undefined,
    iconName: detail.iconName,
    features: detail.features,
    landingPage: {
      headline: detail.headline || fallback?.landingPage?.headline,
      overview: detail.overview || fallback?.landingPage?.overview || detail.fullDesc,
      benefits: detail.benefits && detail.benefits.length > 0 ? detail.benefits : (fallback?.landingPage?.benefits || []),
      deliverables: detail.deliverables && detail.deliverables.length > 0 ? detail.deliverables : (fallback?.landingPage?.deliverables || []),
      documents: detail.documents && detail.documents.length > 0 ? detail.documents : (fallback?.landingPage?.documents || []),
      process: detail.processSteps && detail.processSteps.length > 0
        ? detail.processSteps.map((p) => ({
            step: p.step,
            title: p.title,
            description: p.description,
          }))
        : (fallback?.landingPage?.process || []),
      faqs: detail.faqs && detail.faqs.length > 0
        ? detail.faqs.map((f) => ({
            question: f.question,
            answer: f.answer,
          }))
        : (fallback?.landingPage?.faqs || []),
      packages: mappedPackages,
    },
    packages: mappedPackages,
  };
}

/**
 * Maps category metadata with dynamically counted active services
 */
export function mapCategoryToMeta(
  cat: ClientPublicCategoryItem,
  serviceCount?: number
): ServiceCategoryMeta {
  return {
    id: cat.id as ServiceCategory,
    name: cat.name,
    shortLabel: cat.shortLabel,
    count: serviceCount !== undefined ? `${serviceCount}` : (cat.count || '0'),
    iconName: cat.iconName,
    description: cat.description || '',
  };
}

/**
 * Global hook to fetch and keep public categories & services synchronized with the database
 */
export function usePublicServicesData() {
  const [categories, setCategories] = useState<ServiceCategoryMeta[]>(() => SERVICE_CATEGORIES);
  const [services, setServices] = useState<ServiceItem[]>(() => SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catsRes, servsRes] = await Promise.all([
          fetchPublicCategories(),
          fetchPublicServices(),
        ]);
        if (!isMounted) return;

        if (servsRes && servsRes.length > 0) {
          const mappedServices = servsRes.map(mapSummaryToServiceItem);
          setServices(mappedServices);

          if (catsRes && catsRes.length > 0) {
            const mappedCategories = catsRes.map((c) => {
              const count = servsRes.filter((s) => s.category === c.id).length;
              return mapCategoryToMeta(c, count);
            });
            setCategories(mappedCategories);
          }
        }
      } catch (err) {
        console.warn('Could not refresh public services from database API, using static fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getServiceBySlugDyn = useCallback(
    (slug: string): ServiceItem | undefined => {
      const found = services.find((s) => s.slug === slug);
      if (found) return found;
      return getServiceBySlug(slug);
    },
    [services]
  );

  const getRelatedServicesDyn = useCallback(
    (currentService: ServiceItem): ServiceItem[] => {
      const related = services.filter(
        (s) => s.slug !== currentService.slug && s.category === currentService.category
      );
      if (related.length >= 3) return related.slice(0, 3);
      const other = services.filter(
        (s) => s.slug !== currentService.slug && s.category !== currentService.category
      );
      const combined = [...related, ...other];
      if (combined.length >= 3) return combined.slice(0, 3);
      return getRelatedServices(currentService) || [];
    },
    [services]
  );

  return {
    categories,
    services,
    loading,
    getServiceBySlug: getServiceBySlugDyn,
    getRelatedServices: getRelatedServicesDyn,
  };
}

/**
 * Hook to fetch a full single service with all CMS child entities (FAQs, deliverables, process steps, etc.)
 */
export function usePublicServiceDetail(slug: string | null) {
  const [service, setService] = useState<ServiceItem | undefined>(() => {
    if (!slug) return undefined;
    return getServiceBySlug(slug);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setService(undefined);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fallback = getServiceBySlug(slug);
    setService(fallback);

    async function loadDetail() {
      try {
        const detail = await fetchPublicServiceBySlug(slug!);
        if (!isMounted || !detail) return;
        setService(mapDetailToServiceItem(detail));
      } catch (err) {
        console.warn(`Could not refresh service detail '${slug}' from database, keeping fallback:`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { service, loading };
}

