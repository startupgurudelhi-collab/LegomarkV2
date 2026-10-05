import { pgTable, timestamp, varchar, uuid, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * COMPANY NAME SEARCH & AVAILABILITY SCHEMA
 * ============================================================================
 * Stores public name search queries, MCA Rule 8 compliance checks, and
 * preliminary availability scores for audit, analytics, and lead qualification.
 */
export const companyNameSearches = pgTable('company_name_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  searchQuery: varchar('search_query', { length: 255 }).notNull(),
  proposedName: varchar('proposed_name', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 64 }).notNull().default('private_limited'),
  isAvailable: boolean('is_available').notNull().default(true),
  availabilityScore: integer('availability_score').notNull().default(0),
  ruleChecks: jsonb('rule_checks'),
  similarNamesFound: jsonb('similar_names_found'),
  ipAddress: varchar('ip_address', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CompanyNameSearch = typeof companyNameSearches.$inferSelect;
export type NewCompanyNameSearch = typeof companyNameSearches.$inferInsert;
