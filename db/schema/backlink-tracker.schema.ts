import { pgTable, timestamp, varchar, uuid, index, boolean, integer, text } from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * LACS MODULE #22: BACKLINK TRACKING SCHEMA
 * ============================================================================
 * Stores and monitors external inbound backlinks pointing to Legomark pages,
 * tracking verification state, anchor texts, link attributes (dofollow/nofollow),
 * live crawl status, and upstream connection to LACS #21 backlink opportunities.
 */
export const trackedBacklinks = pgTable(
  'tracked_backlinks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceUrl: varchar('source_url', { length: 512 }).notNull(),
    sourceDomain: varchar('source_domain', { length: 255 }).notNull(),
    targetUrl: varchar('target_url', { length: 255 }).notNull(),
    anchorText: varchar('anchor_text', { length: 255 }),
    linkType: varchar('link_type', { length: 32 }).default('dofollow').notNull(), // 'dofollow' | 'nofollow' | 'ugc' | 'sponsored'
    status: varchar('status', { length: 32 }).default('active').notNull(), // 'active' | 'lost' | 'pending' | 'broken'
    httpStatus: integer('http_status'),
    isVerified: boolean('is_verified').default(false).notNull(),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    outreachType: varchar('outreach_type', { length: 64 }), // optional link to LACS #21 BacklinkOutreachType
    opportunityId: varchar('opportunity_id', { length: 64 }), // optional link to LACS #21 candidate ID
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    targetUrlIdx: index('tracked_backlinks_target_url_idx').on(table.targetUrl),
    sourceDomainIdx: index('tracked_backlinks_source_domain_idx').on(table.sourceDomain),
    statusIdx: index('tracked_backlinks_status_idx').on(table.status),
    lastCheckedIdx: index('tracked_backlinks_last_checked_idx').on(table.lastCheckedAt),
    createdAtIdx: index('tracked_backlinks_created_at_idx').on(table.createdAt),
  })
);

export type TrackedBacklink = typeof trackedBacklinks.$inferSelect;
export type NewTrackedBacklink = typeof trackedBacklinks.$inferInsert;

export type TrackedBacklinkStatus = 'active' | 'lost' | 'pending' | 'broken';
export type TrackedBacklinkLinkType = 'dofollow' | 'nofollow' | 'ugc' | 'sponsored';
