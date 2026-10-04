CREATE TABLE "tracked_backlinks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_url" varchar(512) NOT NULL,
	"source_domain" varchar(255) NOT NULL,
	"target_url" varchar(255) NOT NULL,
	"anchor_text" varchar(255),
	"link_type" varchar(32) DEFAULT 'dofollow' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"http_status" integer,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_checked_at" timestamp with time zone,
	"outreach_type" varchar(64),
	"opportunity_id" varchar(64),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tracked_backlinks_target_url_idx" ON "tracked_backlinks" USING btree ("target_url");--> statement-breakpoint
CREATE INDEX "tracked_backlinks_source_domain_idx" ON "tracked_backlinks" USING btree ("source_domain");--> statement-breakpoint
CREATE INDEX "tracked_backlinks_status_idx" ON "tracked_backlinks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tracked_backlinks_last_checked_idx" ON "tracked_backlinks" USING btree ("last_checked_at");--> statement-breakpoint
CREATE INDEX "tracked_backlinks_created_at_idx" ON "tracked_backlinks" USING btree ("created_at");