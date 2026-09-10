import { pgTable, timestamp, varchar, date, uuid, unique, index } from 'drizzle-orm/pg-core';

/**
 * Website Page Views Table
 * Captures anonymous, privacy-safe page view records for LEGOMARK public routes.
 * Strictly excludes PII (no IP address, no fingerprint, no user credentials).
 */
export const websitePageViews = pgTable(
  'website_page_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(), // 'YYYY-MM-DD'
    path: varchar('path', { length: 255 }).notNull(),
    visitorHash: varchar('visitor_hash', { length: 64 }).notNull(), // SHA-256 daily salted hash
    referrer: varchar('referrer', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: index('website_page_views_date_idx').on(table.date),
    pathIdx: index('website_page_views_path_idx').on(table.path),
    visitorDateIdx: index('website_page_views_visitor_date_idx').on(table.visitorHash, table.date),
  })
);

export type WebsitePageView = typeof websitePageViews.$inferSelect;
export type NewWebsitePageView = typeof websitePageViews.$inferInsert;

/**
 * Website Daily Unique Visitors Table
 * Records daily unique visitor hashes to ensure fast O(1) deduplication and instant metrics.
 */
export const websiteDailyUniqueVisitors = pgTable(
  'website_daily_unique_visitors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(), // 'YYYY-MM-DD'
    visitorHash: varchar('visitor_hash', { length: 64 }).notNull(),
    firstVisitAt: timestamp('first_visit_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueDailyVisitor: unique('website_daily_uniq_visitor').on(table.date, table.visitorHash),
    dateIdx: index('website_daily_visitors_date_idx').on(table.date),
  })
);

export type WebsiteDailyUniqueVisitor = typeof websiteDailyUniqueVisitors.$inferSelect;
export type NewWebsiteDailyUniqueVisitor = typeof websiteDailyUniqueVisitors.$inferInsert;
