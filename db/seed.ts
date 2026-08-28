import { getDatabase, closeDatabasePool, verifyDatabaseConnection } from '../server/config/database';
import {
  packages,
  packageFeatures,
  matrixRows,
  matrixCellValues,
  founderProfiles,
  officeProfiles,
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
} from './schema/index';
import { PACKAGES, PACKAGE_MATRIX, COMPANY_PROFILE, SERVICE_CATEGORIES, SERVICES, getRelatedServices } from '../src/data/websiteData';
import { logger } from '../server/utils/logger';
import { eq, sql } from 'drizzle-orm';

/**
 * Helper to convert slug from feature name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Helper to parse price string to numeric amount and override string
 */
function parsePrice(startingPrice: string): { amount: string; override: string | null; pricingType: string } {
  const rawNumeric = startingPrice.replace(/[^\d.]/g, '');
  const amount = rawNumeric.length > 0 ? parseFloat(rawNumeric).toFixed(2) : '0.00';
  const isCustom = startingPrice.toLowerCase().includes('custom') || startingPrice.toLowerCase().includes('request');
  const isRecurring = startingPrice.includes('/ mo') || startingPrice.includes('/ yr') || startingPrice.includes('recurring');
  
  return {
    amount,
    override: isCustom ? startingPrice : null,
    pricingType: isCustom ? 'custom' : isRecurring ? 'recurring' : 'fixed',
  };
}

/**
 * Idempotent Seed Function for Package & Service CMS
 */
export async function seedPackagesDatabase() {
  logger.info('Starting idempotent Package & Service CMS database seed...', 'Seed');

  const isConnected = await verifyDatabaseConnection();
  if (!isConnected) {
    logger.warn('Database connection not available at this moment. Seed script requires active PostgreSQL connection.', 'Seed');
    return {
      success: false,
      error: 'Database connection failed',
      stats: {
        packages: 0,
        packageFeatures: 0,
        matrixRows: 0,
        matrixCellValues: 0,
        founderProfiles: 0,
        officeProfiles: 0,
        serviceCategories: 0,
        services: 0,
        serviceFeatures: 0,
        serviceHighlights: 0,
        serviceBenefits: 0,
        serviceDeliverables: 0,
        serviceDocuments: 0,
        serviceProcessSteps: 0,
        serviceFaqs: 0,
        serviceRelatedServices: 0,
      },
    };
  }

  const db = getDatabase();

  try {
    // 1. Seed Packages
    logger.info(`Checking & seeding ${PACKAGES.length} canonical packages...`, 'Seed');
    for (let i = 0; i < PACKAGES.length; i++) {
      const pkg = PACKAGES[i];
      const rawNumeric = pkg.price.replace(/[^\d.]/g, '');
      const priceAmount = rawNumeric.length > 0 ? parseFloat(rawNumeric).toFixed(2) : '0.00';
      const billingType = pkg.period?.includes('year') ? 'yearly' : pkg.period?.includes('mo') ? 'monthly' : 'one_time';

      await db
        .insert(packages)
        .values({
          id: pkg.id,
          name: pkg.name,
          tagline: pkg.tagline || null,
          priceAmount: priceAmount,
          currency: 'INR',
          billingType: billingType,
          priceDisplayOverride: null,
          idealFor: pkg.idealFor,
          popular: !!pkg.popular,
          badge: pkg.badge || null,
          isActive: true,
          displayOrder: i,
        })
        .onConflictDoUpdate({
          target: packages.id,
          set: {
            name: sql`excluded.name`,
            tagline: sql`excluded.tagline`,
            priceAmount: sql`excluded.price_amount`,
            currency: sql`excluded.currency`,
            billingType: sql`excluded.billing_type`,
            idealFor: sql`excluded.ideal_for`,
            popular: sql`excluded.popular`,
            badge: sql`excluded.badge`,
            isActive: sql`excluded.is_active`,
            displayOrder: sql`excluded.display_order`,
            updatedAt: new Date(),
          },
        });

      // Idempotently reset package features
      await db.delete(packageFeatures).where(eq(packageFeatures.packageId, pkg.id));
      if (pkg.features && pkg.features.length > 0) {
        const featureInserts = pkg.features.map((featureText, featIdx) => ({
          packageId: pkg.id,
          featureText,
          displayOrder: featIdx,
        }));
        await db.insert(packageFeatures).values(featureInserts);
      }
    }

    // 2. Seed Matrix Rows & Matrix Cell Values
    logger.info(`Checking & seeding ${PACKAGE_MATRIX.length} matrix rows and cell values...`, 'Seed');
    for (let rIdx = 0; rIdx < PACKAGE_MATRIX.length; rIdx++) {
      const row = PACKAGE_MATRIX[rIdx];
      const rowId = slugify(row.featureName) || `row-${rIdx + 1}`;

      await db
        .insert(matrixRows)
        .values({
          id: rowId,
          category: row.category,
          featureName: row.featureName,
          tooltip: null,
          displayOrder: rIdx,
        })
        .onConflictDoUpdate({
          target: matrixRows.id,
          set: {
            category: sql`excluded.category`,
            featureName: sql`excluded.feature_name`,
            displayOrder: sql`excluded.display_order`,
          },
        });

      const packageMappings: Array<{ pkgId: string; val: boolean | string }> = [
        { pkgId: 'starter', val: row.starter },
        { pkgId: 'growth', val: row.growth },
        { pkgId: 'enterprise', val: row.enterprise },
      ];

      for (const mapping of packageMappings) {
        const isBool = typeof mapping.val === 'boolean';
        await db
          .insert(matrixCellValues)
          .values({
            matrixRowId: rowId,
            packageId: mapping.pkgId,
            valueType: isBool ? 'boolean' : 'text',
            booleanVal: isBool ? (mapping.val as boolean) : null,
            textVal: isBool ? null : (mapping.val as string),
          })
          .onConflictDoUpdate({
            target: [matrixCellValues.matrixRowId, matrixCellValues.packageId],
            set: {
              valueType: sql`excluded.value_type`,
              booleanVal: sql`excluded.boolean_val`,
              textVal: sql`excluded.text_val`,
            },
          });
      }
    }

    // 3. Seed Founder Profile
    logger.info('Checking & seeding canonical Founder Profile...', 'Seed');
    await db
      .insert(founderProfiles)
      .values({
        id: 'primary',
        name: COMPANY_PROFILE.founder.name,
        designation: COMPANY_PROFILE.founder.designation,
        organization: COMPANY_PROFILE.founder.organization,
        photoUrl: null,
        description: COMPANY_PROFILE.founder.description,
        quote: null,
        coreAreas: COMPANY_PROFILE.founder.coreAreas,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: founderProfiles.id,
        set: {
          name: sql`excluded.name`,
          designation: sql`excluded.designation`,
          organization: sql`excluded.organization`,
          description: sql`excluded.description`,
          coreAreas: sql`excluded.core_areas`,
          isActive: sql`excluded.is_active`,
          updatedAt: new Date(),
        },
      });

    // 4. Seed Office Profile
    logger.info('Checking & seeding canonical Office Profile...', 'Seed');
    await db
      .insert(officeProfiles)
      .values({
        id: 'primary',
        name: COMPANY_PROFILE.name,
        premisesPhotoUrl: null,
        addressLine1: COMPANY_PROFILE.address.line1,
        addressLine2: COMPANY_PROFILE.address.line2,
        city: COMPANY_PROFILE.address.city,
        pincode: COMPANY_PROFILE.address.pincode,
        fullAddress: COMPANY_PROFILE.address.fullAddress,
        mobile: COMPANY_PROFILE.contact.mobile,
        mobileRaw: COMPANY_PROFILE.contact.mobileRaw,
        landline: COMPANY_PROFILE.contact.landline,
        landlineRaw: COMPANY_PROFILE.contact.landlineRaw,
        email: COMPANY_PROFILE.contact.email,
        officeHours: COMPANY_PROFILE.contact.officeHours,
        websites: COMPANY_PROFILE.contact.websites,
        primaryWebsite: COMPANY_PROFILE.contact.primaryWebsite,
        checklist: [
          'Registered office and corporate advisory services in New Delhi',
          'Consultation desk for business incorporation and compliance',
          'Full-service secretarial, taxation and trademark assistance',
          'Digital document processing and nationwide client coordination',
        ],
        mapEmbedUrl: null,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: officeProfiles.id,
        set: {
          name: sql`excluded.name`,
          addressLine1: sql`excluded.address_line1`,
          addressLine2: sql`excluded.address_line2`,
          city: sql`excluded.city`,
          pincode: sql`excluded.pincode`,
          fullAddress: sql`excluded.full_address`,
          mobile: sql`excluded.mobile`,
          mobileRaw: sql`excluded.mobile_raw`,
          landline: sql`excluded.landline`,
          landlineRaw: sql`excluded.landline_raw`,
          email: sql`excluded.email`,
          officeHours: sql`excluded.office_hours`,
          websites: sql`excluded.websites`,
          primaryWebsite: sql`excluded.primary_website`,
          checklist: sql`excluded.checklist`,
          isActive: sql`excluded.is_active`,
          updatedAt: new Date(),
        },
      });

    // ==================================================
    // 5. Seed Service Categories (Stage 6B)
    // ==================================================
    logger.info(`Checking & seeding ${SERVICE_CATEGORIES.length} service categories...`, 'Seed');
    for (let cIdx = 0; cIdx < SERVICE_CATEGORIES.length; cIdx++) {
      const cat = SERVICE_CATEGORIES[cIdx];
      await db
        .insert(serviceCategories)
        .values({
          id: cat.id,
          name: cat.name,
          shortLabel: cat.shortLabel,
          description: cat.description || null,
          iconName: cat.iconName || 'Building2',
          displayOrder: cIdx,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: serviceCategories.id,
          set: {
            name: sql`excluded.name`,
            shortLabel: sql`excluded.short_label`,
            description: sql`excluded.description`,
            iconName: sql`excluded.icon_name`,
            displayOrder: sql`excluded.display_order`,
            isActive: sql`excluded.is_active`,
            updatedAt: new Date(),
          },
        });
    }

    // ==================================================
    // 6. Seed 16 Canonical Services & Child Records (Stage 6B)
    // ==================================================
    logger.info(`Checking & seeding ${SERVICES.length} canonical services and child records...`, 'Seed');
    for (let sIdx = 0; sIdx < SERVICES.length; sIdx++) {
      const s = SERVICES[sIdx];
      const priceMeta = parsePrice(s.startingPrice);
      const landing = s.landingPage;

      await db
        .insert(services)
        .values({
          id: s.id,
          categoryId: s.category,
          slug: s.slug,
          title: s.title,
          shortLabel: null,
          shortDesc: s.shortDesc,
          fullDesc: s.fullDesc,
          priceAmount: priceMeta.amount,
          currency: 'INR',
          pricingType: s.pricingType || priceMeta.pricingType,
          priceDisplayOverride: priceMeta.override || s.startingPrice,
          governmentFeeNote: s.governmentFeeNote || null,
          timeline: s.timeline,
          popular: !!s.popular,
          badge: s.badge || null,
          iconName: s.iconName || 'Building2',
          isActive: true,
          displayOrder: sIdx,
          headline: landing?.headline || s.title,
          overview: landing?.overview || s.fullDesc,
          aliases: s.aliases || [],
          seoTitle: `${s.title} | Corporate Legal & Tax Advisory | LEGOMARK INDIA`,
          metaDescription: s.shortDesc,
        })
        .onConflictDoUpdate({
          target: services.id,
          set: {
            categoryId: sql`excluded.category_id`,
            slug: sql`excluded.slug`,
            title: sql`excluded.title`,
            shortLabel: sql`excluded.short_label`,
            shortDesc: sql`excluded.short_desc`,
            fullDesc: sql`excluded.full_desc`,
            priceAmount: sql`excluded.price_amount`,
            currency: sql`excluded.currency`,
            pricingType: sql`excluded.pricing_type`,
            priceDisplayOverride: sql`excluded.price_display_override`,
            governmentFeeNote: sql`excluded.government_fee_note`,
            timeline: sql`excluded.timeline`,
            popular: sql`excluded.popular`,
            badge: sql`excluded.badge`,
            iconName: sql`excluded.icon_name`,
            isActive: sql`excluded.is_active`,
            displayOrder: sql`excluded.display_order`,
            headline: sql`excluded.headline`,
            overview: sql`excluded.overview`,
            aliases: sql`excluded.aliases`,
            seoTitle: sql`excluded.seo_title`,
            metaDescription: sql`excluded.meta_description`,
            updatedAt: new Date(),
          },
        });

      // 6a. Features (Summary Card Deliverables)
      await db.delete(serviceFeatures).where(eq(serviceFeatures.serviceId, s.id));
      if (s.features && s.features.length > 0) {
        const featureInserts = s.features.map((featureText, featIdx) => ({
          serviceId: s.id,
          featureText,
          displayOrder: featIdx,
        }));
        await db.insert(serviceFeatures).values(featureInserts);
      }

      // 6b. Highlights (Key Value Badges on Landing Pages)
      await db.delete(serviceHighlights).where(eq(serviceHighlights.serviceId, s.id));
      const defaultHighlights = [
        {
          serviceId: s.id,
          title: 'CA / CS & Legal Verification',
          description: 'Processed by practicing corporate professionals',
          iconName: 'ShieldCheck',
          displayOrder: 0,
          isActive: true,
        },
        {
          serviceId: s.id,
          title: 'Official Portal Processing',
          description: 'Direct MCA / GST / IP India portal filings',
          iconName: 'FileCheck2',
          displayOrder: 1,
          isActive: true,
        },
      ];
      await db.insert(serviceHighlights).values(defaultHighlights);

      // 6c. Benefits
      await db.delete(serviceBenefits).where(eq(serviceBenefits.serviceId, s.id));
      if (landing?.benefits && landing.benefits.length > 0) {
        const benefitInserts = landing.benefits.map((benefitText, bIdx) => ({
          serviceId: s.id,
          benefitText,
          displayOrder: bIdx,
        }));
        await db.insert(serviceBenefits).values(benefitInserts);
      }

      // 6d. Deliverables
      await db.delete(serviceDeliverables).where(eq(serviceDeliverables.serviceId, s.id));
      if (landing?.deliverables && landing.deliverables.length > 0) {
        const delivInserts = landing.deliverables.map((deliverableText, dIdx) => ({
          serviceId: s.id,
          deliverableText,
          displayOrder: dIdx,
        }));
        await db.insert(serviceDeliverables).values(delivInserts);
      }

      // 6e. Required Documents
      await db.delete(serviceDocuments).where(eq(serviceDocuments.serviceId, s.id));
      if (landing?.documents && landing.documents.length > 0) {
        const docInserts = landing.documents.map((documentText, docIdx) => ({
          serviceId: s.id,
          documentText,
          displayOrder: docIdx,
        }));
        await db.insert(serviceDocuments).values(docInserts);
      }

      // 6f. Process Steps
      await db.delete(serviceProcessSteps).where(eq(serviceProcessSteps.serviceId, s.id));
      if (landing?.process && landing.process.length > 0) {
        const stepInserts = landing.process.map((step, stepIdx) => ({
          serviceId: s.id,
          stepNumber: step.step,
          title: step.title,
          description: step.description,
          displayOrder: stepIdx,
        }));
        await db.insert(serviceProcessSteps).values(stepInserts);
      }

      // 6g. FAQs
      await db.delete(serviceFaqs).where(eq(serviceFaqs.serviceId, s.id));
      if (landing?.faqs && landing.faqs.length > 0) {
        const faqInserts = landing.faqs.map((faq, faqIdx) => ({
          serviceId: s.id,
          question: faq.question,
          answer: faq.answer,
          displayOrder: faqIdx,
          isActive: true,
        }));
        await db.insert(serviceFaqs).values(faqInserts);
      }
    }

    // 7. Seed Service Related Services (after all services exist)
    logger.info('Checking & seeding related service relationships...', 'Seed');
    for (const s of SERVICES) {
      await db.delete(serviceRelatedServices).where(eq(serviceRelatedServices.serviceId, s.id));
      const related = getRelatedServices(s);
      if (related && related.length > 0) {
        const relInserts = related.map((relItem, relIdx) => ({
          serviceId: s.id,
          relatedServiceId: relItem.id,
          displayOrder: relIdx,
        }));
        await db.insert(serviceRelatedServices).values(relInserts);
      }
    }

    // 8. Seed Initial Sensible Service Packages (Idempotent: Only for services that have 0 associations)
    logger.info('Checking & seeding initial service package associations...', 'Seed');
    const INITIAL_SERVICE_PACKAGE_MAP: Record<string, string[]> = {
      'pvt-ltd': ['starter', 'growth', 'enterprise'],
      'private-limited-company': ['starter', 'growth', 'enterprise'],
      'llp-registration': ['starter', 'growth'],
      'partnership-registration': ['starter', 'growth'],
      'section-8-ngo': ['starter', 'growth'],
      'trademark-registration': ['starter', 'growth'],
      'trademark-objection': ['starter', 'growth'],
      'trademark-hearing': ['starter', 'growth'],
      'trademark-renewal': ['starter', 'growth'],
      'gst-registration': ['starter', 'growth'],
      'gst-return-filing': ['starter', 'growth'],
      'income-tax-return': ['starter', 'growth'],
      'tds-return-filing': ['starter', 'growth'],
      'roc-annual-compliance': ['growth', 'enterprise'],
      'director-kyc': ['growth', 'enterprise'],
      'fssai-registration': ['starter', 'growth'],
      'msme-udyam-registration': ['starter', 'growth'],
    };

    for (const s of SERVICES) {
      const targetPkgIds = INITIAL_SERVICE_PACKAGE_MAP[s.id];
      if (targetPkgIds && targetPkgIds.length > 0) {
        const existing = await db
          .select({ count: sql<number>`count(*)` })
          .from(servicePackages)
          .where(eq(servicePackages.serviceId, s.id));

        if (Number(existing[0]?.count || 0) === 0) {
          const pkgInserts = targetPkgIds.map((pkgId, idx) => ({
            serviceId: s.id,
            packageId: pkgId,
            displayOrder: idx,
            isActive: true,
          }));
          await db.insert(servicePackages).values(pkgInserts);
        }
      }
    }

    // 9. Verification & Statistics Query
    const totalPackages = await db.select({ count: sql<number>`count(*)` }).from(packages);
    const totalFeatures = await db.select({ count: sql<number>`count(*)` }).from(packageFeatures);
    const totalMatrixRows = await db.select({ count: sql<number>`count(*)` }).from(matrixRows);
    const totalMatrixCells = await db.select({ count: sql<number>`count(*)` }).from(matrixCellValues);
    const totalFounders = await db.select({ count: sql<number>`count(*)` }).from(founderProfiles);
    const totalOffices = await db.select({ count: sql<number>`count(*)` }).from(officeProfiles);
    const totalCategories = await db.select({ count: sql<number>`count(*)` }).from(serviceCategories);
    const totalServices = await db.select({ count: sql<number>`count(*)` }).from(services);
    const totalServiceFeatures = await db.select({ count: sql<number>`count(*)` }).from(serviceFeatures);
    const totalServiceHighlights = await db.select({ count: sql<number>`count(*)` }).from(serviceHighlights);
    const totalServiceBenefits = await db.select({ count: sql<number>`count(*)` }).from(serviceBenefits);
    const totalServiceDeliverables = await db.select({ count: sql<number>`count(*)` }).from(serviceDeliverables);
    const totalServiceDocs = await db.select({ count: sql<number>`count(*)` }).from(serviceDocuments);
    const totalServiceSteps = await db.select({ count: sql<number>`count(*)` }).from(serviceProcessSteps);
    const totalServiceFaqs = await db.select({ count: sql<number>`count(*)` }).from(serviceFaqs);
    const totalServiceRelated = await db.select({ count: sql<number>`count(*)` }).from(serviceRelatedServices);
    const totalServicePkgs = await db.select({ count: sql<number>`count(*)` }).from(servicePackages);

    const stats = {
      packages: Number(totalPackages[0]?.count || 0),
      packageFeatures: Number(totalFeatures[0]?.count || 0),
      matrixRows: Number(totalMatrixRows[0]?.count || 0),
      matrixCellValues: Number(totalMatrixCells[0]?.count || 0),
      founderProfiles: Number(totalFounders[0]?.count || 0),
      officeProfiles: Number(totalOffices[0]?.count || 0),
      serviceCategories: Number(totalCategories[0]?.count || 0),
      services: Number(totalServices[0]?.count || 0),
      serviceFeatures: Number(totalServiceFeatures[0]?.count || 0),
      serviceHighlights: Number(totalServiceHighlights[0]?.count || 0),
      serviceBenefits: Number(totalServiceBenefits[0]?.count || 0),
      serviceDeliverables: Number(totalServiceDeliverables[0]?.count || 0),
      serviceDocuments: Number(totalServiceDocs[0]?.count || 0),
      serviceProcessSteps: Number(totalServiceSteps[0]?.count || 0),
      serviceFaqs: Number(totalServiceFaqs[0]?.count || 0),
      serviceRelatedServices: Number(totalServiceRelated[0]?.count || 0),
      servicePackages: Number(totalServicePkgs[0]?.count || 0),
    };

    logger.info('CMS database seed completed successfully with complete Service CMS.', 'Seed', stats);
    return { success: true, stats };
  } catch (error) {
    logger.error('Failed to seed CMS database', 'Seed', error);
    return {
      success: false,
      error: String(error),
      stats: {
        packages: 0,
        packageFeatures: 0,
        matrixRows: 0,
        matrixCellValues: 0,
        founderProfiles: 0,
        officeProfiles: 0,
        serviceCategories: 0,
        services: 0,
        serviceFeatures: 0,
        serviceHighlights: 0,
        serviceBenefits: 0,
        serviceDeliverables: 0,
        serviceDocuments: 0,
        serviceProcessSteps: 0,
        serviceFaqs: 0,
        serviceRelatedServices: 0,
      },
    };
  }
}

// Standalone execution entrypoint
if (process.argv[1]?.includes('seed')) {
  seedPackagesDatabase().then(() => {
    closeDatabasePool().then(() => process.exit(0));
  });
}

