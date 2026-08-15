import { pgTable, text, timestamp, varchar, boolean, jsonb, integer, numeric, uuid, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * System and Environment Configuration Audit
 * Used to verify Drizzle ORM mapping and PostgreSQL schema migrations
 */
export const systemMetadata = pgTable('system_metadata', {
  key: varchar('key', { length: 128 }).primaryKey(),
  value: text('value').notNull(),
  details: jsonb('details'),
  isActive: boolean('is_active').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Health Diagnostics Logs (Non-destructive system records)
 */
export const healthDiagnostics = pgTable('health_diagnostics', {
  id: varchar('id', { length: 64 }).primaryKey(),
  status: varchar('status', { length: 32 }).notNull(),
  responseTimeMs: text('response_time_ms').notNull(),
  serverTimestamp: timestamp('server_timestamp', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Packages Table
 * Master catalog of commercial package tiers (Starter, Growth, Retainer, etc.)
 */
export const packages = pgTable('packages', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  tagline: varchar('tagline', { length: 255 }),
  priceAmount: numeric('price_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 8 }).default('INR').notNull(),
  billingType: varchar('billing_type', { length: 32 }).notNull(), // 'one_time', 'monthly', 'yearly', 'custom'
  priceDisplayOverride: varchar('price_display_override', { length: 64 }),
  idealFor: text('ideal_for').notNull(),
  popular: boolean('popular').default(false).notNull(),
  badge: varchar('badge', { length: 64 }),
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 128 }),
});

/**
 * Package Features Table
 * Individual line-item deliverables associated with each package card
 */
export const packageFeatures = pgTable('package_features', {
  id: uuid('id').defaultRandom().primaryKey(),
  packageId: varchar('package_id', { length: 64 })
    .notNull()
    .references(() => packages.id, { onDelete: 'cascade' }),
  featureText: varchar('feature_text', { length: 255 }).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Matrix Rows Table
 * Comparison categories and deliverable rows evaluated in the comparison matrix
 */
export const matrixRows = pgTable('matrix_rows', {
  id: varchar('id', { length: 64 }).primaryKey(),
  category: varchar('category', { length: 128 }).notNull(),
  featureName: varchar('feature_name', { length: 255 }).notNull(),
  tooltip: text('tooltip'),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Matrix Cell Values Table
 * Junction table mapping matrix rows to specific packages
 */
export const matrixCellValues = pgTable(
  'matrix_cell_values',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    matrixRowId: varchar('matrix_row_id', { length: 64 })
      .notNull()
      .references(() => matrixRows.id, { onDelete: 'cascade' }),
    packageId: varchar('package_id', { length: 64 })
      .notNull()
      .references(() => packages.id, { onDelete: 'cascade' }),
    valueType: varchar('value_type', { length: 16 }).default('boolean').notNull(), // 'boolean' | 'text'
    booleanVal: boolean('boolean_val'),
    textVal: varchar('text_val', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('matrix_cell_row_pkg_unique').on(t.matrixRowId, t.packageId),
  ]
);

/**
 * Relations Definitions for Drizzle Relational Queries
 */
export const packagesRelations = relations(packages, ({ many }) => ({
  features: many(packageFeatures),
  matrixCells: many(matrixCellValues),
}));

export const packageFeaturesRelations = relations(packageFeatures, ({ one }) => ({
  package: one(packages, {
    fields: [packageFeatures.packageId],
    references: [packages.id],
  }),
}));

export const matrixRowsRelations = relations(matrixRows, ({ many }) => ({
  cells: many(matrixCellValues),
}));

export const matrixCellValuesRelations = relations(matrixCellValues, ({ one }) => ({
  matrixRow: one(matrixRows, {
    fields: [matrixCellValues.matrixRowId],
    references: [matrixRows.id],
  }),
  package: one(packages, {
    fields: [matrixCellValues.packageId],
    references: [packages.id],
  }),
}));

/**
 * Admin Users Table
 * Master administrative accounts with role-based access control (ADMIN, EDITOR)
 */
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  role: varchar('role', { length: 30 }).$type<'ADMIN' | 'EDITOR'>().default('EDITOR').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  failedAttempts: integer('failed_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Admin Sessions Table
 * Opaque session token storage for secure browser cookie authentication
 */
export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => adminUsers.id, { onDelete: 'cascade' })
    .notNull(),
  sessionTokenHash: varchar('session_token_hash', { length: 64 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(adminUsers, {
    fields: [adminSessions.userId],
    references: [adminUsers.id],
  }),
}));

/**
 * Founder Profile Table
 * Master record for leadership information, biography, and credentials
 */
export const founderProfiles = pgTable('founder_profiles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  designation: varchar('designation', { length: 150 }).notNull(),
  organization: varchar('organization', { length: 150 }).default('LEGOMARK INDIA').notNull(),
  photoUrl: varchar('photo_url', { length: 500 }),
  description: text('description').notNull(),
  quote: text('quote'),
  coreAreas: jsonb('core_areas').$type<string[]>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 128 }),
});

/**
 * Office Profile Table
 * Master record for registered office premises, contact channels, and hours
 */
export const officeProfiles = pgTable('office_profiles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 150 }).default('LEGOMARK INDIA').notNull(),
  premisesPhotoUrl: varchar('premises_photo_url', { length: 500 }),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 20 }).notNull(),
  fullAddress: text('full_address').notNull(),
  mobile: varchar('mobile', { length: 50 }).notNull(),
  mobileRaw: varchar('mobile_raw', { length: 50 }).notNull(),
  landline: varchar('landline', { length: 50 }).notNull(),
  landlineRaw: varchar('landline_raw', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  officeHours: varchar('office_hours', { length: 150 }).notNull(),
  websites: jsonb('websites').$type<string[]>().notNull(),
  primaryWebsite: varchar('primary_website', { length: 255 }).notNull(),
  checklist: jsonb('checklist').$type<string[]>().notNull(),
  mapEmbedUrl: text('map_embed_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar('updated_by', { length: 128 }),
});

// Inferred TypeScript types
export type SystemMetadata = typeof systemMetadata.$inferSelect;
export type NewSystemMetadata = typeof systemMetadata.$inferInsert;

export type HealthDiagnostic = typeof healthDiagnostics.$inferSelect;
export type NewHealthDiagnostic = typeof healthDiagnostics.$inferInsert;

export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;

export type PackageFeature = typeof packageFeatures.$inferSelect;
export type NewPackageFeature = typeof packageFeatures.$inferInsert;

export type MatrixRow = typeof matrixRows.$inferSelect;
export type NewMatrixRow = typeof matrixRows.$inferInsert;

export type MatrixCellValue = typeof matrixCellValues.$inferSelect;
export type NewMatrixCellValue = typeof matrixCellValues.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;

export type FounderProfile = typeof founderProfiles.$inferSelect;
export type NewFounderProfile = typeof founderProfiles.$inferInsert;

export type OfficeProfile = typeof officeProfiles.$inferSelect;
export type NewOfficeProfile = typeof officeProfiles.$inferInsert;

/**
 * ============================================================================
 * STAGE 6B: DYNAMIC SERVICE & SERVICE CATEGORY CMS TABLES
 * ============================================================================
 */

/**
 * Service Categories Table
 * Persistent master catalog for grouping canonical corporate services
 */
export const serviceCategories = pgTable(
  'service_categories',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    name: varchar('name', { length: 128 }).notNull(),
    shortLabel: varchar('short_label', { length: 64 }).notNull(),
    description: text('description'),
    iconName: varchar('icon_name', { length: 64 }).default('Building2').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedBy: varchar('updated_by', { length: 128 }),
  },
  (table) => ({
    displayOrderIdx: index('service_categories_display_order_idx').on(table.displayOrder),
    isActiveIdx: index('service_categories_is_active_idx').on(table.isActive),
  })
);

/**
 * Services Master Table
 * Complete core data model for canonical and administrative services
 */
export const services = pgTable(
  'services',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    categoryId: varchar('category_id', { length: 64 })
      .references(() => serviceCategories.id, { onDelete: 'restrict' })
      .notNull(),
    slug: varchar('slug', { length: 128 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    shortLabel: varchar('short_label', { length: 128 }),
    shortDesc: text('short_desc').notNull(),
    fullDesc: text('full_desc').notNull(),
    priceAmount: numeric('price_amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 8 }).default('INR').notNull(),
    pricingType: varchar('pricing_type', { length: 32 }).default('fixed').notNull(), // 'fixed', 'recurring', 'custom'
    priceDisplayOverride: varchar('price_display_override', { length: 64 }), // e.g. '₹6,999'
    governmentFeeNote: varchar('government_fee_note', { length: 255 }),
    timeline: varchar('timeline', { length: 128 }).notNull(),
    popular: boolean('popular').default(false).notNull(),
    badge: varchar('badge', { length: 64 }),
    iconName: varchar('icon_name', { length: 64 }).default('Building2').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    headline: varchar('headline', { length: 255 }),
    overview: text('overview'),
    aliases: jsonb('aliases').$type<string[]>().default([]).notNull(),
    seoTitle: varchar('seo_title', { length: 255 }),
    metaDescription: text('meta_description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedBy: varchar('updated_by', { length: 128 }),
  },
  (table) => ({
    slugIdx: index('services_slug_idx').on(table.slug),
    categoryIdx: index('services_category_id_idx').on(table.categoryId),
    displayOrderIdx: index('services_display_order_idx').on(table.displayOrder),
    isActiveIdx: index('services_is_active_idx').on(table.isActive),
  })
);

/**
 * Service Features Table (Summary card bullet points / Quick inclusions)
 */
export const serviceFeatures = pgTable(
  'service_features',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serviceId: varchar('service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    featureText: varchar('feature_text', { length: 255 }).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
  },
  (table) => ({
    serviceFeatureIdx: index('service_features_service_id_idx').on(table.serviceId),
  })
);

/**
 * Service Highlights Table (Structured key value / badge cards on landing pages)
 */
export const serviceHighlights = pgTable(
  'service_highlights',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serviceId: varchar('service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 150 }).notNull(),
    description: text('description').notNull(),
    iconName: varchar('icon_name', { length: 64 }).default('ShieldCheck').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => ({
    serviceHighlightIdx: index('service_highlights_service_id_idx').on(table.serviceId),
  })
);

/**
 * Service Strategic Benefits Table
 */
export const serviceBenefits = pgTable(
  'service_benefits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serviceId: varchar('service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    benefitText: text('benefit_text').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
  },
  (table) => ({
    serviceBenefitIdx: index('service_benefits_service_id_idx').on(table.serviceId),
  })
);

/**
 * Service Comprehensive Deliverables Table
 */
export const serviceDeliverables = pgTable(
  'service_deliverables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serviceId: varchar('service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    deliverableText: text('deliverable_text').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
  },
  (table) => ({
    serviceDeliverableIdx: index('service_deliverables_service_id_idx').on(table.serviceId),
  })
);

/**
 * Service Required Documents Checklist Table
 */
export const serviceDocuments = pgTable(
  'service_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serviceId: varchar('service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    documentText: varchar('document_text', { length: 255 }).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
  },
  (table) => ({
    serviceDocumentIdx: index('service_documents_service_id_idx').on(table.serviceId),
  })
);

/**
 * Service Process / Roadmap Steps Table
 */
export const serviceProcessSteps = pgTable(
  'service_process_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serviceId: varchar('service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    stepNumber: varchar('step_number', { length: 16 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
  },
  (table) => ({
    serviceProcessIdx: index('service_process_steps_service_id_idx').on(table.serviceId),
  })
);

/**
 * Service Frequently Asked Questions Table
 */
export const serviceFaqs = pgTable(
  'service_faqs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serviceId: varchar('service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => ({
    serviceFaqIdx: index('service_faqs_service_id_idx').on(table.serviceId),
  })
);

/**
 * Service Related Services Relationship Table
 */
export const serviceRelatedServices = pgTable(
  'service_related_services',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    serviceId: varchar('service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    relatedServiceId: varchar('related_service_id', { length: 64 })
      .references(() => services.id, { onDelete: 'cascade' })
      .notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
  },
  (table) => ({
    serviceRelatedUnique: unique('service_related_services_unique').on(
      table.serviceId,
      table.relatedServiceId
    ),
    serviceRelatedIdx: index('service_related_services_service_id_idx').on(table.serviceId),
  })
);

/**
 * Drizzle Relations Mapping
 */
export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  features: many(serviceFeatures),
  highlights: many(serviceHighlights),
  benefits: many(serviceBenefits),
  deliverables: many(serviceDeliverables),
  documents: many(serviceDocuments),
  processSteps: many(serviceProcessSteps),
  faqs: many(serviceFaqs),
  relatedServices: many(serviceRelatedServices, { relationName: 'serviceToRelated' }),
}));

export const serviceFeaturesRelations = relations(serviceFeatures, ({ one }) => ({
  service: one(services, {
    fields: [serviceFeatures.serviceId],
    references: [services.id],
  }),
}));

export const serviceHighlightsRelations = relations(serviceHighlights, ({ one }) => ({
  service: one(services, {
    fields: [serviceHighlights.serviceId],
    references: [services.id],
  }),
}));

export const serviceBenefitsRelations = relations(serviceBenefits, ({ one }) => ({
  service: one(services, {
    fields: [serviceBenefits.serviceId],
    references: [services.id],
  }),
}));

export const serviceDeliverablesRelations = relations(serviceDeliverables, ({ one }) => ({
  service: one(services, {
    fields: [serviceDeliverables.serviceId],
    references: [services.id],
  }),
}));

export const serviceDocumentsRelations = relations(serviceDocuments, ({ one }) => ({
  service: one(services, {
    fields: [serviceDocuments.serviceId],
    references: [services.id],
  }),
}));

export const serviceProcessStepsRelations = relations(serviceProcessSteps, ({ one }) => ({
  service: one(services, {
    fields: [serviceProcessSteps.serviceId],
    references: [services.id],
  }),
}));

export const serviceFaqsRelations = relations(serviceFaqs, ({ one }) => ({
  service: one(services, {
    fields: [serviceFaqs.serviceId],
    references: [services.id],
  }),
}));

export const serviceRelatedServicesRelations = relations(serviceRelatedServices, ({ one }) => ({
  service: one(services, {
    fields: [serviceRelatedServices.serviceId],
    references: [services.id],
    relationName: 'serviceToRelated',
  }),
  relatedService: one(services, {
    fields: [serviceRelatedServices.relatedServiceId],
    references: [services.id],
    relationName: 'relatedToService',
  }),
}));

// Inferred TypeScript types for Services CMS
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type NewServiceCategory = typeof serviceCategories.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type ServiceFeature = typeof serviceFeatures.$inferSelect;
export type NewServiceFeature = typeof serviceFeatures.$inferInsert;

export type ServiceHighlight = typeof serviceHighlights.$inferSelect;
export type NewServiceHighlight = typeof serviceHighlights.$inferInsert;

export type ServiceBenefit = typeof serviceBenefits.$inferSelect;
export type NewServiceBenefit = typeof serviceBenefits.$inferInsert;

export type ServiceDeliverable = typeof serviceDeliverables.$inferSelect;
export type NewServiceDeliverable = typeof serviceDeliverables.$inferInsert;

export type ServiceDocument = typeof serviceDocuments.$inferSelect;
export type NewServiceDocument = typeof serviceDocuments.$inferInsert;

export type ServiceProcessStep = typeof serviceProcessSteps.$inferSelect;
export type NewServiceProcessStep = typeof serviceProcessSteps.$inferInsert;

export type ServiceFaq = typeof serviceFaqs.$inferSelect;
export type NewServiceFaq = typeof serviceFaqs.$inferInsert;

export type ServiceRelatedService = typeof serviceRelatedServices.$inferSelect;
export type NewServiceRelatedService = typeof serviceRelatedServices.$inferInsert;


