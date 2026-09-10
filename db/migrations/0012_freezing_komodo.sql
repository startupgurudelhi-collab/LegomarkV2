CREATE TABLE IF NOT EXISTS "website_page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"path" varchar(255) NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"referrer" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "website_daily_unique_visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"first_visit_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "website_daily_uniq_visitor" UNIQUE("date","visitor_hash")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_page_views_date_idx" ON "website_page_views" USING btree ("date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_page_views_path_idx" ON "website_page_views" USING btree ("path");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_page_views_visitor_date_idx" ON "website_page_views" USING btree ("visitor_hash","date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_daily_visitors_date_idx" ON "website_daily_unique_visitors" USING btree ("date");
