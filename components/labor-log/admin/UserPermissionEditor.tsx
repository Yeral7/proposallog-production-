'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Admin grid row for one user.
 * Toggles every permission tag (estimation:access, labor:view|edit|admin per
 * section, labor:view|edit:all, labor:admin:global). Used inside the
 * /labor-log/admin/users page.
 */
import React, { useState } from 'react';
import { LaborUser, SECTIONS, SECTION_LABELS, SectionId } from '../../../lib/laborLog/types';

interface Props {
  user: LaborUser;
  onChange: (next: LaborUser) => void;
}

/** A single row in the admin grid — toggles all permission tags for one user. */
const UserPermissionEditor: React.FC<Props> = ({ user, onChange }) => {
  const toggle = (tag: string) => {
    const has = user.permissions.includes(tag);
    const next = has
      ? user.permissions.filter((t) => t !== tag)
      : [...user.permissions, tag];
    onChange({ ...user, permissions: next });
  };

  const has = (tag: string) => user.permissions.includes(tag);

  // Tailwind purges unused classes — keep these full strings literal.
  const COLORS: Record<string, string> = {
    blue:   'bg-blue-100 text-blue-800',
    green:  'bg-green-100 text-green-800',
    red:    'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    gray:   'bg-gray-200 text-gray-800',
  };

  const cb = (tag: string, label: string, color: keyof typeof COLORS = 'blue') => (
    <label className={`flex items-center gap-1.5 text-sm cursor-pointer select-none px-2 py-1 rounded ${
      has(tag) ? COLORS[color] : 'bg-gray-100 text-gray-600'
    }`}>
      <input
        type="checkbox"
        checked={has(tag)}
        onChange={() => toggle(tag)}
        className="cursor-pointer"
      />
      {label}
    </label>
  );

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-900">{user.name}</div>
          <div className="text-xs text-gray-500">{user.email} · platform role: <span className="font-medium">{user.role}</span></div>
        </div>
      </div>

      <div className="space-y-2">
        {/* Platform access (estimation/proposal-log side) */}
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Estimation / Proposal Log access</div>
          <div className="flex flex-wrap gap-1.5">
            {cb('estimation:access', 'Access estimation sidebar', 'purple')}
          </div>
        </div>

        {/* Per-section labor permissions */}
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Labor Log · per section</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left pr-2 pb-1">Section</th>
                <th className="text-left pb-1">View</th>
                <th className="text-left pb-1">Edit</th>
                <th className="text-left pb-1">Admin</th>
              </tr>
            </thead>
            <tbody>
              {(SECTIONS as readonly SectionId[]).map((s) => (
                <tr key={s}>
                  <td className="pr-2 py-0.5 font-medium text-gray-700">{SECTION_LABELS[s]}</td>
                  <td className="py-0.5">{cb(`labor:view:${s}`,  'view',  'gray')}</td>
                  <td className="py-0.5">{cb(`labor:edit:${s}`,  'edit',  'blue')}</td>
                  <td className="py-0.5">{cb(`labor:admin:${s}`, 'admin', 'red')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cross-section (finance) */}
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Labor Log · cross-section</div>
          <div className="flex flex-wrap gap-1.5">
            {cb('labor:view:all',    'View all sections',  'green')}
            {cb('labor:edit:all',    'Edit all sections',  'green')}
            {cb('labor:admin:global','Global labor admin', 'red')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionEditor;
