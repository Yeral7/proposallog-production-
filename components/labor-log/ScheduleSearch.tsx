'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Real-time search input for filtering schedule rows
 * by name / role / crew.
 */
import React from 'react';
import { HiOutlineSearch } from 'react-icons/hi';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const ScheduleSearch: React.FC<Props> = ({ value, onChange }) => (
  <div className="relative">
    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search by name, role, or crew…"
      className="pl-9 pr-3 py-2 border border-gray-300 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default ScheduleSearch;
