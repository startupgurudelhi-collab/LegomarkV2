CREATE TABLE "gsc_connections" (
	"id" varchar(64) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"connected_by_admin_id" uuid,
	"connected_email" varchar(255),
	"selected_property" varchar(255),
	"encrypted_access_token" text,
	"encrypted_refresh_token" text,
	"token_expiry" timestamp with time zone,
	"scope" text,
	"is_connected" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gsc_connections" ADD CONSTRAINT "gsc_connections_connected_by_admin_id_admin_users_id_fk" FOREIGN KEY ("connected_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;