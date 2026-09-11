<!--
  @branch feature/schedulesprototype
  Database requirements for the Labor Log feature.
  Plain-English spec for the DB person — describes how the prototype is used,
  what needs to be persisted, and the relationships between entities.
  Not migration SQL — that comes later once we agree on the model.
-->

# Labor Log — Database Requirements

**Branch:** `feature/schedulesprototype`
**Purpose:** Hand-off doc for the DB engineer. Describes how the v1 prototype uses data so we can design a clean v2 schema together.
**Status:** v1 ships with mock data in `localStorage`; no DB writes yet. This doc is the contract for what needs to exist when we move off mocks.

---

## 1. What this feature does (30-second version)

Three Project Managers (Rafa, Mambo, Juan) each keep a **weekly schedule** of who worked which day, how much, and on what project. Field Managers fill it in for themselves + their subcontractor crews. Finance (Allisson) reviews everything across all three sections for payables.

It's a *separate tool* from Proposal Log. Some users see only this, some see only Proposal Log, some see both — controlled per user.

**Work week runs Friday → Thursday.** Same shape every week. Every assigned person/crew is always visible — no manual roster setup per week.

---

## 2. Who uses it

| Persona | Examples | What they do |
|---|---|---|
| **Project Manager** | Rafael Marin, Mambo, Juan Carlos | Owns one section. Sees + edits everything in their section. |
| **Field Manager** | Cecilia, Ricardo, William (Rafa's team) | Fills in their own hours + their section's subs. Sees only their section. |
| **Internal-team-only PM** | Juan Carlos | Has internal staff but no subs (office team). |
| **Finance / Payables** | Allisson | Read + edit ALL sections. Also keeps access to the existing Proposal Log. |
| **Labor admin** | Allisson (initially) | Manages which user can see/edit which section. Distinct from estimation/proposal-log admin. |

---

## 3. What gets stored

Five things. Plain English.

### A. **Sections**
- Three of them today: Rafa, Mambo, Juan.
- Each has a Project Manager (links to a `users` row).
- Should be extensible — adding "Pedro Section" later should be a single insert.

### B. **Subjects** — the rows that appear in each weekly table
- Two flavors:
  - **Internal team** — a person (e.g. Cecilia Rodriguez). Has a role label ("Supervisor-IN", "Office"). May also be a platform user.
  - **Subcontractor** — a crew/company (e.g. "Jimenez Exterior, LLC"). Not a login.
- Belongs to ONE section.
- Always rendered — every week, every assigned subject shows up, starting at 0%.
- Edge case: the same crew name ("CUEVAS CONSTRUCTION") appears under both Rafa and Mambo today. Currently we duplicate it. **Decision needed** — see §8.

### C. **Weekly entries** — the actual schedule
- One *row* per (week, section, subject). The week is identified by its **Friday date**.
- Each row contains **7 day-cells** (Fri–Thu).
- Per cell:
  - **Percentage** (only for internal): 0% / 50% / 100% — used to compute Total Days
  - **Project or status text**: "Altera Bethpage", "Office", "PTO", "OFF", etc. — free text + autocomplete from a lookup
  - *(see §6 for the open design question on time-off classification)*
- Optional **row-level notes** (we render the column from the diagram).
- "Total Days" is **computed**, never stored — sum of percentages across the week.

### D. **Project / location vocabulary** — the lookup users pick from
- ~80 values today, all from the Excel `DATA_BASE` sheet.
- Mixed bag: job sites, internal statuses, time-off types, role indicators.
- Every value needs a **category** (this is the missing piece — see §6).

### E. **Users + permissions**
- A user has the existing `role` (admin/manager/viewer) — drives Proposal Log access.
- A user ALSO has 0..N **permission tags** — drives Labor Log access.
- Same login, two independent permission systems that can be combined per user.
- Tag grammar: `tool:action:scope` (see §5).

### F. **Audit trail**
- Every cell edit logged: timestamp, user, section, subject, week, day, value before, value after.
- Today this lives in `localStorage`; v2 needs a server table so it survives across browsers and is reportable.

---

## 4. How it's used (the main flows)

### Flow 1 — open a section
1. User clicks "Labor Log" in the sidebar (or it auto-routes there if they're labor-only).
2. We pull *all subjects for that section* and *all entries for the current week*.
3. Internal team renders as a grid with day cells + Total Days; subs render as a dispatch grid (no totals).
4. Cells default to "0% / blank" for any subject that has no entry that week.

### Flow 2 — edit a cell
1. User clicks a cell → popover opens.
2. For internal: pick OFF / 50% / 100%, type or pick a project/status.
3. For sub: type or pick a project/location (or "OFF").
4. Save → upsert one cell, append an audit row, re-render.

### Flow 3 — change weeks
- Prev / next buttons, anchored on Friday.
- Past weeks should be editable too (corrections) — gated by the same permissions.

### Flow 4 — finance view (All Sections)
- Allisson sees one merged Internal table + one merged Subs table, with a Section column.
- Same search bar; can sort by Section to group.
- She can edit anywhere because she has `labor:edit:all`.

### Flow 5 — admin (Manage Users)
- Allisson opens `/labor-log/admin/users`.
- Toggles tags per user, saves.
- Affects who sees which sidebar links and which sections, immediately.

---

## 5. Permission model (what the DB needs to store)

A user can have **multiple tags** stored as a string array on the users table. Tag grammar:

```
tool:action:scope
```

Concrete tags we use today:

| Tag | Effect |
|---|---|
| `estimation:access` | Sees the existing Proposal Log / Commercial / Residential / Analytics sidebar |
| `labor:view:<section>` | Read-only access to one section |
| `labor:edit:<section>` | Read + write to one section |
| `labor:admin:<section>` | Manage subjects/roster for one section (future use) |
| `labor:view:all` | Read all 3 sections (Finance) |
| `labor:edit:all` | Edit all 3 sections (Finance) |
| `labor:admin:global` | Manage user permissions (Allisson) |

**Note:** *role* (admin/manager/viewer) and *tags* are independent. An existing estimation admin doesn't automatically get labor access. A labor-only user doesn't automatically get estimation access. They have to be granted explicitly.

For DB: a single `text[]` column on `users` is enough. We'd want a GIN index for `permissions @> array['...']` lookups.

---

## 6. **Open design question: time off vs. work**

> *"Currently for internal we have location for office or remote and projects, but we are missing a way to log if someone used a sick day or a pto day."*

### The problem

Right now the cell stores **one text value** for whatever the person was doing that day. That value could be:

- A job site → `"Altera Bethpage"`, `"3811 bonwood cir"`
- An internal status → `"Office"`, `"Remote"`, `"Shop"`, `"Supervisor-IN"`
- A leave type → `"PTO"`, `"Sick-Paid"`, `"Holiday Paid"`, `"Vacation"`, `"Bereavement Day"`

All three live in the same field. Downstream (payroll, reports, audits) can't tell them apart without parsing strings — and "PTO" vs "Office" is fundamentally different data.

### My recommendation: **category on the lookup table**

Add ONE column to the project/location vocabulary table:

```
project_items
├── id
├── label          (e.g. "PTO", "Altera Bethpage", "Office")
├── category       ← NEW — one of:
│                       'work_site'      (real job sites: addresses, named projects)
│                       'internal_work'  (Office, Remote, Shop, Service, Inventory…)
│                       'role_marker'    (Supervisor-IN, Assistant Project Manager)
│                       'time_off_paid'  (PTO, Holiday Paid, Sick-Paid, Vacation, Bereavement Day)
│                       'time_off_unpaid'(Sick Day-Not Paid, No Show)
│                       'weather'        (Rain, Snow)
│                       'status'         (OFF, Half Day, Safety)
└── active
```

Cell entries reference the lookup by `project_item_id` (preferred) **or** carry a free-text fallback for one-off job sites the user hasn't added to the lookup yet.

**Why this is the right move:**

| Benefit | How |
|---|---|
| Zero UX change | Field Managers keep typing/picking like they do today |
| Trivial PTO reporting | `WHERE category IN ('time_off_paid','time_off_unpaid')` |
| Payroll-ready | Time-off entries can be exported separately; billable days isolated to `work_site` + `internal_work` |
| Distinguishes Sick-Paid from Sick-Unpaid | Two separate lookup rows, both `time_off_*`, different downstream treatment |
| Future-proof | Adding a "Jury Duty" leave type is one row insert + classify it |

**Optional UI cherry on top** (not required for v1 DB, but worth mentioning):
- In the cell editor, surface a small chip row above the autocomplete: `[+ PTO] [+ Sick] [+ Holiday] [+ Vacation]`. One click fills both the percentage (100%) and the project text (the leave type). Speeds up the most common time-off entry to one tap.

### Things to decide with the DB person

1. **Approval workflow?** Do PTO/Sick entries need approval (manager sign-off, status field), or are they self-served like today's Excel?
2. **Hour-based vs day-based leave?** Half-day PTO is `50% + 'PTO'` today. Works for v1; might need separate "hours" later.
3. **Leave balance tracking?** Should the system know how much PTO/Sick each person has remaining, or is that HR's job? For v1 we just record what was taken.
4. **Pay code mapping?** If payroll runs from this data, we'll want to map each `category` to a payroll pay code. Could be a separate table.

---

## 7. Relationships at a glance

```
users ────────────────────────┐
  │ role (existing)            │
  │ permissions[] (NEW)        │
  │                            │ manager_user_id
  └────────────────────────────┤
                               ▼
                        sections (Rafa, Mambo, Juan, …)
                               │
                               ├──── subjects (Cecilia, Jimenez Exterior LLC, …)
                               │       kind: internal | sub
                               │       linked_user_id → users (optional)
                               │
                               ▼
                       labor_log_rows (week × section × subject)
                               │
                               ▼
                       labor_log_entries (one per day-of-week)
                               │
                               ├──── project_item (lookup, with category)
                               └──── project (optional FK to existing projects table → ties to Proposal Log)

labor_log_audit (separate stream, references user + subject + section)
```

---

## 8. Things still to decide

Bring these up with the DB person — they're judgment calls, not technical blockers.

1. **Cross-section subjects** — "CUEVAS CONSTRUCTION" appears in both Rafa and Mambo. Today we'd have two `subjects` rows. Options:
   - A) Keep duplicates (simple, current behavior, matches Excel).
   - B) Single `crews` table with a many-to-many to sections (cleaner, requires UI to pick which section's edits you're viewing).
2. **Percentage storage** — store as `numeric(4,2)` (0.0, 0.5, 1.0)? Or as a small enum (`'off' | 'half' | 'full'`)? v1 stores `0 | 0.5 | 1 | null`.
3. **Audit retention** — keep forever, or rolling 12 months? Affects table sizing.
4. **Soft-delete vs hard-delete** for subjects who leave the company. v1 has no concept of this. Probably want `active boolean` + filter, not actual DELETE.
5. **Concurrent edits** — two field managers edit the same cell at the same time. Last-write-wins, or optimistic locking with `updated_at`? v1 has no answer.
6. **Approval flow on time-off** — see §6.

---

## 9. Quick reference — current v1 data shapes

Mirror these in the schema and the API surface stays the same.

**Subject** (a row in the table):
```
id, section, kind (internal|sub), name, role (optional), linked_user_id (optional), active
```

**Weekly cell** (the unit being edited):
```
section, subject_id, week_start_date (Friday), day_of_week (0=Fri..6=Thu),
percentage (0|0.5|1|null),
project_item_id (FK to lookup),  ← OR free-text fallback
location_text (free-text override),
notes (row-level, optional)
```

**Project item** (lookup):
```
id, label, category (see §6), active
```

**User** (extension only):
```
existing columns…
permissions text[]   ← additive, default '{}'
```

**Audit entry**:
```
id, ts, user_id, user_name, section_id, subject_id, week_start_date, day_of_week, before (jsonb), after (jsonb)
```

---

## 10. Where the v1 source-of-truth lives

When the DB person designs the real schema, the canonical shapes are in:

| File | What it defines |
|---|---|
| `lib/laborLog/types.ts` | All TypeScript types — mirror these field-for-field |
| `lib/laborLog/mockData.ts` | Full seed lists (subjects, users, project items) extracted from the Excel |
| `lib/laborLog/store.ts` | The storage API surface — preserve these function signatures in v2 |
| `lib/laborLog/audit.ts` | Audit entry shape |

`grep -r "feature/schedulesprototype" .` shows every touched file in this feature.
