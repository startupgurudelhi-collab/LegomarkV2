import { getDatabase, pingDatabase } from '../config/database';
import {
  serviceCategories,
  services,
  serviceFeatures,
  serviceHighlights,
  serviceBenefits,
  serviceDeliverables,
  serviceDocuments,
  serviceProcessSteps,
  serviceFaqs,
  serviceRelatedServices,
} from '../../db/schema/index';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { SERVICES, SERVICE_CATEGORIES, getServiceBySlug, getRelatedServices } from '../../src/data/websiteData';

export interface PublicCategoryItem {
  id: string;
  name: string;
  shortLabel: string;
  description: string | null;
  iconName: string;
  displayOrder: number;
  count: string;
}

export interface PublicServiceSummary {
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

export interface PublicServiceDetail extends PublicServiceSummary {
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

export class ServiceRepository {
  /**
   * Public: Get all active categories with service count
   */
  async getAllPublicCategories(): Promise<PublicCategoryItem[]> {
    const isConnected = await pingDatabase();
    if (!isConnected.connected) {
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

    try {
      const db = getDatabase();
      const categories = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.isActive, true))
        .orderBy(asc(serviceCategories.displayOrder));

      const activeServices = await db
        .select({ categoryId: services.categoryId })
        .from(services)
        .where(eq(services.isActive, true));

      const countMap = new Map<string, number>();
      for (const s of activeServices) {
        countMap.set(s.categoryId, (countMap.get(s.categoryId) || 0) + 1);
      }

      return categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        shortLabel: cat.shortLabel,
        description: cat.description,
        iconName: cat.iconName,
        displayOrder: cat.displayOrder,
        count: `${countMap.get(cat.id) || 0}`,
      }));
    } catch (error) {
      logger.error('Error in ServiceRepository.getAllPublicCategories', 'ServiceRepo', error);
      throw error;
    }
  }

  /**
   * Public: Get all active services with summary features
   */
  async getAllPublicServices(): Promise<PublicServiceSummary[]> {
    const isConnected = await pingDatabase();
    if (!isConnected.connected) {
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

    try {
      const db = getDatabase();
      const rows = await db
        .select()
        .from(services)
        .where(eq(services.isActive, true))
        .orderBy(asc(services.displayOrder));

      if (rows.length === 0) {
        return [];
      }

      const serviceIds = rows.map((r) => r.id);
      const allFeatures = await db
        .select()
        .from(serviceFeatures)
        .where(inArray(serviceFeatures.serviceId, serviceIds))
        .orderBy(asc(serviceFeatures.displayOrder));

      const featuresByServiceId = new Map<string, string[]>();
      for (const feat of allFeatures) {
        const list = featuresByServiceId.get(feat.serviceId) || [];
        list.push(feat.featureText);
        featuresByServiceId.set(feat.serviceId, list);
      }

      return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        category: r.categoryId,
        shortDesc: r.shortDesc,
        fullDesc: r.fullDesc,
        startingPrice: r.priceDisplayOverride || `₹${Number(r.priceAmount).toLocaleString('en-IN')}`,
        pricingType: r.pricingType,
        governmentFeeNote: r.governmentFeeNote,
        timeline: r.timeline,
        popular: r.popular,
        badge: r.badge,
        iconName: r.iconName,
        displayOrder: r.displayOrder,
        features: featuresByServiceId.get(r.id) || [],
      }));
    } catch (error) {
      logger.error('Error in ServiceRepository.getAllPublicServices', 'ServiceRepo', error);
      throw error;
    }
  }

  /**
   * Public: Get active services for a specific category
   */
  async getPublicServicesByCategory(categoryId: string): Promise<{ category: PublicCategoryItem; services: PublicServiceSummary[] } | null> {
    const isConnected = await pingDatabase();
    if (!isConnected.connected) {
      const cat = SERVICE_CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) return null;

      const matchingServices = SERVICES.filter((s) => s.category === categoryId).map((s, idx) => ({
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

      return {
        category: {
          id: cat.id,
          name: cat.name,
          shortLabel: cat.shortLabel,
          description: cat.description || null,
          iconName: cat.iconName,
          displayOrder: 0,
          count: `${matchingServices.length}`,
        },
        services: matchingServices,
      };
    }

    try {
      const db = getDatabase();
      const catRows = await db
        .select()
        .from(serviceCategories)
        .where(and(eq(serviceCategories.id, categoryId), eq(serviceCategories.isActive, true)))
        .limit(1);

      if (catRows.length === 0) {
        return null;
      }

      const cat = catRows[0];
      const rows = await db
        .select()
        .from(services)
        .where(and(eq(services.categoryId, categoryId), eq(services.isActive, true)))
        .orderBy(asc(services.displayOrder));

      let featuresByServiceId = new Map<string, string[]>();
      if (rows.length > 0) {
        const serviceIds = rows.map((r) => r.id);
        const allFeatures = await db
          .select()
          .from(serviceFeatures)
          .where(inArray(serviceFeatures.serviceId, serviceIds))
          .orderBy(asc(serviceFeatures.displayOrder));

        for (const feat of allFeatures) {
          const list = featuresByServiceId.get(feat.serviceId) || [];
          list.push(feat.featureText);
          featuresByServiceId.set(feat.serviceId, list);
        }
      }

      const mappedServices: PublicServiceSummary[] = rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        category: r.categoryId,
        shortDesc: r.shortDesc,
        fullDesc: r.fullDesc,
        startingPrice: r.priceDisplayOverride || `₹${Number(r.priceAmount).toLocaleString('en-IN')}`,
        pricingType: r.pricingType,
        governmentFeeNote: r.governmentFeeNote,
        timeline: r.timeline,
        popular: r.popular,
        badge: r.badge,
        iconName: r.iconName,
        displayOrder: r.displayOrder,
        features: featuresByServiceId.get(r.id) || [],
      }));

      return {
        category: {
          id: cat.id,
          name: cat.name,
          shortLabel: cat.shortLabel,
          description: cat.description,
          iconName: cat.iconName,
          displayOrder: cat.displayOrder,
          count: `${mappedServices.length}`,
        },
        services: mappedServices,
      };
    } catch (error) {
      logger.error(`Error in ServiceRepository.getPublicServicesByCategory(${categoryId})`, 'ServiceRepo', error);
      throw error;
    }
  }

  /**
   * Public: Get complete single service by canonical slug with all nested CMS child tables
   */
  async getPublicServiceBySlug(slug: string): Promise<PublicServiceDetail | null> {
    const isConnected = await pingDatabase();
    if (!isConnected.connected) {
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

    try {
      const db = getDatabase();
      const serviceRows = await db
        .select()
        .from(services)
        .where(and(eq(services.slug, slug), eq(services.isActive, true)))
        .limit(1);

      if (serviceRows.length === 0) {
        return null;
      }

      const s = serviceRows[0];
      const serviceId = s.id;

      // Query all child tables concurrently
      const [
        featuresList,
        highlightsList,
        benefitsList,
        deliverablesList,
        documentsList,
        stepsList,
        faqsList,
        relatedMappings,
      ] = await Promise.all([
        db
          .select()
          .from(serviceFeatures)
          .where(eq(serviceFeatures.serviceId, serviceId))
          .orderBy(asc(serviceFeatures.displayOrder)),
        db
          .select()
          .from(serviceHighlights)
          .where(and(eq(serviceHighlights.serviceId, serviceId), eq(serviceHighlights.isActive, true)))
          .orderBy(asc(serviceHighlights.displayOrder)),
        db
          .select()
          .from(serviceBenefits)
          .where(eq(serviceBenefits.serviceId, serviceId))
          .orderBy(asc(serviceBenefits.displayOrder)),
        db
          .select()
          .from(serviceDeliverables)
          .where(eq(serviceDeliverables.serviceId, serviceId))
          .orderBy(asc(serviceDeliverables.displayOrder)),
        db
          .select()
          .from(serviceDocuments)
          .where(eq(serviceDocuments.serviceId, serviceId))
          .orderBy(asc(serviceDocuments.displayOrder)),
        db
          .select()
          .from(serviceProcessSteps)
          .where(eq(serviceProcessSteps.serviceId, serviceId))
          .orderBy(asc(serviceProcessSteps.displayOrder)),
        db
          .select()
          .from(serviceFaqs)
          .where(and(eq(serviceFaqs.serviceId, serviceId), eq(serviceFaqs.isActive, true)))
          .orderBy(asc(serviceFaqs.displayOrder)),
        db
          .select()
          .from(serviceRelatedServices)
          .where(eq(serviceRelatedServices.serviceId, serviceId))
          .orderBy(asc(serviceRelatedServices.displayOrder)),
      ]);

      // Resolve related services
      let resolvedRelatedServices: Array<{
        id: string;
        slug: string;
        title: string;
        category: string;
        shortDesc: string;
        startingPrice: string;
        timeline: string;
        iconName: string;
      }> = [];

      if (relatedMappings.length > 0) {
        const relatedIds = relatedMappings.map((r) => r.relatedServiceId);
        const relatedServiceRows = await db
          .select()
          .from(services)
          .where(and(inArray(services.id, relatedIds), eq(services.isActive, true)));

        const rowMap = new Map(relatedServiceRows.map((r) => [r.id, r]));
        resolvedRelatedServices = relatedMappings
          .map((m) => rowMap.get(m.relatedServiceId))
          .filter((r): r is NonNullable<typeof r> => !!r)
          .map((r) => ({
            id: r.id,
            slug: r.slug,
            title: r.title,
            category: r.categoryId,
            shortDesc: r.shortDesc,
            startingPrice: r.priceDisplayOverride || `₹${Number(r.priceAmount).toLocaleString('en-IN')}`,
            timeline: r.timeline,
            iconName: r.iconName,
          }));
      }

      return {
        id: s.id,
        slug: s.slug,
        title: s.title,
        category: s.categoryId,
        shortDesc: s.shortDesc,
        fullDesc: s.fullDesc,
        startingPrice: s.priceDisplayOverride || `₹${Number(rPrice(s.priceAmount)).toLocaleString('en-IN')}`,
        pricingType: s.pricingType,
        governmentFeeNote: s.governmentFeeNote,
        timeline: s.timeline,
        popular: s.popular,
        badge: s.badge,
        iconName: s.iconName,
        displayOrder: s.displayOrder,
        headline: s.headline || s.title,
        overview: s.overview || s.fullDesc,
        highlights: highlightsList.map((h) => ({
          id: h.id,
          title: h.title,
          description: h.description,
          iconName: h.iconName,
          displayOrder: h.displayOrder,
        })),
        features: featuresList.map((f) => f.featureText),
        benefits: benefitsList.map((b) => b.benefitText),
        deliverables: deliverablesList.map((d) => d.deliverableText),
        documents: documentsList.map((doc) => doc.documentText),
        processSteps: stepsList.map((step) => ({
          step: step.stepNumber,
          title: step.title,
          description: step.description,
          displayOrder: step.displayOrder,
        })),
        faqs: faqsList.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
          displayOrder: faq.displayOrder,
        })),
        relatedServices: resolvedRelatedServices,
        seo: {
          title: s.seoTitle || `${s.title} | Corporate Legal & Tax Advisory | LEGOMARK INDIA`,
          metaDescription: s.metaDescription || s.shortDesc,
        },
      };
    } catch (error) {
      logger.error(`Error in ServiceRepository.getPublicServiceBySlug(${slug})`, 'ServiceRepo', error);
      throw error;
    }
  }
}

function rPrice(val: string | number): number {
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? 0 : parsed;
}

export const serviceRepository = new ServiceRepository();
