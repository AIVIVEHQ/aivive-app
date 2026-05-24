ALTER TABLE "orders" ADD COLUMN "creem_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "creem_product_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "creem_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "creem_customer_id" varchar(255);