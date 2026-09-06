---
parent: docs/eng-review-plan.md
labels: [implementation, task]
task_id: T2
created: 2026-09-05
state: done
estimate_human: ~30min
estimate_cc: ~5min
surfaced_by: A2 (project_tags table decision)
---

## What

Add `project_tags` DDL to the Drizzle schema. Separate table for tag associations with composite primary key on (project_id, tag).

## Why

`LIKE '%python%'` on a text column does a full table scan — can't use a B-tree index. Separate table with index on `tag` enables efficient filtered queries.

## Files

- `drizzle/schema.ts` (or raw `migrations/001.sql`)

## How

```sql
CREATE TABLE project_tags (
  project_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (project_id, tag)
);
CREATE INDEX idx_project_tags_tag ON project_tags (tag);
```

Update Drizzle schema to match. Generate migration with `drizzle-kit generate`.

## Verify

Insert (project_id, tag) pair via Drizzle. Query by tag — should return project via index, not full table scan. Check `EXPLAIN` shows index usage.

## Dependencies

- T1 (schema setup) — can run after basic drizzle init
