'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — per-cell wrapper.
 * Renders the read-only display and owns the open/closed state for the
 * CellEditor popover. Used by both Internal and Sub schedule tables.
 */
import React, { useState } from 'react';
import { CellValue, DayIndex, SubjectKind } from '../../lib/laborLog/types';
import CellEditor from './CellEditor';

interface Props {
  value: CellValue | undefined;
  kind: SubjectKind;
  day: DayIndex;
  canEdit: boolean;
  onChange: (next: CellValue) => void;
}

function pctLabel(v: CellValue | undefined): string {
  if (!v || v.pct == null) return '';
  if (v.pct === 1) return '100%';
  if (v.pct === 0.5) return '50%';
  return '';
}

const ScheduleCell: React.FC<Props> = ({ value, kind, canEdit, onChange }) => {
  const [open, setOpen] = useState(false);
  const isInternal = kind === 'internal';
  const proj = value?.project ?? '';
  const pct = pctLabel(value);
  const isOff = !proj || proj.toUpperCase() === 'OFF';

  const handleSave = (next: CellValue) => {
    setOpen(false);
    onChange(next);
  };

  const trigger = (
    <button
      type="button"
      onClick={() => canEdit && setOpen((o) => !o)}
      disabled={!canEdit}
      className={`w-full text-center align-top px-1 py-1 rounded ${
        canEdit ? 'hover:bg-blue-50 cursor-pointer' : 'cursor-default'
      }`}
    >
      {isInternal ? (
        isOff && !pct ? (
          <span className="text-gray-300">0%</span>
        ) : (
          <div className="leading-tight">
            <div className={isOff ? 'text-gray-500' : 'text-gray-900 font-medium'}>
              {pct || 'OFF'}
            </div>
            {proj && (
              <div className="text-xs text-gray-500 truncate max-w-[120px] mx-auto" title={proj}>
                {proj}
              </div>
            )}
          </div>
        )
      ) : isOff ? (
        <span className="text-gray-400">OFF</span>
      ) : (
        <span className="text-gray-900 text-xs" title={proj}>
          {proj}
        </span>
      )}
    </button>
  );

  return (
    <div className="relative">
      {trigger}
      {open && canEdit && (
        <CellEditor
          initial={value}
          kind={kind}
          onSave={handleSave}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default ScheduleCell;
