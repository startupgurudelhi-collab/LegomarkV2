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
  servicePackages,
  packages as packagesTable,
} from '../../db/schema/index';
import { eq, asc, inArray, count, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { SERVICES, SERVICE_CATEGORIES, getServiceBySlug } from '../../src/data/websiteData';

export interface AdminServiceItem {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  shortLabel: string | null;
  shortDesc: string;
  fullDesc: string;
  startingPrice: string;
  priceAmount: string | number;
  currency: string;
  pricingType: string;
  priceDisplayOverride: string | null;
  governmentFeeNote: string | null;
  timeline: string;
  popular: boolean;
  badge: string | null;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  headline: string | null;
  overview: string | null;
  aliases: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
  category: {
    id: string;
    name: string;
    shortLabel: string;
    iconName: string;
    displayOrder: number;
    isActive: boolean;
  } | null;
  counts: {
    featureCount: number;
    highlightCount: number;
    benefitCount: number;
    deliverableCount: number;
    documentCount: number;
    processStepCount: number;
    faqCount: number;
    relatedServiceCount: number;
    packageCount?: number;
  };
  features?: string[];
  highlights?: Array<{
    id?: string;
    title: string;
    description: string;
    iconName?: string;
    displayOrder?: number;
  }>;
  benefits?: string[];
  deliverables?: string[];
  documents?: string[];
  processSteps?: Array<{
    id?: string;
    stepNumber?: string;
    title: string;
    description: string;
    displayOrder?: number;
  }>;
  faqs?: Array<{
    id?: string;
    question: string;
    answer: string;
    displayOrder?: number;
    isActive?: boolean;
  }>;
  relatedServiceIds?: string[];
  packageIds?: string[];
  assignedPackages?: Array<{
    packageId: string;
    displayOrder: number;
    name?: string;
    price?: string;
    isActive?: boolean;
  }>;
}

export interface CreateServiceInput {
  id: string;
  slug: string;
  categoryId: string;
  title: string;
  shortLabel?: string | null;
  shortDesc: string;
  fullDesc?: string;
  startingPrice: string;
  priceAmount?: string | number;
  currency?: string;
  pricingType: 'fixed' | 'recurring' | 'custom' | string;
  priceDisplayOverride?: string | null;
  governmentFeeNote?: string | null;
  timeline: string;
  popular?: boolean;
  badge?: string | null;
  iconName: string;
  displayOrder?: number;
  isActive?: boolean;
  headline?: string | null;
  overview?: string | null;
  aliases?: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  features?: string[];
  highlights?: Array<{
    title: string;
    description: string;
    iconName?: string;
    displayOrder?: number;
  }>;
  benefits?: string[];
  deliverables?: string[];
  documents?: string[];
  processSteps?: Array<{
    stepNumber?: string;
    title: string;
    description: string;
    displayOrder?: number;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
    displayOrder?: number;
    isActive?: boolean;
  }>;
  relatedServiceIds?: string[];
  packageIds?: string[];
}

export interface UpdateServiceInput {
  slug: string;
  categoryId: string;
  title: string;
  shortLabel?: string | null;
  shortDesc: string;
  fullDesc?: string;
  startingPrice: string;
  priceAmount?: string | number;
  currency?: string;
  pricingType: 'fixed' | 'recurring' | 'custom' | string;
  priceDisplayOverride?: string | null;
  governmentFeeNote?: string | null;
  timeline: string;
  popular?: boolean;
  badge?: string | null;
  iconName: string;
  displayOrder?: number;
  isActive?: boolean;
  headline?: string | null;
  overview?: string | null;
  aliases?: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  features?: string[];
  highlights?: Array<{
    title: string;
    description: string;
    iconName?: string;
    displayOrder?: number;
  }>;
  benefits?: string[];
  deliverables?: string[];
  documents?: string[];
  processSteps?: Array<{
    stepNumber?: string;
    title: string;
    description: string;
    displayOrder?: number;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
    displayOrder?: number;
    isActive?: boolean;
  }>;
  relatedServiceIds?: string[];
  packageIds?: string[];
}

export interface ReorderServiceItem {
  id: string;
  categoryId?: string;
  displayOrder: number;
}

function parseStartingPrice(priceStr: string): { amount: string; override: string } {
  if (!priceStr || typeof priceStr !== 'string') {
    return { amount: '0.00', override: '₹0' };
  }
  const numericOnly = priceStr.replace(/[^\d.]/g, '');
  const parsed = parseFloat(numericOnly);
  const amount = isNaN(parsed) ? '0.00' : parsed.toFixed(2);
  return { amount, override: priceStr.trim() };
}

export class AdminServiceRepository {
  /**
   * Fetch all services (active + inactive) sorted by category.displayOrder ASC, then service.displayOrder ASC
   * Dynamic child-content counts derived directly from relational tables
   */
  async getAllAdminServices(): Promise<AdminServiceItem[]> {
    const isConnected = await pingDatabase();
    if (!isConnected.connected) {
      const now = new Date();
      return SERVICES.map((s, idx) => {
        const cat = SERVICE_CATEGORIES.find((c) => c.id === s.category);
        const catIdx = cat ? SERVICE_CATEGORIES.indexOf(cat) : 0;
        const details = getServiceBySlug(s.slug);
        const p = parseStartingPrice(s.startingPrice);

        return {
          id: s.id,
          slug: s.slug,
          categoryId: s.category,
          title: s.title,
          shortLabel: null,
          shortDesc: s.shortDesc,
          fullDesc: s.fullDesc || s.shortDesc,
          startingPrice: s.startingPrice,
          priceAmount: p.amount,
          currency: 'INR',
          pricingType: s.pricingType || 'fixed',
          priceDisplayOverride: s.startingPrice,
          governmentFeeNote: s.governmentFeeNote || null,
          timeline: s.timeline,
          popular: !!s.popular,
          badge: s.badge || null,
          iconName: s.iconName,
          displayOrder: idx,
          isActive: true,
          headline: details?.landingPage?.headline || null,
          overview: details?.landingPage?.overview || null,
          aliases: s.aliases || [],
          seoTitle: `${s.title} | LEGOMARK INDIA`,
          metaDescription: s.shortDesc,
          createdAt: now,
          updatedAt: now,
          updatedBy: 'system',
          category: cat
            ? {
                id: cat.id,
                name: cat.name,
                shortLabel: cat.shortLabel,
                iconName: cat.iconName,
                displayOrder: catIdx,
                isActive: true,
              }
            : null,
          counts: {
            featureCount: s.features?.length || 0,
            highlightCount: details?.landingPage?.benefits?.length || 4,
            benefitCount: details?.landingPage?.benefits?.length || 4,
            deliverableCount: details?.landingPage?.deliverables?.length || 4,
            documentCount: details?.landingPage?.documents?.length || 4,
            processStepCount: details?.landingPage?.process?.length || 4,
            faqCount: details?.landingPage?.faqs?.length || 4,
            relatedServiceCount: 3,
          },
        };
      });
    }

    try {
      const db = getDatabase();

      // Query services with joined category metadata
      const rows = await db
        .select({
          service: services,
          category: {
            id: serviceCategories.id,
            name: serviceCategories.name,
            shortLabel: serviceCategories.shortLabel,
            iconName: serviceCategories.iconName,
            displayOrder: serviceCategories.displayOrder,
            isActive: serviceCategories.isActive,
          },
        })
        .from(services)
        .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .orderBy(asc(serviceCategories.displayOrder), asc(services.displayOrder));

      if (rows.length === 0) {
        return [];
      }

      const serviceIds = rows.map((r) => r.service.id);

      // Fetch dynamic child record counts concurrently
      const [
        featureRows,
        highlightRows,
        benefitRows,
        deliverableRows,
        docRows,
        processRows,
        faqRows,
        relatedRows,
      ] = await Promise.all([
        db
          .select({ serviceId: serviceFeatures.serviceId, val: count() })
          .from(serviceFeatures)
          .where(inArray(serviceFeatures.serviceId, serviceIds))
          .groupBy(serviceFeatures.serviceId),
        db
          .select({ serviceId: serviceHighlights.serviceId, val: count() })
          .from(serviceHighlights)
          .where(inArray(serviceHighlights.serviceId, serviceIds))
          .groupBy(serviceHighlights.serviceId),
        db
          .select({ serviceId: serviceBenefits.serviceId, val: count() })
          .from(serviceBenefits)
          .where(inArray(serviceBenefits.serviceId, serviceIds))
          .groupBy(serviceBenefits.serviceId),
        db
          .select({ serviceId: serviceDeliverables.serviceId, val: count() })
          .from(serviceDeliverables)
          .where(inArray(serviceDeliverables.serviceId, serviceIds))
          .groupBy(serviceDeliverables.serviceId),
        db
          .select({ serviceId: serviceDocuments.serviceId, val: count() })
          .from(serviceDocuments)
          .where(inArray(serviceDocuments.serviceId, serviceIds))
          .groupBy(serviceDocuments.serviceId),
        db
          .select({ serviceId: serviceProcessSteps.serviceId, val: count() })
          .from(serviceProcessSteps)
          .where(inArray(serviceProcessSteps.serviceId, serviceIds))
          .groupBy(serviceProcessSteps.serviceId),
        db
          .select({ serviceId: serviceFaqs.serviceId, val: count() })
          .from(serviceFaqs)
          .where(inArray(serviceFaqs.serviceId, serviceIds))
          .groupBy(serviceFaqs.serviceId),
        db
          .select({ serviceId: serviceRelatedServices.serviceId, val: count() })
          .from(serviceRelatedServices)
          .where(inArray(serviceRelatedServices.serviceId, serviceIds))
          .groupBy(serviceRelatedServices.serviceId),
      ]);

      const fMap = new Map(featureRows.map((r) => [r.serviceId, Number(r.val)]));
      const hMap = new Map(highlightRows.map((r) => [r.serviceId, Number(r.val)]));
      const bMap = new Map(benefitRows.map((r) => [r.serviceId, Number(r.val)]));
      const dMap = new Map(deliverableRows.map((r) => [r.serviceId, Number(r.val)]));
      const docMap = new Map(docRows.map((r) => [r.serviceId, Number(r.val)]));
      const pMap = new Map(processRows.map((r) => [r.serviceId, Number(r.val)]));
      const faqMap = new Map(faqRows.map((r) => [r.serviceId, Number(r.val)]));
      const relMap = new Map(relatedRows.map((r) => [r.serviceId, Number(r.val)]));

      return rows.map(({ service: s, category: c }) => ({
        id: s.id,
        slug: s.slug,
        categoryId: s.categoryId,
        title: s.title,
        shortLabel: s.shortLabel,
        shortDesc: s.shortDesc,
        fullDesc: s.fullDesc,
        startingPrice: s.priceDisplayOverride || `₹${Number(s.priceAmount).toLocaleString('en-IN')}`,
        priceAmount: s.priceAmount,
        currency: s.currency,
        pricingType: s.pricingType,
        priceDisplayOverride: s.priceDisplayOverride,
        governmentFeeNote: s.governmentFeeNote,
        timeline: s.timeline,
        popular: s.popular,
        badge: s.badge,
        iconName: s.iconName,
        displayOrder: s.displayOrder,
        isActive: s.isActive,
        headline: s.headline,
        overview: s.overview,
        aliases: s.aliases || [],
        seoTitle: s.seoTitle,
        metaDescription: s.metaDescription,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        updatedBy: s.updatedBy,
        category: c ? { ...c } : null,
        counts: {
          featureCount: fMap.get(s.id) || 0,
          highlightCount: hMap.get(s.id) || 0,
          benefitCount: bMap.get(s.id) || 0,
          deliverableCount: dMap.get(s.id) || 0,
          documentCount: docMap.get(s.id) || 0,
          processStepCount: pMap.get(s.id) || 0,
          faqCount: faqMap.get(s.id) || 0,
          relatedServiceCount: relMap.get(s.id) || 0,
        },
      }));
    } catch (error) {
      logger.error('Error in AdminServiceRepository.getAllAdminServices', 'AdminServiceRepo', error);
      throw error;
    }
  }

  /**
   * Find a service by primary key ID with category, child counts, and full child entity arrays
   */
  async findById(id: string): Promise<AdminServiceItem | null> {
    const isConnected = await pingDatabase();
    if (!isConnected.connected) {
      const s = SERVICES.find((item) => item.id === id);
      if (!s) return null;
      const cat = SERVICE_CATEGORIES.find((c) => c.id === s.category);
      const catIdx = cat ? SERVICE_CATEGORIES.indexOf(cat) : 0;
      const idx = SERVICES.indexOf(s);
      const details = getServiceBySlug(s.slug);
      const now = new Date();
      const p = parseStartingPrice(s.startingPrice);

      const highlights = (details?.landingPage?.benefits || []).map((b, i) => ({
        id: `hl-${i}`,
        title: `Key Highlight ${i + 1}`,
        description: b,
        iconName: 'ShieldCheck',
        displayOrder: i,
      }));

      const processSteps = (details?.landingPage?.process || []).map((step, i) => ({
        id: `proc-${i}`,
        stepNumber: `0${i + 1}`,
        title: step.title,
        description: step.description,
        displayOrder: i,
      }));

      const faqs = (details?.landingPage?.faqs || []).map((faq, i) => ({
        id: `faq-${i}`,
        question: faq.question,
        answer: faq.answer,
        displayOrder: i,
        isActive: true,
      }));

      return {
        id: s.id,
        slug: s.slug,
        categoryId: s.category,
        title: s.title,
        shortLabel: null,
        shortDesc: s.shortDesc,
        fullDesc: s.fullDesc || s.shortDesc,
        startingPrice: s.startingPrice,
        priceAmount: p.amount,
        currency: 'INR',
        pricingType: s.pricingType || 'fixed',
        priceDisplayOverride: s.startingPrice,
        governmentFeeNote: s.governmentFeeNote || null,
        timeline: s.timeline,
        popular: !!s.popular,
        badge: s.badge || null,
        iconName: s.iconName,
        displayOrder: idx,
        isActive: true,
        headline: details?.landingPage?.headline || null,
        overview: details?.landingPage?.overview || null,
        aliases: s.aliases || [],
        seoTitle: `${s.title} | LEGOMARK INDIA`,
        metaDescription: s.shortDesc,
        createdAt: now,
        updatedAt: now,
        updatedBy: 'system',
        category: cat
          ? {
              id: cat.id,
              name: cat.name,
              shortLabel: cat.shortLabel,
              iconName: cat.iconName,
              displayOrder: catIdx,
              isActive: true,
            }
          : null,
        counts: {
          featureCount: s.features?.length || 0,
          highlightCount: highlights.length || 4,
          benefitCount: details?.landingPage?.benefits?.length || 4,
          deliverableCount: details?.landingPage?.deliverables?.length || 4,
          documentCount: details?.landingPage?.documents?.length || 4,
          processStepCount: processSteps.length || 4,
          faqCount: faqs.length || 4,
          relatedServiceCount: 3,
        },
        features: s.features || [],
        highlights,
        benefits: details?.landingPage?.benefits || [],
        deliverables: details?.landingPage?.deliverables || [],
        documents: details?.landingPage?.documents || [],
        processSteps,
        faqs,
        relatedServiceIds: [],
      };
    }

    try {
      const db = getDatabase();
      const rows = await db
        .select({
          service: services,
          category: {
            id: serviceCategories.id,
            name: serviceCategories.name,
            shortLabel: serviceCategories.shortLabel,
            iconName: serviceCategories.iconName,
            displayOrder: serviceCategories.displayOrder,
            isActive: serviceCategories.isActive,
          },
        })
        .from(services)
        .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(eq(services.id, id))
        .limit(1);

      if (rows.length === 0) return null;

      const { service: s, category: c } = rows[0];

      // Fetch dynamic child entity lists and counts for this single service
      const [
        featRows,
        hlRows,
        benRows,
        delivRows,
        docRows,
        procRows,
        faqRows,
        relRows,
        pkgRows,
      ] = await Promise.all([
        db.select().from(serviceFeatures).where(eq(serviceFeatures.serviceId, id)).orderBy(asc(serviceFeatures.displayOrder)),
        db.select().from(serviceHighlights).where(eq(serviceHighlights.serviceId, id)).orderBy(asc(serviceHighlights.displayOrder)),
        db.select().from(serviceBenefits).where(eq(serviceBenefits.serviceId, id)).orderBy(asc(serviceBenefits.displayOrder)),
        db.select().from(serviceDeliverables).where(eq(serviceDeliverables.serviceId, id)).orderBy(asc(serviceDeliverables.displayOrder)),
        db.select().from(serviceDocuments).where(eq(serviceDocuments.serviceId, id)).orderBy(asc(serviceDocuments.displayOrder)),
        db.select().from(serviceProcessSteps).where(eq(serviceProcessSteps.serviceId, id)).orderBy(asc(serviceProcessSteps.displayOrder)),
        db.select().from(serviceFaqs).where(eq(serviceFaqs.serviceId, id)).orderBy(asc(serviceFaqs.displayOrder)),
        db.select().from(serviceRelatedServices).where(eq(serviceRelatedServices.serviceId, id)).orderBy(asc(serviceRelatedServices.displayOrder)),
        db.select().from(servicePackages).where(eq(servicePackages.serviceId, id)).orderBy(asc(servicePackages.displayOrder)),
      ]);

      return {
        id: s.id,
        slug: s.slug,
        categoryId: s.categoryId,
        title: s.title,
        shortLabel: s.shortLabel,
        shortDesc: s.shortDesc,
        fullDesc: s.fullDesc,
        startingPrice: s.priceDisplayOverride || `₹${Number(s.priceAmount).toLocaleString('en-IN')}`,
        priceAmount: s.priceAmount,
        currency: s.currency,
        pricingType: s.pricingType,
        priceDisplayOverride: s.priceDisplayOverride,
        governmentFeeNote: s.governmentFeeNote,
        timeline: s.timeline,
        popular: s.popular,
        badge: s.badge,
        iconName: s.iconName,
        displayOrder: s.displayOrder,
        isActive: s.isActive,
        headline: s.headline,
        overview: s.overview,
        aliases: s.aliases || [],
        seoTitle: s.seoTitle,
        metaDescription: s.metaDescription,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        updatedBy: s.updatedBy,
        category: c ? { ...c } : null,
        counts: {
          featureCount: featRows.length,
          highlightCount: hlRows.length,
          benefitCount: benRows.length,
          deliverableCount: delivRows.length,
          documentCount: docRows.length,
          processStepCount: procRows.length,
          faqCount: faqRows.length,
          relatedServiceCount: relRows.length,
          packageCount: pkgRows.length,
        },
        features: featRows.map((f) => f.featureText),
        highlights: hlRows.map((h) => ({
          id: h.id,
          title: h.title,
          description: h.description,
          iconName: h.iconName,
          displayOrder: h.displayOrder,
        })),
        benefits: benRows.map((b) => b.benefitText),
        deliverables: delivRows.map((d) => d.deliverableText),
        documents: docRows.map((d) => d.documentText),
        processSteps: procRows.map((p) => ({
          id: p.id,
          stepNumber: p.stepNumber,
          title: p.title,
          description: p.description,
          displayOrder: p.displayOrder,
        })),
        faqs: faqRows.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          displayOrder: f.displayOrder,
          isActive: f.isActive,
        })),
        relatedServiceIds: relRows.map((r) => r.relatedServiceId),
        packageIds: pkgRows.map((p) => p.packageId),
        assignedPackages: pkgRows.map((p) => ({
          packageId: p.packageId,
          displayOrder: p.displayOrder,
          isActive: p.isActive,
        })),
      };
    } catch (error) {
      logger.error(`Error in AdminServiceRepository.findById for ${id}`, 'AdminServiceRepo', error);
      throw error;
    }
  }

  /**
   * Find a service by slug to check for uniqueness
   */
  async findBySlug(slug: string): Promise<AdminServiceItem | null> {
    const isConnected = await pingDatabase();
    if (!isConnected.connected) {
      const s = SERVICES.find((item) => item.slug === slug);
      if (!s) return null;
      return this.findById(s.id);
    }

    try {
      const db = getDatabase();
      const rows = await db
        .select({ id: services.id })
        .from(services)
        .where(eq(services.slug, slug))
        .limit(1);

      if (rows.length === 0) return null;
      return this.findById(rows[0].id);
    } catch (error) {
      logger.error(`Error in AdminServiceRepository.findBySlug for ${slug}`, 'AdminServiceRepo', error);
      throw error;
    }
  }

  /**
   * Check if category exists
   */
  async categoryExists(categoryId: string): Promise<boolean> {
    const isConnected = await pingDatabase();
    if (!isConnected.connected) {
      return SERVICE_CATEGORIES.some((c) => c.id === categoryId);
    }

    try {
      const db = getDatabase();
      const rows = await db
        .select({ id: serviceCategories.id })
        .from(serviceCategories)
        .where(eq(serviceCategories.id, categoryId))
        .limit(1);
      return rows.length > 0;
    } catch (error) {
      logger.error(`Error in AdminServiceRepository.categoryExists for ${categoryId}`, 'AdminServiceRepo', error);
      throw error;
    }
  }

  /**
   * Create a new service record in database
   */
  async createService(input: CreateServiceInput, updatedBy?: string): Promise<AdminServiceItem> {
    const db = getDatabase();
    const parsed = parseStartingPrice(input.startingPrice);

    const [inserted] = await db
      .insert(services)
      .values({
        id: input.id,
        categoryId: input.categoryId,
        slug: input.slug,
        title: input.title,
        shortLabel: input.shortLabel || null,
        shortDesc: input.shortDesc,
        fullDesc: input.fullDesc || input.shortDesc,
        priceAmount: input.priceAmount !== undefined ? String(input.priceAmount) : parsed.amount,
        currency: input.currency || 'INR',
        pricingType: input.pricingType || 'fixed',
        priceDisplayOverride: input.priceDisplayOverride !== undefined ? input.priceDisplayOverride : parsed.override,
        governmentFeeNote: input.governmentFeeNote || null,
        timeline: input.timeline,
        popular: input.popular ?? false,
        badge: input.badge || null,
        iconName: input.iconName || 'Building2',
        isActive: input.isActive ?? true,
        displayOrder: input.displayOrder ?? 0,
        headline: input.headline || null,
        overview: input.overview || null,
        aliases: input.aliases || [],
        seoTitle: input.seoTitle || `${input.title} | LEGOMARK INDIA`,
        metaDescription: input.metaDescription || input.shortDesc,
        updatedBy: updatedBy || null,
      })
      .returning();

    // Insert child collections if provided
    if (input.features && input.features.length > 0) {
      await db.insert(serviceFeatures).values(
        input.features.map((f, i) => ({
          serviceId: inserted.id,
          featureText: f,
          displayOrder: i,
        }))
      );
    }

    if (input.highlights && input.highlights.length > 0) {
      await db.insert(serviceHighlights).values(
        input.highlights.map((h, i) => ({
          serviceId: inserted.id,
          title: h.title,
          description: h.description,
          iconName: h.iconName || 'ShieldCheck',
          displayOrder: h.displayOrder !== undefined ? h.displayOrder : i,
        }))
      );
    }

    if (input.benefits && input.benefits.length > 0) {
      await db.insert(serviceBenefits).values(
        input.benefits.map((b, i) => ({
          serviceId: inserted.id,
          benefitText: b,
          displayOrder: i,
        }))
      );
    }

    if (input.deliverables && input.deliverables.length > 0) {
      await db.insert(serviceDeliverables).values(
        input.deliverables.map((d, i) => ({
          serviceId: inserted.id,
          deliverableText: d,
          displayOrder: i,
        }))
      );
    }

    if (input.documents && input.documents.length > 0) {
      await db.insert(serviceDocuments).values(
        input.documents.map((doc, i) => ({
          serviceId: inserted.id,
          documentText: doc,
          displayOrder: i,
        }))
      );
    }

    if (input.processSteps && input.processSteps.length > 0) {
      await db.insert(serviceProcessSteps).values(
        input.processSteps.map((step, i) => ({
          serviceId: inserted.id,
          stepNumber: step.stepNumber || `0${i + 1}`,
          title: step.title,
          description: step.description,
          displayOrder: step.displayOrder !== undefined ? step.displayOrder : i,
        }))
      );
    }

    if (input.faqs && input.faqs.length > 0) {
      await db.insert(serviceFaqs).values(
        input.faqs.map((faq, i) => ({
          serviceId: inserted.id,
          question: faq.question,
          answer: faq.answer,
          displayOrder: faq.displayOrder !== undefined ? faq.displayOrder : i,
          isActive: faq.isActive !== undefined ? faq.isActive : true,
        }))
      );
    }

    if (input.relatedServiceIds && input.relatedServiceIds.length > 0) {
      await db.insert(serviceRelatedServices).values(
        input.relatedServiceIds.map((relId, i) => ({
          serviceId: inserted.id,
          relatedServiceId: relId,
          displayOrder: i,
        }))
      );
    }

    if (input.packageIds && input.packageIds.length > 0) {
      await db.insert(servicePackages).values(
        input.packageIds.map((pkgId, i) => ({
          serviceId: inserted.id,
          packageId: pkgId,
          displayOrder: i,
          isActive: true,
        }))
      );
    }

    const full = await this.findById(inserted.id);
    if (!full) {
      throw new Error(`Failed to retrieve newly created service '${inserted.id}'`);
    }
    return full;
  }

  /**
   * Update service metadata and child entity tables
   */
  async updateService(id: string, input: UpdateServiceInput, updatedBy?: string): Promise<AdminServiceItem | null> {
    const db = getDatabase();
    const parsed = parseStartingPrice(input.startingPrice);

    const [updated] = await db
      .update(services)
      .set({
        categoryId: input.categoryId,
        slug: input.slug,
        title: input.title,
        shortLabel: input.shortLabel !== undefined ? input.shortLabel : undefined,
        shortDesc: input.shortDesc,
        fullDesc: input.fullDesc !== undefined ? input.fullDesc : undefined,
        priceAmount: input.priceAmount !== undefined ? String(input.priceAmount) : parsed.amount,
        currency: input.currency || 'INR',
        pricingType: input.pricingType,
        priceDisplayOverride: input.priceDisplayOverride !== undefined ? input.priceDisplayOverride : parsed.override,
        governmentFeeNote: input.governmentFeeNote !== undefined ? input.governmentFeeNote : undefined,
        timeline: input.timeline,
        popular: input.popular !== undefined ? input.popular : undefined,
        badge: input.badge !== undefined ? input.badge : undefined,
        iconName: input.iconName,
        displayOrder: input.displayOrder !== undefined ? input.displayOrder : undefined,
        isActive: input.isActive !== undefined ? input.isActive : undefined,
        headline: input.headline !== undefined ? input.headline : undefined,
        overview: input.overview !== undefined ? input.overview : undefined,
        aliases: input.aliases !== undefined ? input.aliases : undefined,
        seoTitle: input.seoTitle !== undefined ? input.seoTitle : undefined,
        metaDescription: input.metaDescription !== undefined ? input.metaDescription : undefined,
        updatedAt: new Date(),
        updatedBy: updatedBy || null,
      })
      .where(eq(services.id, id))
      .returning();

    if (!updated) return null;

    // Update child collections if provided
    if (input.features !== undefined) {
      await db.delete(serviceFeatures).where(eq(serviceFeatures.serviceId, id));
      if (input.features.length > 0) {
        await db.insert(serviceFeatures).values(
          input.features.map((f, i) => ({
            serviceId: id,
            featureText: f,
            displayOrder: i,
          }))
        );
      }
    }

    if (input.highlights !== undefined) {
      await db.delete(serviceHighlights).where(eq(serviceHighlights.serviceId, id));
      if (input.highlights.length > 0) {
        await db.insert(serviceHighlights).values(
          input.highlights.map((h, i) => ({
            serviceId: id,
            title: h.title,
            description: h.description,
            iconName: h.iconName || 'ShieldCheck',
            displayOrder: h.displayOrder !== undefined ? h.displayOrder : i,
          }))
        );
      }
    }

    if (input.benefits !== undefined) {
      await db.delete(serviceBenefits).where(eq(serviceBenefits.serviceId, id));
      if (input.benefits.length > 0) {
        await db.insert(serviceBenefits).values(
          input.benefits.map((b, i) => ({
            serviceId: id,
            benefitText: b,
            displayOrder: i,
          }))
        );
      }
    }

    if (input.deliverables !== undefined) {
      await db.delete(serviceDeliverables).where(eq(serviceDeliverables.serviceId, id));
      if (input.deliverables.length > 0) {
        await db.insert(serviceDeliverables).values(
          input.deliverables.map((d, i) => ({
            serviceId: id,
            deliverableText: d,
            displayOrder: i,
          }))
        );
      }
    }

    if (input.documents !== undefined) {
      await db.delete(serviceDocuments).where(eq(serviceDocuments.serviceId, id));
      if (input.documents.length > 0) {
        await db.insert(serviceDocuments).values(
          input.documents.map((doc, i) => ({
            serviceId: id,
            documentText: doc,
            displayOrder: i,
          }))
        );
      }
    }

    if (input.processSteps !== undefined) {
      await db.delete(serviceProcessSteps).where(eq(serviceProcessSteps.serviceId, id));
      if (input.processSteps.length > 0) {
        await db.insert(serviceProcessSteps).values(
          input.processSteps.map((step, i) => ({
            serviceId: id,
            stepNumber: step.stepNumber || `0${i + 1}`,
            title: step.title,
            description: step.description,
            displayOrder: step.displayOrder !== undefined ? step.displayOrder : i,
          }))
        );
      }
    }

    if (input.faqs !== undefined) {
      await db.delete(serviceFaqs).where(eq(serviceFaqs.serviceId, id));
      if (input.faqs.length > 0) {
        await db.insert(serviceFaqs).values(
          input.faqs.map((faq, i) => ({
            serviceId: id,
            question: faq.question,
            answer: faq.answer,
            displayOrder: faq.displayOrder !== undefined ? faq.displayOrder : i,
            isActive: faq.isActive !== undefined ? faq.isActive : true,
          }))
        );
      }
    }

    if (input.relatedServiceIds !== undefined) {
      await db.delete(serviceRelatedServices).where(eq(serviceRelatedServices.serviceId, id));
      if (input.relatedServiceIds.length > 0) {
        await db.insert(serviceRelatedServices).values(
          input.relatedServiceIds.map((relId, i) => ({
            serviceId: id,
            relatedServiceId: relId,
            displayOrder: i,
          }))
        );
      }
    }

    if (input.packageIds !== undefined) {
      await db.delete(servicePackages).where(eq(servicePackages.serviceId, id));
      if (input.packageIds.length > 0) {
        await db.insert(servicePackages).values(
          input.packageIds.map((pkgId, i) => ({
            serviceId: id,
            packageId: pkgId,
            displayOrder: i,
            isActive: true,
          }))
        );
      }
    }

    return await this.findById(id);
  }

  /**
   * Toggle service active status
   */
  async updateStatus(id: string, isActive: boolean, updatedBy?: string): Promise<AdminServiceItem | null> {
    const db = getDatabase();
    const [updated] = await db
      .update(services)
      .set({
        isActive,
        updatedAt: new Date(),
        updatedBy: updatedBy || null,
      })
      .where(eq(services.id, id))
      .returning();

    if (!updated) return null;
    return await this.findById(id);
  }

  /**
   * Reorder services in one atomic transaction
   */
  async reorderServices(items: ReorderServiceItem[], updatedBy?: string): Promise<AdminServiceItem[]> {
    const db = getDatabase();

    await db.transaction(async (tx) => {
      for (const item of items) {
        const updateFields: any = {
          displayOrder: item.displayOrder,
          updatedAt: new Date(),
          updatedBy: updatedBy || null,
        };
        if (item.categoryId) {
          updateFields.categoryId = item.categoryId;
        }

        await tx
          .update(services)
          .set(updateFields)
          .where(eq(services.id, item.id));
      }
    });

    return await this.getAllAdminServices();
  }

  /**
   * Delete service (cascading deletes child records like features, highlights, benefits, faqs etc via schema FK)
   */
  async deleteService(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db
      .delete(services)
      .where(eq(services.id, id))
      .returning({ id: services.id });

    return result.length > 0;
  }
}

export const adminServiceRepository = new AdminServiceRepository();
