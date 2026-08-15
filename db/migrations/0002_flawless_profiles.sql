CREATE TABLE "founder_profiles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"designation" varchar(150) NOT NULL,
	"organization" varchar(150) DEFAULT 'LEGOMARK INDIA' NOT NULL,
	"photo_url" varchar(500),
	"description" text NOT NULL,
	"quote" text,
	"core_areas" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "office_profiles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(150) DEFAULT 'LEGOMARK INDIA' NOT NULL,
	"premises_photo_url" varchar(500),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"pincode" varchar(20) NOT NULL,
	"full_address" text NOT NULL,
	"mobile" varchar(50) NOT NULL,
	"mobile_raw" varchar(50) NOT NULL,
	"landline" varchar(50) NOT NULL,
	"landline_raw" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"office_hours" varchar(150) NOT NULL,
	"websites" jsonb NOT NULL,
	"primary_website" varchar(255) NOT NULL,
	"checklist" jsonb NOT NULL,
	"map_embed_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);
