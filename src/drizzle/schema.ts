import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Users table — one row per learner
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // ULID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  bio: text('bio').default(''),
  avatarUrl: text('avatar_url'), // Cloudflare Images URL or null
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Projects table — one row per submitted project
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), // ULID
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  liveUrl: text('live_url'),
  screenshotUrl: text('screenshot_url'), // Cloudflare Images URL
  viewCount: integer('view_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Project tags — separate table for efficient tag filtering
// Composite PK on (projectId, tag) prevents duplicates
export const projectTags = sqliteTable('project_tags', {
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(), // lowercase, normalized
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectTag = typeof projectTags.$inferSelect;
