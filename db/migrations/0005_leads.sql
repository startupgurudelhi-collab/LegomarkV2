CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(255),
	"city" varchar(100),
	"service_interested" varchar(255) NOT NULL,
	"service_id" varchar(64),
	"message" text,
	"source" varchar(100) DEFAULT 'Website Consultation Modal' NOT NULL,
	"status" varchar(32) DEFAULT 'NEW' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_service_interested_idx" ON "leads" ("service_interested");
