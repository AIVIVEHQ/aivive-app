CREATE TABLE "generation_likes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "generation_likes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"generation_uuid" varchar(255) NOT NULL,
	"user_uuid" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "generations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" varchar(255) NOT NULL,
	"user_uuid" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"prompt" text NOT NULL,
	"negative_prompt" text,
	"aspect_ratio" varchar(20) NOT NULL,
	"size" varchar(50) NOT NULL,
	"style_preset" varchar(100),
	"num_variations" integer DEFAULT 1 NOT NULL,
	"kling_task_id" varchar(255),
	"kling_model_id" varchar(50) DEFAULT 'kling-v1' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"image_url" varchar(500),
	"thumbnail_url" varchar(500),
	"image_width" integer,
	"image_height" integer,
	"file_size" integer,
	"credits_used" integer NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"generation_time_ms" integer,
	"user_agent" varchar(500),
	"ip_address" varchar(100),
	CONSTRAINT "generations_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_generations" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_generations" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_generation_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unique_like" ON "generation_likes" USING btree ("generation_uuid","user_uuid");--> statement-breakpoint
CREATE INDEX "idx_likes_generation" ON "generation_likes" USING btree ("generation_uuid");--> statement-breakpoint
CREATE INDEX "idx_likes_user" ON "generation_likes" USING btree ("user_uuid");--> statement-breakpoint
CREATE INDEX "idx_generations_user_uuid" ON "generations" USING btree ("user_uuid");--> statement-breakpoint
CREATE INDEX "idx_generations_created_at" ON "generations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_generations_status" ON "generations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_generations_public_gallery" ON "generations" USING btree ("created_at","is_public");