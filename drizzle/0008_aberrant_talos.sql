CREATE TABLE `recent_item` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`item_id` text NOT NULL,
	`title` text NOT NULL,
	`href` text NOT NULL,
	`visited_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recent_user_visited_idx` ON `recent_item` (`user_id`,`visited_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `recent_user_item_idx` ON `recent_item` (`user_id`,`type`,`item_id`);