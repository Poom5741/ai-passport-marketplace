-- Migration: 003_profile_view_count
-- Add persistent profile view counter. The profile_views dedup log is cleaned
-- after 24h, so total profile views must live in a counter column (same
-- pattern as projects.view_count).

ALTER TABLE `users` ADD COLUMN `profile_view_count` INTEGER NOT NULL DEFAULT 0;
