# Notion sync

Bidirectional sync between Supabase `projects` and the dev Notion databases "Proposal Log (for development)" + "Estimated Projects DB".

## Environment flags

| Variable | Purpose |
| --- | --- |
| `NOTION_TOKEN` | Integration token; required for any Notion access. |
| `NOTION_SYNC_PREVIEW_ENABLED` | Read-only Notion preview/compare (`true`). |
| `NOTION_SYNC_PUBLISH_ENABLED` | Live outbound writes to Notion (Supabase → Notion). |
| `NOTION_SYNC_INBOUND_ENABLED` | Live inbound writes to Supabase (Notion → Supabase). |
| `NOTION_SYNC_STATE_STORE` | `file` (local `.notion-sync/` journal + lock) or `supabase` (tables below). Defaults to `supabase` when `VERCEL` is set, else `file`. |
| `NOTION_SYNC_STATE_DIR` | File-store directory (default `.notion-sync`). |
| `CRON_SECRET` | Bearer token Vercel sends to `/api/sync/notion/cron`. |
| `NOTION_WEBHOOK_SECRET` | The `verification_token` Notion POSTs to the webhook on subscription creation; used as the HMAC key for `X-Notion-Signature`. |

## Migration

Apply `db/migrations/015_create_notion_sync_state.sql` before using the `supabase` state store. It creates `notion_sync_journal` (recovery journal / idempotency) and `notion_sync_lock` (60s cross-invocation lease, renewed on each journal save).

## Automatic sync

- **Cron**: `vercel.json` registers `GET /api/sync/notion/cron` every minute (`maxDuration = 120`) — pulls inbound (limit 20) then runs an outbound safety-net batch (limit 10) with a 40-second deadline; `cron:publishCursor` in the journal is persisted after every run, including interrupted ones.
- **Webhook**: register `/api/sync/notion/webhook` in the Notion integration's Webhooks tab with event types `page.created`, `page.properties_updated`, `page.content_updated`, `page.deleted`, `page.undeleted`. The first POST logs a `verification_token` — set it as `NOTION_WEBHOOK_SECRET` and paste it into Notion's verify form. Verified events trigger a single-page inbound pull via `after()`.
- **Publish-on-save**: project create/edit API routes call `schedulePublish(projectId)`, which publishes that one project via `after()` when `NOTION_SYNC_PUBLISH_ENABLED` is on (up to 6 attempts, 5s apart, while the sync lock is held). Single-project publishes use filtered Notion queries instead of full listings.
- **Delete sync**: deleting a project in the app trashes its Proposal Log page via `trashNotionProject(projectId, rootId)`; the Estimated Projects page is trashed only when no other non-archived project shares the group.

## Deletion

Requires `db/migrations/016_add_projects_archived_at.sql` (`projects.archived_at`).

- Notion page trashed/archived → inbound sets `projects.archived_at` (soft delete; journal-linked pages missing from live queries are checked directly, capped at 10 per run; live-but-missing pages are reported as `orphan`).
- Notion page restored → inbound clears `archived_at` (`restored`).
- App project deleted → Notion pages trashed as above. The Proposal Log page is shared by the whole `reference_project_id` group and keyed by the root id, so it (and the Estimated Projects page) is trashed only when the last non-archived member is deleted; if bids remain, the surviving member is republished instead. Deleting a group root hands the root over to the lowest-id member (`reference_project_id` re-parented in Supabase first, then the shared Notion pages' `Supabase Project ID` re-keyed to the new root) — nothing is trashed. Archived projects are hidden from user-facing reads, excluded from outbound publishing, and still counted by builder/estimator/location reference checks.

## Scripts

```bash
node scripts/notion-publish-run.cjs [--live] [--limit N] [--after ID] [--project ID]
node scripts/notion-inbound-run.cjs [--live] [--limit N] [--page <notion-page-id>]
node scripts/notion-gc-link.cjs [--live] [--matches]
```

## Tests

```bash
npm run test:notion-sync
```
