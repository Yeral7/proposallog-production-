/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — lightweight client-side audit log.
 * Persists to localStorage so we don't need a server endpoint while mocking.
 * In v2 this will be replaced (or supplemented) by a server call.
 */

import { CellValue, DayIndex, SectionId } from './types';

const KEY = 'labor-log:audit';
const MAX_ENTRIES = 500;

export interface AuditEntry {
  ts: string;                 // ISO timestamp
  userId: string;
  userName: string;
  section: SectionId;
  subjectId: string;
  subjectName: string;
  weekIso: string;
  day: DayIndex;
  before: CellValue | null;
  after: CellValue;
}

export function appendAudit(entry: AuditEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const list: AuditEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.error('labor-log audit append failed', e);
  }
}

export function readAudit(): AuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}
