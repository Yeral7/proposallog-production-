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

Apply `db/migrations/015_create_notion_sync_state.sql` before using the `supabase` state store. It creates `notion_sync_journal` (recovery journal / idempotency) and `notion_sync_lock` (120s cross-invocation lease, renewed on each journal save).

## Automatic sync

- **Cron**: `vercel.json` registers `GET /api/sync/notion/cron` every minute — pulls inbound (limit 20) then runs an outbound safety-net batch (limit 100, cursor persisted at journal key `cron:publishCursor`).
- **Webhook**: register `/api/sync/notion/webhook` in the Notion integration's Webhooks tab with event types `page.created`, `page.properties_updated`, `page.content_updated`. The first POST logs a `verification_token` — set it as `NOTION_WEBHOOK_SECRET` and paste it into Notion's verify form. Verified events trigger a single-page inbound pull via `after()`.
- **Publish-on-save**: project create/edit API routes call `schedulePublish(projectId)`, which publishes that one project via `after()` when `NOTION_SYNC_PUBLISH_ENABLED` is on.

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
