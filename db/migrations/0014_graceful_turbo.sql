ALTER TABLE "website_page_views" ADD COLUMN "session_id" varchar(64);--> statement-breakpoint
ALTER TABLE "website_page_views" ADD COLUMN "is_landing_page" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "website_page_views_landing_date_idx" ON "website_page_views" USING btree ("is_landing_page","date");