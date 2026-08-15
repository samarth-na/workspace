ALTER TABLE `project` ADD `workspace_id` text REFERENCES workspace(id);--> statement-breakpoint
CREATE INDEX `project_workspace_idx` ON `project` (`workspace_id`);--> statement-breakpoint
ALTER TABLE `meeting` ADD `workspace_id` text REFERENCES workspace(id);--> statement-breakpoint
CREATE INDEX `meeting_workspace_idx` ON `meeting` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `task_workspace_idx` ON `task` (`workspace_id`);