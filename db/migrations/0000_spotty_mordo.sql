CREATE TABLE "health_diagnostics" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"status" varchar(32) NOT NULL,
	"response_time_ms" text NOT NULL,
	"server_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matrix_cell_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matrix_row_id" varchar(64) NOT NULL,
	"package_id" varchar(64) NOT NULL,
	"value_type" varchar(16) DEFAULT 'boolean' NOT NULL,
	"boolean_val" boolean,
	"text_val" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matrix_cell_row_pkg_unique" UNIQUE("matrix_row_id","package_id")
);
--> statement-breakpoint
CREATE TABLE "matrix_rows" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"category" varchar(128) NOT NULL,
	"feature_name" varchar(255) NOT NULL,
	"tooltip" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" varchar(64) NOT NULL,
	"feature_text" varchar(255) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"tagline" varchar(255),
	"price_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(8) DEFAULT 'INR' NOT NULL,
	"billing_type" varchar(32) NOT NULL,
	"price_display_override" varchar(64),
	"ideal_for" text NOT NULL,
	"popular" boolean DEFAULT false NOT NULL,
	"badge" varchar(64),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "system_metadata" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"details" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matrix_cell_values" ADD CONSTRAINT "matrix_cell_values_matrix_row_id_matrix_rows_id_fk" FOREIGN KEY ("matrix_row_id") REFERENCES "public"."matrix_rows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matrix_cell_values" ADD CONSTRAINT "matrix_cell_values_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_features" ADD CONSTRAINT "package_features_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;