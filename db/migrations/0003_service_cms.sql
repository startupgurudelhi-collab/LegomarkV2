CREATE TABLE "service_categories" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"short_label" varchar(64) NOT NULL,
	"description" text,
	"icon_name" varchar(64) DEFAULT 'Building2' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"category_id" varchar(64) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"title" varchar(255) NOT NULL,
	"short_label" varchar(128),
	"short_desc" text NOT NULL,
	"full_desc" text NOT NULL,
	"price_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"pricing_type" varchar(32) DEFAULT 'fixed' NOT NULL,
	"price_display_override" varchar(64),
	"government_fee_note" varchar(255),
	"timeline" varchar(128) NOT NULL,
	"popular" boolean DEFAULT false NOT NULL,
	"badge" varchar(64),
	"icon_name" varchar(64) DEFAULT 'Building2' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"headline" varchar(255),
	"overview" text,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seo_title" varchar(255),
	"meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128),
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"feature_text" varchar(255) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text NOT NULL,
	"icon_name" varchar(64) DEFAULT 'ShieldCheck' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"benefit_text" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_deliverables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"deliverable_text" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"document_text" varchar(255) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_process_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"step_number" varchar(16) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_related_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"related_service_id" varchar(64) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "service_related_services_unique" UNIQUE("service_id","related_service_id")
);
--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_features" ADD CONSTRAINT "service_features_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_highlights" ADD CONSTRAINT "service_highlights_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_benefits" ADD CONSTRAINT "service_benefits_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_deliverables" ADD CONSTRAINT "service_deliverables_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_documents" ADD CONSTRAINT "service_documents_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_process_steps" ADD CONSTRAINT "service_process_steps_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_faqs" ADD CONSTRAINT "service_faqs_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_related_services" ADD CONSTRAINT "service_related_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_related_services" ADD CONSTRAINT "service_related_services_related_service_id_services_id_fk" FOREIGN KEY ("related_service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "service_categories_display_order_idx" ON "service_categories" USING btree ("display_order");
--> statement-breakpoint
CREATE INDEX "service_categories_is_active_idx" ON "service_categories" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "services_slug_idx" ON "services" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "services_category_id_idx" ON "services" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX "services_display_order_idx" ON "services" USING btree ("display_order");
--> statement-breakpoint
CREATE INDEX "services_is_active_idx" ON "services" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX "service_features_service_id_idx" ON "service_features" USING btree ("service_id");
--> statement-breakpoint
CREATE INDEX "service_highlights_service_id_idx" ON "service_highlights" USING btree ("service_id");
--> statement-breakpoint
CREATE INDEX "service_benefits_service_id_idx" ON "service_benefits" USING btree ("service_id");
--> statement-breakpoint
CREATE INDEX "service_deliverables_service_id_idx" ON "service_deliverables" USING btree ("service_id");
--> statement-breakpoint
CREATE INDEX "service_documents_service_id_idx" ON "service_documents" USING btree ("service_id");
--> statement-breakpoint
CREATE INDEX "service_process_steps_service_id_idx" ON "service_process_steps" USING btree ("service_id");
--> statement-breakpoint
CREATE INDEX "service_faqs_service_id_idx" ON "service_faqs" USING btree ("service_id");
--> statement-breakpoint
CREATE INDEX "service_related_services_service_id_idx" ON "service_related_services" USING btree ("service_id");
