CREATE TABLE "verification_codes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "verification_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used_at" timestamp with time zone,
	"ip" varchar(64),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_verification_codes_email_purpose" ON "verification_codes" USING btree ("email","purpose");--> statement-breakpoint
CREATE INDEX "idx_verification_codes_ip_created" ON "verification_codes" USING btree ("ip","created_at");
