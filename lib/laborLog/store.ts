/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — localStorage-backed store.
 * No DB calls. All persistence is client-side.
 */

import { CellValue, DayIndex, EntriesStore, LaborUser, Subject } from './types';

const KEYS = {
  entries: 'labor-log:entries',
  usersOverride: 'labor-log:users-override',
  subjectsOverride: 'labor-log:subjects-override',
  viewAs: 'labor-log:view-as-user-id', // dev role/view switcher
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('labor-log store write failed', e);
  }
}

// ── Entries ──────────────────────────────────────────────────────────────────

export function loadEntries(): EntriesStore {
  return read<EntriesStore>(KEYS.entries, {});
}

export function getCell(
  store: EntriesStore,
  weekIso: string,
  subjectId: string,
  day: DayIndex,
): CellValue | undefined {
  return store[weekIso]?.[subjectId]?.[day];
}

export function setCell(
  weekIso: string,
  subjectId: string,
  day: DayIndex,
  value: CellValue,
): EntriesStore {
  const store = loadEntries();
  if (!store[weekIso]) store[weekIso] = {};
  if (!store[weekIso][subjectId]) store[weekIso][subjectId] = {};
  store[weekIso][subjectId][day] = value;
  write(KEYS.entries, store);
  return store;
}

// ── Users override (mock admin edits) ────────────────────────────────────────

export function loadUsersOverride(): LaborUser[] | null {
  return read<LaborUser[] | null>(KEYS.usersOverride, null);
}

export function saveUsersOverride(users: LaborUser[]): void {
  write(KEYS.usersOverride, users);
}

export function clearUsersOverride(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEYS.usersOverride);
}

// ── Subjects override (mock admin edits) ─────────────────────────────────────

export function loadSubjectsOverride(): Subject[] | null {
  return read<Subject[] | null>(KEYS.subjectsOverride, null);
}

export function saveSubjectsOverride(subjects: Subject[]): void {
  write(KEYS.subjectsOverride, subjects);
}

// ── "View as" — the role/view switcher ───────────────────────────────────────

export function getViewAsUserId(): string | null {
  return read<string | null>(KEYS.viewAs, null);
}

export function setViewAsUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  if (userId === null) {
    window.localStorage.removeItem(KEYS.viewAs);
  } else {
    write(KEYS.viewAs, userId);
  }
}
