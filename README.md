# Casanova — Construction Project & Labor Dashboard

Internal project-management dashboard for **Cicada Construction Remodeling**. Built with Next.js, TypeScript, Tailwind CSS, and Supabase Postgres.

## What it does

- **Proposal Log** — manage commercial project proposals with search, filtering, sorting, pagination, import/export, and Excel reporting.
- **Residential Log** — separate pipeline for residential projects.
- **Project Details** — per-project contacts, notes, and drawings.
- **Admin & Audit** — user/role/position management and paginated audit logs.
- **Data Management** — manage builders, estimators, supervisors, locations, statuses, priorities, and residential reference data.
- **Analytics** — reporting and charts for project data.
- **Labor Log** *(in development, `feature/schedulesprototype`)* — weekly crew scheduling for three project-manager sections (Rafa, Mambo, Juan). V1 runs on mock data and `localStorage`; a Supabase-backed v2 schema is planned.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 15 (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) 3
- **Database:** [Supabase](https://supabase.com/) Postgres
- **Authentication:** JWT access tokens (`jsonwebtoken` / `jose`) + `bcrypt` password hashing
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/)
- **Notifications:** `react-toastify`
- **Reports/Export:** `exceljs`, native JSON import/export

## Prerequisites

- Node.js 18+ (v20+ recommended)
- npm
- A Supabase project with the required tables (see Database Setup below)

## Environment Variables

Create a `.env.local` file in the project root with at least these variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
JWT_SECRET=your-jwt-secret-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-or-reuse-jwt-secret

# Optional
NEXT_PUBLIC_DASHBOARD_BASE_URL=http://localhost:3000
```

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` and `JWT_SECRET` must never be committed. Keep `.env.local` out of version control.

## Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up the database**

   The app uses Supabase Postgres. Apply the SQL migrations in `db/migrations/` to your Supabase project (in order). The canonical schema for the upcoming Labor Log feature is documented in `db/feature-schedulesprototype-requirements.md`.

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production application |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
/app           # Next.js App Router pages and API route handlers
/components    # Reusable React components (common, dashboard, labor-log)
/contexts      # React Context providers (AuthContext)
/lib           # Library code: auth, Supabase client, DB helpers, audit logging,
               # labor-log types/store/mockData
/db/migrations # Numbered SQL migrations
/db            # Labor Log database requirements doc
/public        # Static assets (logos, etc.)
```

## Authentication & Authorization

### Proposal / Residential / Admin modules
Roles are stored on the `users` table:

| Role | Capabilities |
|------|--------------|
| `viewer` | View projects and analytics |
| `manager` | Add/edit/delete projects, access Data Management |
| `admin` | Full access including Admin panel and user/role management |

### Labor Log module
Uses an additive **permission tag** system on top of the role system. Tags follow the grammar `tool:action:scope`:

| Tag | Effect |
|-----|--------|
| `estimation:access` | Access Proposal Log, Commercial, Residential, Analytics |
| `labor:view:<section>` | Read-only access to one section (`rafa`, `mambo`, `juan`) |
| `labor:edit:<section>` | Read + write to one section |
| `labor:view:all` | Read all sections (Finance view) |
| `labor:edit:all` | Edit all sections |
| `labor:admin:global` | Manage Labor Log user permissions |

A user can hold both estimation and labor tags, or only one set. The sidebar hides links accordingly and the Labor Log landing route redirects each user to their appropriate default view.

## API Routes

- `POST /api/auth/login` — authenticate and receive JWT access + refresh cookie
- `POST /api/auth/refresh` — refresh access token
- `POST /api/auth/logout` — clear refresh cookie
- `POST /api/auth/register` — register a new user
- `/api/projects` — CRUD for commercial projects
- `/api/residential-projects` — CRUD for residential projects
- `/api/builders`, `/api/estimators`, `/api/locations`, `/api/statuses`, `/api/priorities`, etc. — reference data
- `/api/audit` — audit log read/write
- `/api/users` — user management
- `/api/reports/proposals` — generate Excel reports

All `/api/*` routes except login/refresh/logout/register require a valid `Authorization: Bearer <token>` header, verified by `middleware.ts` (via `jose`) and again inside route handlers (via `jsonwebtoken`).

## Audit Logging

User actions are logged to the `audit_log` table through `lib/auditLogger.ts` (server) and `lib/clientAuditLogger.ts` (client-initiated actions). Entries capture username, email, page, action, and a Charlotte/Eastern timestamp.

## Labor Log (Feature Branch)

Current v1 implementation:

- Source-of-truth files: `lib/laborLog/types.ts`, `lib/laborLog/mockData.ts`, `lib/laborLog/store.ts`, `lib/laborLog/weekUtils.ts`
- Work week runs **Friday → Thursday**.
- Subjects are either `internal` (percentage-based day totals) or `sub` (project dispatch only).
- Edits persist in `localStorage` with an audit trail; a role/view switcher lets admins preview other users.

The planned v2 schema is described in `db/feature-schedulesprototype-requirements.md` and includes `sections`, `subjects`, `labor_log_rows`, `labor_log_entries`, `project_items` (with categories for job sites, internal work, time-off, weather, etc.), and `labor_log_audit`.

## Security Notes

- Never commit `.env.local`, `.env`, or key files.
- Remove `ec2key.pem` from the repository if it is an active private key and rotate it immediately.
- `SUPABASE_SERVICE_ROLE_KEY` is used server-side only; the public Supabase client is not exposed to the browser.

## Legacy / Migration Notes

- The app originally used SQLite; that code has been replaced by Supabase but legacy references (e.g., `lib/db-postgres.ts`, old README sections) may still be present.
- `package.json` still references `npm run db:init` pointing to `scripts/init-db.js`, which does not currently exist. Use the migrations in `db/migrations/` and the Supabase dashboard/CLI instead.

## Notion Sync (Outbound Publisher)

Open **Admin → Notion Sync** to preview app data, inspect setup, and publish small batches to the development Notion databases. Supabase remains read-only. Live Notion writes require explicit activation and confirmation; no pages are deleted. Automatic and Notion-to-Supabase synchronization are not running. The existing Proposal Log UI and data model remain unchanged.

- Existing `reference_project_id` chains supply a shared project ID for **Estimated Projects DB**. Original GC/proposal row IDs remain unique and unchanged.
- The highest existing row ID in each linked group supplies the current proposal fields. Because `projects` has no creation timestamp, this follows the existing sequence IDs, not the last edit time. Imported/manual IDs require review.
- The newest builder contact is selected by `created_at`, then ID, matching the app's builder-contact preference. Project contacts are used if that builder has no contacts. No contact history is deleted.
- App statuses keep their existing names. Existing twins are translated, including `Sent` ↔ `Proposal Sent`, `Assigned` ↔ `Estimator Assigned`, and `To Review` ↔ `For Review`. Notion-only statuses are flagged, never added to the app automatically.
- Supported OG properties include `OG GC / Client`, `OG Estimator`, `OG City, State` (or `OG Location`), and `OG Lost Reason`. The OG builder text field avoids changing an existing GC relation that may be hidden when its related database is not shared. Notion people, place, formula, notes, and automation fields are not overwritten. Unsupported optional values are skipped with warnings; missing status twins block the affected group.
- New links, same-name matches, source changes, and conflicting edits require review. Contact edits from Notion also require review; they are not applied to the shared builder directory.

The app-only preview works with the existing Supabase configuration. To enable read-only Notion comparison, configure these **server-side** environment variables and restart the dev server:

```env
NOTION_SYNC_PREVIEW_ENABLED=true
NOTION_TOKEN=<set-locally-do-not-commit>
NOTION_PROPOSALS_DATABASE_ID=8c275b2d-077e-83ae-9c64-01d4877c73f0
NOTION_ESTIMATED_PROJECTS_DATABASE_ID=3d775b2d-077e-8060-8206-e8fc185a1452
```

Both IDs above identify the development Notion databases verified during setup. The runtime uses the Notion API directly, not the editor's MCP credentials. It discovers data sources with API version `2025-09-03`. If a database has more than one data source, explicitly set `NOTION_PROPOSALS_DATA_SOURCE_ID` or `NOTION_ESTIMATED_PROJECTS_DATA_SOURCE_ID` as appropriate. Share both databases with the same Notion integration.

The publisher's setup adds `Supabase Project ID`, `Supabase Sync Snapshot`, an Estimated Projects relation, and the OG builder text field when needed. It preserves existing properties. The shared ID is the root app project ID, not Notion's generated Lead ID. Existing same-name rows without an ID and duplicate identities require review.

Local publishing (from the repository root):

```bash
node scripts/notion-sync.cjs --check
node scripts/notion-sync.cjs --setup
node scripts/notion-sync.cjs --setup --confirm
node scripts/notion-sync.cjs --publish
node scripts/notion-sync.cjs --publish --project-id 29 --confirm
node scripts/notion-sync.cjs --publish --confirm
node scripts/notion-sync.cjs --inventory
node scripts/notion-sync.cjs --verify --project-id 29
```

`--verify --project-id ID` reads a single group's mapped values and reports differences without changing either system. The approved field policy makes **Notion authoritative for `Follow-up1`**: outbound publishing never writes the app's `follow_up_date` into that field. Read-only comparison plans the Notion date for inbound application, including clearing a date. Actual Supabase date updates remain disabled until inbound synchronization is implemented, tested, and approved.

Commands without `--confirm` are read-only. `--publish` traverses all groups in batches; `--project-id` restricts it to that record's linked group. Repeat runs update matching managed pages and leave unchanged pages alone. Conflicting Notion edits stop the affected row. `--watch --confirm` repeats outbound passes while the process remains alive; it is not a deployed scheduler.

Web writes are disabled by default. Set `NOTION_SYNC_PUBLISH_ENABLED=true` only on a **single publisher host** with durable `NOTION_SYNC_STATE_DIR` storage (default `.notion-sync`, ignored by Git). The API and CLI must share that directory. Preserve its journal and lock across restarts: uncertain creates are blocked rather than retried blindly. Do not deploy this local-lock publisher to multiple hosts or ephemeral serverless instances. Reconcile interrupted runs against Notion before clearing any stale lock or pending journal entry.

The additive migration `db/migrations/013_create_notion_project_links.sql` is **prepared, not automatically applied**. It creates a service-role-only link table for the shared project identity, both Notion page IDs, selected source row/contact, and a comparison baseline. It does not alter project/status records. Review and test it separately before approving production application.

Admin-only API endpoints:

- `GET /api/sync/notion` — redacted configuration/readiness; never returns the token.
- `POST /api/sync/notion` with `{"scope":"source","limit":20}` — read-only app grouping preview.
- `POST /api/sync/notion` with `{"scope":"compare","limit":20,"projectId":123}` — legacy bidirectional comparison using the prepared link table. No changes are applied; it may report missing migration/baseline. Use the publish dry run to inspect the active outbound publisher's Notion-side baseline instead.
- `POST /api/sync/notion` with `{"scope":"setup","dryRun":true}` — inspect additive Notion schema setup.
- `POST /api/sync/notion` with `{"scope":"publish","dryRun":true,"limit":5,"afterProjectId":0}` — preview a publish batch. Use its `nextAfterProjectId` for the next batch, or restrict with `projectId`. Web publish limits are 1–5 to keep requests small.
- For setup/publish, `dryRun:false` requests live Notion writes and requires the server publish flag. Supabase writes are never enabled by this route.

Verification:

```bash
npm run test:notion-sync
npx tsc --noEmit --incremental false
```

Tests use in-memory fixtures and mocked requests; no production database or Notion credentials are used. Outbound publishing does not require the prepared Supabase migration. Inbound reference resolution, distributed locking, automatic retries, and a deployed scheduler remain separate work.

## Version

Beta v 1.13
