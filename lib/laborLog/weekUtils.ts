/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Friday-anchored work week math.
 * The Casanova work week runs Friday → Thursday.
 * Day index 0 = Friday, 6 = Thursday.
 */

import { DAY_LABELS, DayIndex } from './types';

/** Return the Friday of the week containing `date` (or `date` itself if it IS a Friday). */
export function getWeekStartFriday(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // JS getDay(): Sun=0, Mon=1 ... Fri=5, Sat=6
  // We want to go back to the most recent Friday.
  const dow = d.getDay();
  const daysSinceFriday = (dow - 5 + 7) % 7; // Fri=0, Sat=1, Sun=2, Mon=3 ... Thu=6
  d.setDate(d.getDate() - daysSinceFriday);
  return d;
}

/** ISO date string (YYYY-MM-DD) for the Friday week-start. */
export function weekStartIso(date: Date = new Date()): string {
  const wk = getWeekStartFriday(date);
  return toIsoDate(wk);
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Add N weeks to a Friday week-start ISO and return the new ISO. */
export function addWeeks(iso: string, weeks: number): string {
  const d = fromIsoDate(iso);
  d.setDate(d.getDate() + weeks * 7);
  return toIsoDate(d);
}

/** Get the date for a specific day index within a week (0=Fri ... 6=Thu). */
export function getDayDate(weekStartIso: string, dayIdx: DayIndex): Date {
  const d = fromIsoDate(weekStartIso);
  d.setDate(d.getDate() + dayIdx);
  return d;
}

/** Human label e.g. "Fri May 8 – Thu May 14, 2026". */
export function formatWeekRange(weekStartIso: string): string {
  const start = fromIsoDate(weekStartIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startFmt = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const endFmt = end.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startFmt} – ${endFmt}`;
}

export function getDayHeaderLabel(dayIdx: DayIndex, weekStartIso: string): string {
  const date = getDayDate(weekStartIso, dayIdx);
  return `${DAY_LABELS[dayIdx]} ${date.getMonth() + 1}/${date.getDate()}`;
}
