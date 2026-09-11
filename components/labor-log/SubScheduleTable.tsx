'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Subcontractor dispatch grid.
 * Renders subjects of kind='sub'. No percentages and no week-total column —
 * each cell is just a project/location string (or OFF).
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
  canEditSection: (section: Subject['section']) => boolean;
  onCellChange: (subject: Subject, day: DayIndex, next: CellValue) => void;
  showSection?: boolean;
}

const SubScheduleTable: React.FC<Props> = ({
  subjects,
  entries,
  weekIso,
  canEditSection,
  onCellChange,
  showSection,
}) => {
  if (!subjects.length) {
    return <p className="text-sm text-gray-500 italic py-4">No subcontractors.</p>;
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 text-left font-semibold sticky left-0 bg-gray-100">Subcontractor</th>
            {showSection && <th className="px-3 py-2 text-left font-semibold">Section</th>}
            {DAY_LABELS.map((_, i) => (
              <th key={i} className="px-2 py-2 text-center font-semibold">
                {getDayHeaderLabel(i as DayIndex, weekIso)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => {
            const editable = canEditSection(s.section);
            return (
              <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium sticky left-0 bg-white">{s.name}</td>
                {showSection && (
                  <td className="px-3 py-2 text-gray-600">{SECTION_LABELS[s.section]}</td>
                )}
                {DAY_LABELS.map((_, i) => {
                  const day = i as DayIndex;
                  const cell = getCell(entries, weekIso, s.id, day);
                  return (
                    <td key={i} className="px-2 py-2 text-center">
                      <ScheduleCell
                        value={cell}
                        kind="sub"
                        day={day}
                        canEdit={editable}
                        onChange={(next) => onCellChange(s, day, next)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SubScheduleTable;
