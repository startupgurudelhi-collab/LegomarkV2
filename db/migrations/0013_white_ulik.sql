CREATE TABLE "blog_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_id" uuid,
	"blog_slug" varchar(255) NOT NULL,
	"blog_title" varchar(255) NOT NULL,
	"author_name" varchar(150) NOT NULL,
	"author_email" varchar(255),
	"content" text NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"admin_reply" text,
	"admin_replied_at" timestamp with time zone,
	"admin_replied_by" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "blog_comments_blog_id_idx" ON "blog_comments" USING btree ("blog_id");--> statement-breakpoint
CREATE INDEX "blog_comments_blog_slug_idx" ON "blog_comments" USING btree ("blog_slug");--> statement-breakpoint
CREATE INDEX "blog_comments_status_idx" ON "blog_comments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_comments_created_at_idx" ON "blog_comments" USING btree ("created_at");