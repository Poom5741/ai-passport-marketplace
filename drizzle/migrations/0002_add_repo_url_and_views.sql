-- Migration: 002_add_repo_url_and_views
-- Add repo_url column to projects, create project_views and profile_views dedup tables

-- Add repo_url column after live_url
ALTER TABLE `projects` ADD COLUMN `repo_url` TEXT;

-- Create project_views dedup table
CREATE TABLE IF NOT EXISTS `project_views` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL REFERENCES `projects`(`id`) ON DELETE CASCADE,
  `viewer_ip` text NOT NULL,
  `viewer_ua_hash` text NOT NULL,
  `viewed_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_project_views_project_ip_ua_time`
  ON `project_views` (`project_id`, `viewer_ip`, `viewer_ua_hash`, `viewed_at`);

-- Create profile_views dedup table
CREATE TABLE IF NOT EXISTS `profile_views` (
  `id` text PRIMARY KEY NOT NULL,
  `profile_user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `viewer_ip` text NOT NULL,
  `viewer_ua_hash` text NOT NULL,
  `viewed_at` integer NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_profile_views_user_ip_ua_time`
  ON `profile_views` (`profile_user_id`, `viewer_ip`, `viewer_ua_hash`, `viewed_at`);
