CREATE TABLE `folder` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`owner_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `folder`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `folder_parent_idx` ON `folder` (`parent_id`);--> statement-breakpoint
ALTER TABLE `file` ADD `folder_id` text REFERENCES folder(id);--> statement-breakpoint
CREATE INDEX `file_folder_idx` ON `file` (`folder_id`);