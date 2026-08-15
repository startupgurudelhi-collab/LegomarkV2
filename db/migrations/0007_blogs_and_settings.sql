CREATE TABLE IF NOT EXISTS "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) UNIQUE NOT NULL,
	"category" varchar(100) NOT NULL,
	"author" varchar(150) DEFAULT 'LEGOMARK Editorial Board' NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"featured_image" varchar(512),
	"seo_title" varchar(255),
	"meta_description" text,
	"seo_slug" varchar(255),
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blogs_slug_idx" ON "blogs" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blogs_category_idx" ON "blogs" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blogs_is_published_idx" ON "blogs" ("is_published");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blogs_created_at_idx" ON "blogs" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "website_settings" (
	"id" varchar(64) PRIMARY KEY DEFAULT 'global' NOT NULL,
	"company_name" varchar(255) DEFAULT 'LEGOMARK INDIA' NOT NULL,
	"positioning" varchar(255) DEFAULT 'LEGAL, TAXATION & CORPORATE ADVISORY' NOT NULL,
	"tagline" text DEFAULT 'Legal, Taxation & Corporate Advisory Services' NOT NULL,
	"business_description" text DEFAULT 'Simplifying company registration, taxation, trademark protection, and business compliance through transparent professional services.' NOT NULL,
	"phone" varchar(64) DEFAULT '+91 75308 47878' NOT NULL,
	"mobile" varchar(64) DEFAULT '+91 75308 47878' NOT NULL,
	"landline" varchar(64) DEFAULT '011-45768289' NOT NULL,
	"email" varchar(128) DEFAULT 'info@legomarkindia.com' NOT NULL,
	"whatsapp" varchar(64) DEFAULT '+91 75308 47878' NOT NULL,
	"primary_website" varchar(255) DEFAULT 'www.legomarkindia.com' NOT NULL,
	"secondary_website" varchar(255) DEFAULT 'www.legomark.com',
	"office_hours" varchar(255) DEFAULT 'Monday to Sunday: 11:00 AM – 8:00 PM' NOT NULL,
	"registered_office_address" text DEFAULT 'D-561, Pocket 11, DDA Janta Flats, Jasola, New Delhi – 110025' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);
