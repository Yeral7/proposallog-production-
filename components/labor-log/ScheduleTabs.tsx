'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — All / Internal / Subs tab strip used inside each section page.
 */
import React from 'react';

export type ScheduleTab = 'all' | 'internal' | 'subs';

interface Props {
  value: ScheduleTab;
  onChange: (v: ScheduleTab) => void;
  /** Hide the Subs tab when a section has no subcontractors (e.g. Juan). */
  hasSubs?: boolean;
}

const TABS: { id: ScheduleTab; label: string }[] = [
  { id: 'all',      label: 'All Schedules' },
  { id: 'internal', label: 'Internal Team' },
  { id: 'subs',     label: 'Subcontractors' },
];

const ScheduleTabs: React.FC<Props> = ({ value, onChange, hasSubs = true }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-1">
        {TABS.filter((t) => hasSubs || t.id !== 'subs').map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ScheduleTabs;
