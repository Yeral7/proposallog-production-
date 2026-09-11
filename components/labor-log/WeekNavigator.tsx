'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Prev/current/next Friday-anchored week selector.
 */
import React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { addWeeks, formatWeekRange, weekStartIso } from '../../lib/laborLog/weekUtils';

interface Props {
  weekIso: string;
  onChange: (iso: string) => void;
}

const WeekNavigator: React.FC<Props> = ({ weekIso, onChange }) => {
  const today = weekStartIso();
  const isCurrent = weekIso === today;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(addWeeks(weekIso, -1))}
        className="p-2 rounded-md hover:bg-gray-200"
        aria-label="Previous week"
      >
        <HiChevronLeft size={20} />
      </button>

      <div className="text-center min-w-[280px]">
        <div className="font-semibold text-gray-800">Week of {formatWeekRange(weekIso)}</div>
        {!isCurrent && (
          <button
            type="button"
            onClick={() => onChange(today)}
            className="text-xs text-blue-600 hover:underline"
          >
            Jump to current week
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(addWeeks(weekIso, 1))}
        className="p-2 rounded-md hover:bg-gray-200"
        aria-label="Next week"
      >
        <HiChevronRight size={20} />
      </button>
    </div>
  );
};

export default WeekNavigator;
