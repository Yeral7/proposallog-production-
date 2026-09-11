'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Internal team grid.
 * Renders subjects of kind='internal' with per-day editable cells and
 * a live-computed Total Days column. Edit gating is per-section.
 */
import React from 'react';
import { CellValue, DAY_LABELS, DayIndex, EntriesStore, SECTION_LABELS, Subject } from '../../lib/laborLog/types';
import { getCell } from '../../lib/laborLog/store';
import { getDayHeaderLabel } from '../../lib/laborLog/weekUtils';
import ScheduleCell from './ScheduleCell';

interface Props {
  subjects: Subject[];
  entries: EntriesStore;
  weekIso: string;
  /** Per-section edit gate — false renders read-only. */
  canEditSection: (section: Subject['section']) => boolean;
  /** Called when a cell is edited and saved. */
  onCellChange: (subject: Subject, day: DayIndex, next: CellValue) => void;
  /** Show a "Section" column (All Sections view). */
  showSection?: boolean;
}

function dayTotal(v: CellValue | undefined): number {
  if (!v || v.pct == null) return 0;
  return v.pct;
}

function weekTotal(entries: EntriesStore, weekIso: string, subjectId: string): number {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    total += dayTotal(getCell(entries, weekIso, subjectId, i as DayIndex));
  }
  return total;
}

const InternalScheduleTable: React.FC<Props> = ({
  subjects,
  entries,
  weekIso,
  canEditSection,
  onCellChange,
  showSection,
}) => {
  if (!subjects.length) {
    return <p className="text-sm text-gray-500 italic py-4">No internal team members.</p>;
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 text-left font-semibold sticky left-0 bg-gray-100">Name</th>
            <th className="px-3 py-2 text-left font-semibold">Role</th>
            {showSection && <th className="px-3 py-2 text-left font-semibold">Section</th>}
            {DAY_LABELS.map((_, i) => (
              <th key={i} className="px-2 py-2 text-center font-semibold">
                {getDayHeaderLabel(i as DayIndex, weekIso)}
              </th>
            ))}
            <th className="px-3 py-2 text-center font-semibold bg-blue-50">Total Days</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => {
            const total = weekTotal(entries, weekIso, s.id);
            const editable = canEditSection(s.section);
            return (
              <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium sticky left-0 bg-white">{s.name}</td>
                <td className="px-3 py-2 text-gray-600">{s.role || ''}</td>
                {showSection && (
                  <td className="px-3 py-2 text-gray-600">{SECTION_LABELS[s.section]}</td>
                )}
                {DAY_LABELS.map((_, i) => {
                  const day = i as DayIndex;
                  const cell = getCell(entries, weekIso, s.id, day);
                  return (
                    <td key={i} className="px-2 py-2 text-center align-top">
                      <ScheduleCell
                        value={cell}
                        kind="internal"
                        day={day}
                        canEdit={editable}
                        onChange={(next) => onCellChange(s, day, next)}
                      />
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center font-semibold bg-blue-50">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InternalScheduleTable;
