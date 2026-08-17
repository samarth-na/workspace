CREATE TABLE `call` (
	`id` text PRIMARY KEY NOT NULL,
	`host_id` text,
	`workspace_id` text,
	`status` text DEFAULT 'ringing' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`last_heartbeat_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `call_workspace_idx` ON `call` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `call_member` (
	`call_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`call_id`, `user_id`),
	FOREIGN KEY (`call_id`) REFERENCES `call`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `call_member_user_idx` ON `call_member` (`user_id`);