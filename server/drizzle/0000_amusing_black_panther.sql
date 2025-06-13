CREATE TABLE `borrow_records` (
	`id` text PRIMARY KEY NOT NULL,
	`tool_id` text NOT NULL,
	`borrower_name` text NOT NULL,
	`borrower_location` text NOT NULL,
	`purpose` text NOT NULL,
	`borrowed_at` integer NOT NULL,
	`returned_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`tool_id` text NOT NULL,
	`borrow_record_id` text,
	`created_at` integer NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`borrow_record_id`) REFERENCES `borrow_records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`qr_code` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tools_qr_code_unique` ON `tools` (`qr_code`);