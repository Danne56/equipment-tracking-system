ALTER TABLE "borrow_records" ALTER COLUMN "borrowed_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tools" ALTER COLUMN "updated_at" SET DEFAULT now();