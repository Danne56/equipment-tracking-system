CREATE TYPE "public"."borrow_status" AS ENUM('active', 'returned');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('borrow', 'return', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."tool_status" AS ENUM('available', 'borrowed', 'maintenance');--> statement-breakpoint
CREATE TABLE "borrow_records" (
	"id" text PRIMARY KEY NOT NULL,
	"tool_id" text NOT NULL,
	"borrower_name" text NOT NULL,
	"borrower_location" text NOT NULL,
	"purpose" text NOT NULL,
	"borrowed_at" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone,
	"status" "borrow_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"tool_id" text NOT NULL,
	"borrow_record_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"read" text DEFAULT 'false' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"qr_code" text NOT NULL,
	"status" "tool_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "tools_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
ALTER TABLE "borrow_records" ADD CONSTRAINT "borrow_records_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_borrow_record_id_borrow_records_id_fk" FOREIGN KEY ("borrow_record_id") REFERENCES "public"."borrow_records"("id") ON DELETE no action ON UPDATE no action;