'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Top-of-page Rafa/Mambo/Juan/All section navigator.
 * Auto-hides when the user has access to a single place. Surfaces the
 * ⚙ Manage Users link for global labor admins.
 */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiOutlineCog } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import { SECTIONS, SECTION_LABELS, SectionId } from '../../lib/laborLog/types';

/**
 * Top-of-page section navigator. Only renders sections the current user can
 * view; hides itself entirely when the user has access to a single section
 * (no point in a one-button row).
 */
const SectionPicker: React.FC = () => {
  const pathname = usePathname();
  const { canViewSection, canViewAllSections, canManageLaborUsers } = useAuth();

  const visibleSections = (SECTIONS as readonly SectionId[]).filter((s) => canViewSection(s));
  const includeAll = canViewAllSections();
  const showAdmin = canManageLaborUsers();

  // If access is to exactly one place AND no admin link to surface, skip entirely.
  if (visibleSections.length + (includeAll ? 1 : 0) <= 1 && !showAdmin) return null;

  const tab = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          active
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {visibleSections.map((s) => tab(`/labor-log/${s}`, SECTION_LABELS[s]))}
      {includeAll && tab('/labor-log/all', 'All Sections')}
      {showAdmin && (
        <Link
          href="/labor-log/admin/users"
          className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium border ${
            pathname?.startsWith('/labor-log/admin')
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <HiOutlineCog /> Manage Users
        </Link>
      )}
    </div>
  );
};

export default SectionPicker;
