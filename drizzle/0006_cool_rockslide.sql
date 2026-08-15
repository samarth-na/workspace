CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`actor_id` text NOT NULL,
	`task_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notification_userId_idx` ON `notification` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_userRead_idx` ON `notification` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `task_attachment` (
	`task_id` text NOT NULL,
	`file_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`task_id`, `file_id`),
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`file_id`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `task_attachment_fileId_idx` ON `task_attachment` (`file_id`);--> statement-breakpoint
CREATE TABLE `task_mention` (
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`task_id`, `user_id`),
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `task_mention_userId_idx` ON `task_mention` (`user_id`);--> statement-breakpoint
CREATE TABLE `workspace` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workspace_createdBy_idx` ON `workspace` (`created_by`);--> statement-breakpoint
CREATE TABLE `workspace_member` (
	`workspace_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`workspace_id`, `user_id`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workspace_member_userId_idx` ON `workspace_member` (`user_id`);--> statement-breakpoint
ALTER TABLE `conversation` ADD `workspace_id` text REFERENCES workspace(id);--> statement-breakpoint
CREATE INDEX `conversation_workspace_idx` ON `conversation` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `task` ADD `workspace_id` text REFERENCES workspace(id);--> statement-breakpoint
ALTER TABLE `task` ADD `reminder_at` integer;--> statement-breakpoint
CREATE INDEX `task_reminderAt_idx` ON `task` (`reminder_at`);--> statement-breakpoint
ALTER TABLE `file` ADD `workspace_id` text REFERENCES workspace(id);--> statement-breakpoint
CREATE INDEX `file_workspace_idx` ON `file` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `folder` ADD `workspace_id` text REFERENCES workspace(id);--> statement-breakpoint
CREATE INDEX `folder_workspace_idx` ON `folder` (`workspace_id`);