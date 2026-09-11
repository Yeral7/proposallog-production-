'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Cell editor popover.
 * Internal cells: OFF / 50% / 100% radio + project/location autocomplete.
 * Sub cells: project/location text only. Closes on save / Escape / outside click.
 */
import React, { useEffect, useRef, useState } from 'react';
import { CellValue, SubjectKind } from '../../lib/laborLog/types';
import { PROJECT_ITEMS } from '../../lib/laborLog/mockData';
import { HiCheck, HiX } from 'react-icons/hi';

interface Props {
  initial: CellValue | undefined;
  kind: SubjectKind;
  onSave: (v: CellValue) => void;
  onCancel: () => void;
  /** Anchor for absolute positioning — relative to the cell. */
  anchorEl?: HTMLElement | null;
}

const PCT_OPTIONS: { label: string; value: 0 | 0.5 | 1 | null }[] = [
  { label: 'OFF',  value: null },
  { label: '50%',  value: 0.5  },
  { label: '100%', value: 1    },
];

const CellEditor: React.FC<Props> = ({ initial, kind, onSave, onCancel }) => {
  const isInternal = kind === 'internal';
  const [pct, setPct] = useState<0 | 0.5 | 1 | null>(initial?.pct ?? null);
  const [project, setProject] = useState<string>(initial?.project ?? '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [onCancel]);

  // Autocomplete suggestions (top 8)
  useEffect(() => {
    const q = project.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const matches = PROJECT_ITEMS.filter((p) => p.toLowerCase().includes(q)).slice(0, 8);
    setSuggestions(matches);
  }, [project]);

  const save = () => {
    if (isInternal && pct === null) {
      // OFF for internal → blank project text reads as "OFF"
      onSave({ pct: null, project: 'OFF' });
      return;
    }
    onSave({ pct: isInternal ? pct : null, project: project.trim() || (isInternal ? '' : 'OFF') });
  };

  return (
    <div
      ref={ref}
      className="absolute z-40 mt-1 bg-white border border-gray-300 rounded-md shadow-xl p-3 w-72"
      onClick={(e) => e.stopPropagation()}
    >
      {isInternal && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Percentage</label>
          <div className="flex gap-1">
            {PCT_OPTIONS.map((o) => {
              const active = pct === o.value;
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setPct(o.value)}
                  className={`flex-1 px-2 py-1.5 rounded text-sm font-medium border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-3 relative">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {isInternal ? 'Project / Location' : 'Project / Location (or OFF)'}
        </label>
        <input
          type="text"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          autoFocus={!isInternal}
          placeholder={isInternal ? 'e.g. Altera Bethpage' : 'e.g. 3811 bonwood cir or OFF'}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
          }}
        />
        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <li
                key={s}
                className="px-2 py-1 text-sm hover:bg-blue-50 cursor-pointer"
                onClick={() => {
                  setProject(s);
                  setSuggestions([]);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
        >
          <HiX /> Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
        >
          <HiCheck /> Save
        </button>
      </div>
    </div>
  );
};

export default CellEditor;
