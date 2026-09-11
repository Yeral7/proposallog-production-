'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — User Permissions admin page.
 * Gated to labor:admin:global. Lets the admin toggle every permission tag
 * per user. Save persists to localStorage (labor-log:users-override) which
 * the seed loader honors as an override. Reset clears the override.
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiArrowLeft, HiOutlineSave, HiOutlineRefresh } from 'react-icons/hi';
import { useAuth } from '../../../../contexts/AuthContext';
import { LaborUser } from '../../../../lib/laborLog/types';
import { SEED_USERS, getAllUsers } from '../../../../lib/laborLog/mockData';
import { clearUsersOverride, saveUsersOverride } from '../../../../lib/laborLog/store';
import AccessDenied from '../../../../components/labor-log/AccessDenied';
import UserPermissionEditor from '../../../../components/labor-log/admin/UserPermissionEditor';

export default function AdminUsersPage() {
  const { canManageLaborUsers } = useAuth();
  const [users, setUsers] = useState<LaborUser[]>([]);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setUsers(getAllUsers());
  }, []);

  if (!canManageLaborUsers()) {
    return (
      <AccessDenied
        message="Only Labor Log global admins can manage users."
        hint="Get someone with labor:admin:global to grant you access."
      />
    );
  }

  const update = (next: LaborUser) => {
    setUsers((cur) => cur.map((u) => (u.id === next.id ? next : u)));
    setDirty(true);
  };

  const save = () => {
    saveUsersOverride(users);
    setDirty(false);
    setSavedAt(new Date().toLocaleTimeString());
  };

  const reset = () => {
    if (!confirm('Reset all users to the original seeded permissions? This clears your overrides.')) return;
    clearUsersOverride();
    setUsers(SEED_USERS);
    setDirty(false);
    setSavedAt(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link href="/labor-log" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <HiArrowLeft /> Back to Labor Log
        </Link>
      </div>

      <header className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Permissions</h1>
          <p className="text-sm text-gray-600 mt-1">
            Toggle which sections each user can view/edit, and whether they can also access the
            estimation side of the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
          {!dirty && savedAt && <span className="text-xs text-green-600">Saved at {savedAt}</span>}
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            <HiOutlineRefresh /> Reset to seed
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded ${
              dirty
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <HiOutlineSave /> Save
          </button>
        </div>
      </header>

      <div className="space-y-3">
        {users.map((u) => (
          <UserPermissionEditor key={u.id} user={u} onChange={update} />
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-500">
        v1 mock — changes persist to your browser's localStorage. In v2 this will sync to the database.
      </p>
    </div>
  );
}
