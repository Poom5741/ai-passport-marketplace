-- Migration: 001_initial
-- Create users, projects, and project_tags tables

CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL UNIQUE,
  `password_hash` text NOT NULL,
  `display_name` text NOT NULL,
  `bio` text DEFAULT '',
  `avatar_url` text,
  `created_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `projects` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `title` text NOT NULL,
  `description` text NOT NULL,
  `live_url` text,
  `screenshot_url` text,
  `view_count` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `project_tags` (
  `project_id` text NOT NULL REFERENCES `projects`(`id`) ON DELETE CASCADE,
  `tag` text NOT NULL,
  PRIMARY KEY (`project_id`, `tag`)
);

CREATE INDEX IF NOT EXISTS `idx_project_tags_tag` ON `project_tags` (`tag`);
CREATE INDEX IF NOT EXISTS `idx_projects_user_id` ON `projects` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_projects_created_at` ON `projects` (`created_at`);
