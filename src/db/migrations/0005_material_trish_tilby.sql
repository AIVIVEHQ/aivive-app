CREATE TABLE "chat_conversations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chat_conversations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" varchar(255) NOT NULL,
	"user_uuid" varchar(255) NOT NULL,
	"title" varchar(255) DEFAULT '' NOT NULL,
	"model_id" varchar(100),
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chat_conversations_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE INDEX "idx_chat_conversations_user_uuid" ON "chat_conversations" USING btree ("user_uuid");--> statement-breakpoint
CREATE INDEX "idx_chat_conversations_updated_at" ON "chat_conversations" USING btree ("updated_at");
