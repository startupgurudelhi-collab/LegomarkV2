-- Migration 0010_association_logos.sql
-- Safe, additive migration for Association Logos (WE ARE ASSOCIATED)

CREATE TABLE IF NOT EXISTS "association_logos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" varchar(512) NOT NULL,
	"category" varchar(100) DEFAULT 'Professional Association' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "association_logos_is_active_idx" ON "association_logos" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "association_logos_display_order_idx" ON "association_logos" ("display_order");
