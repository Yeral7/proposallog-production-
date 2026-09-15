-- Soft-delete flag for Notion trash synchronization: a trashed Proposal Log
-- page sets projects.archived_at instead of deleting the row.

alter table public.projects
  add column if not exists archived_at timestamptz null;

create index if not exists projects_archived_at_idx
  on public.projects (archived_at)
  where archived_at is not null;
