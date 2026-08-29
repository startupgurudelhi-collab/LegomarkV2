ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "custom_name" varchar(128);
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "custom_tagline" varchar(255);
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "price_amount" numeric(12, 2);
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "currency" varchar(8) DEFAULT 'INR';
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "billing_type" varchar(32);
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "price_display_override" varchar(64);
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "custom_ideal_for" text;
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "custom_badge" varchar(64);
ALTER TABLE "service_packages" ADD COLUMN IF NOT EXISTS "popular" boolean;

CREATE TABLE IF NOT EXISTS "service_package_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_package_id" uuid NOT NULL,
	"feature_text" varchar(255) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "service_package_features" ADD CONSTRAINT "service_package_features_service_package_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "service_pkg_feat_service_pkg_id_idx" ON "service_package_features" USING btree ("service_package_id");

-- Data migration: Copy global template package commercial defaults into service_packages
UPDATE "service_packages" sp
SET 
  "price_amount" = COALESCE(sp."price_amount", p."price_amount"),
  "currency" = COALESCE(sp."currency", p."currency"),
  "billing_type" = COALESCE(sp."billing_type", p."billing_type"),
  "price_display_override" = COALESCE(sp."price_display_override", p."price_display_override"),
  "custom_tagline" = COALESCE(sp."custom_tagline", p."tagline"),
  "custom_ideal_for" = COALESCE(sp."custom_ideal_for", p."ideal_for"),
  "custom_badge" = COALESCE(sp."custom_badge", p."badge"),
  "popular" = COALESCE(sp."popular", p."popular")
FROM "packages" p
WHERE sp."package_id" = p."id" AND sp."price_amount" IS NULL;

-- Data migration: Seed existing package features into service_package_features for existing service_packages if not already present
INSERT INTO "service_package_features" ("service_package_id", "feature_text", "display_order")
SELECT sp."id", pf."feature_text", pf."display_order"
FROM "service_packages" sp
JOIN "package_features" pf ON pf."package_id" = sp."package_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "service_package_features" spf WHERE spf."service_package_id" = sp."id"
);
