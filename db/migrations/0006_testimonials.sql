CREATE TABLE IF NOT EXISTS "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_name" varchar(150) NOT NULL,
	"company" varchar(150),
	"designation" varchar(150),
	"quote" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"avatar_url" varchar(512),
	"video_url" varchar(512),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "testimonials_is_active_idx" ON "testimonials" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "testimonials_display_order_idx" ON "testimonials" ("display_order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "testimonials_created_at_idx" ON "testimonials" ("created_at");
