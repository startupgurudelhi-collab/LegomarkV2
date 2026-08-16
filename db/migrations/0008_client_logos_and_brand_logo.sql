-- Migration 0008_client_logos_and_brand_logo.sql
-- Safe, additive migration for Client Logos and Website Settings Logo URL

-- 1. Add logo_url to website_settings if it does not exist
ALTER TABLE IF EXISTS "website_settings" 
ADD COLUMN IF NOT EXISTS "logo_url" varchar(512);

--> statement-breakpoint

-- 2. Create client_logos table for persistent corporate client showcase
CREATE TABLE IF NOT EXISTS "client_logos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" varchar(512) NOT NULL,
	"category" varchar(100) DEFAULT 'General Corporate' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);

--> statement-breakpoint

-- 3. Indexes for fast public query by is_active and display_order
CREATE INDEX IF NOT EXISTS "client_logos_is_active_idx" ON "client_logos" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_logos_display_order_idx" ON "client_logos" ("display_order");
