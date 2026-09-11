/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — shared types.
 *
 * Two concepts to keep separate:
 *  - User  = a login account (can edit, has permissions)
 *  - Subject = a row in the weekly schedule (a person OR a sub crew)
 *  A Subject may optionally link to a User (e.g. Cecilia is both).
 */

export const SECTIONS = ['rafa', 'mambo', 'juan'] as const;
export type SectionId = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  rafa: 'Rafa',
  mambo: 'Mambo',
  juan: 'Juan',
};

/** Friday=0 ... Thursday=6 — work week starts on Friday per Casanova convention. */
export const DAY_LABELS = ['FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'] as const;
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SubjectKind = 'internal' | 'sub';

export interface Subject {
  id: string;
  name: string;
  section: SectionId;
  kind: SubjectKind;
  role?: string; // e.g. "Supervisor-IN" — internal only
  linkedUserId?: string;
}

/**
 * Permission tag grammar: `tool:action:scope`
 *   labor:view:rafa | labor:edit:mambo | labor:admin:juan
 *   labor:view:all  | labor:edit:all   | labor:admin:global
 */
export type PermissionTag = string;

export interface LaborUser {
  id: string;
  name: string;
  email: string;
  /** Existing platform role (drives proposal-log access). */
  role: 'viewer' | 'manager' | 'admin';
  /** Additive permission tags (drives labor-log access + future tools). */
  permissions: PermissionTag[];
}

/** One cell in the grid: percentage + free-text project/location. */
export interface CellValue {
  /** null = blank/OFF for internal; ignored for subs (use project text). */
  pct: 0 | 0.5 | 1 | null;
  /** Free-text project / location, autocomplete from PROJECT_ITEMS. */
  project: string;
}

/** Per-week entries store shape (persisted in localStorage). */
export type EntriesStore = {
  [weekStartIso: string]: {
    [subjectId: string]: Partial<Record<DayIndex, CellValue>>;
  };
};
