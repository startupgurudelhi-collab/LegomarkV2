import {
  SERVICE_CATEGORIES,
  SERVICES,
  getServiceBySlug,
  getRelatedServices,
} from '../data/websiteData';
import { ServiceCategoryMeta, ServiceItem } from '../types/website';

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
