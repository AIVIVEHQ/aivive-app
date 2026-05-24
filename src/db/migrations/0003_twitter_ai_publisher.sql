CREATE TABLE "twitter_accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "twitter_accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_uuid" varchar(255) NOT NULL,
	"twitter_user_id" varchar(255) NOT NULL,
	"twitter_username" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_type" varchar(50) DEFAULT 'bearer' NOT NULL,
	"scope" text,
	"expires_at" timestamp with time zone,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "twitter_accounts_user_uuid_unique" UNIQUE("user_uuid")
);
--> statement-breakpoint
CREATE TABLE "twitter_posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "twitter_posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" varchar(255) NOT NULL,
	"user_uuid" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"input_text" text NOT NULL,
	"tweet_text" text,
	"image_prompt" text,
	"image_url" varchar(500),
	"image_width" integer,
	"image_height" integer,
	"file_size" integer,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"twitter_tweet_id" varchar(255),
	"twitter_tweet_url" varchar(500),
	"twitter_media_id" varchar(255),
	"error_message" text,
	"published_at" timestamp with time zone,
	CONSTRAINT "twitter_posts_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
CREATE INDEX "idx_twitter_accounts_user_uuid" ON "twitter_accounts" USING btree ("user_uuid");--> statement-breakpoint
CREATE INDEX "idx_twitter_accounts_status" ON "twitter_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_twitter_posts_user_uuid" ON "twitter_posts" USING btree ("user_uuid");--> statement-breakpoint
CREATE INDEX "idx_twitter_posts_created_at" ON "twitter_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_twitter_posts_status" ON "twitter_posts" USING btree ("status");
