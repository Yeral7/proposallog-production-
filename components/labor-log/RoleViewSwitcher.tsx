'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Role/View switcher.
 * Modal (rendered via portal to escape sidebar stacking context) that lets the
 * operator impersonate any seed user to preview sidebar visibility and section
 * access without changing their real account.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineSwitchHorizontal, HiX, HiCheck } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import { getAllUsers } from '../../lib/laborLog/mockData';
import { LaborUser } from '../../lib/laborLog/types';

/**
 * Role / View switcher.
 * Renders the modal via a Portal into <body> so it escapes any
 * stacking context the sidebar creates (sticky/overflow/transform).
 */
const RoleViewSwitcher: React.FC = () => {
  const { user, realUser, isViewingAs, viewAsUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('');

  // createPortal needs document — only available client-side after mount.
  useEffect(() => setMounted(true), []);

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const users = getAllUsers();
  const currentId = user?.id;

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q),
      )
    : users;

  // ── Permission summary chips (small badges per row) ───────────────────────
  const sectionPerms = (u: LaborUser) => {
    type Row = { section: string; view: boolean; edit: boolean; admin: boolean };
    const rows: Record<string, Row> = {};
    for (const t of u.permissions) {
      const [, action, scope] = t.split(':');
      if (!scope || scope === 'all' || scope === 'global') continue;
      const r = (rows[scope] ||= { section: scope, view: false, edit: false, admin: false });
      if (action === 'view') r.view = true;
      if (action === 'edit') r.edit = true;
      if (action === 'admin') r.admin = true;
    }
    return Object.values(rows);
  };

  const hasTag = (u: LaborUser, t: string) => u.permissions.includes(t);

  // ── Render ────────────────────────────────────────────────────────────────
  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 text-left text-sm border border-gray-700"
      title="Switch view / role"
    >
      <HiOutlineSwitchHorizontal size={18} />
      <span className="leading-tight overflow-hidden">
        {isViewingAs ? (
          <>
            <div className="text-yellow-400 text-xs">Viewing as</div>
            <div className="text-xs text-gray-200 truncate">{user?.name || user?.email}</div>
          </>
        ) : (
          <span>Switch View</span>
        )}
      </span>
    </button>
  );

  const modal =
    open && mounted ? (
      createPortal(
        <div
          className="fixed inset-0 z-[1000] bg-black/60 flex items-start justify-center p-6 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white text-gray-900 rounded-lg shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold">Switch View / Role</h2>
                <p className="text-xs text-gray-500">
                  Mock impersonation — preview the platform as each user. Real account isn't changed.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-900 p-1"
                aria-label="Close"
              >
                <HiX size={22} />
              </button>
            </div>

            {/* Back to real account banner */}
            {isViewingAs && realUser && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div className="text-sm text-amber-900">
                  Impersonating <b>{user?.name}</b>. Your real account:{' '}
                  <b>{realUser.name || realUser.email}</b> ({realUser.role})
                </div>
                <button
                  type="button"
                  onClick={() => {
                    viewAsUser(null);
                    setOpen(false);
                  }}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ↩ Back to my account
                </button>
              </div>
            )}

            {/* Search */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by name, email, or role…"
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold w-10"></th>
                    <th className="px-3 py-2 text-left font-semibold">User</th>
                    <th className="px-3 py-2 text-left font-semibold">Role</th>
                    <th className="px-3 py-2 text-left font-semibold">Estimation</th>
                    <th className="px-3 py-2 text-left font-semibold">Labor sections</th>
                    <th className="px-3 py-2 text-left font-semibold">All / Admin</th>
                    <th className="px-3 py-2 text-right font-semibold w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const active = u.id === currentId;
                    const perms = sectionPerms(u);
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-gray-100 ${
                          active ? 'bg-green-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-2 text-center">
                          {active && <HiCheck className="text-green-600 inline" size={18} />}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{u.role}</td>
                        <td className="px-3 py-2">
                          {hasTag(u, 'estimation:access') ? (
                            <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                              access
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {perms.length === 0 ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {perms.map((p) => (
                                <span
                                  key={p.section}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-800 border border-blue-200"
                                >
                                  <b className="capitalize">{p.section}</b>
                                  <span className="text-blue-600">
                                    {[p.view && 'V', p.edit && 'E', p.admin && 'A']
                                      .filter(Boolean)
                                      .join('/')}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {hasTag(u, 'labor:view:all') && (
                              <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">view all</span>
                            )}
                            {hasTag(u, 'labor:edit:all') && (
                              <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">edit all</span>
                            )}
                            {hasTag(u, 'labor:admin:global') && (
                              <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-800">global admin</span>
                            )}
                            {!hasTag(u, 'labor:view:all') &&
                              !hasTag(u, 'labor:edit:all') &&
                              !hasTag(u, 'labor:admin:global') && (
                                <span className="text-gray-300">—</span>
                              )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              viewAsUser(u.id);
                              setOpen(false);
                            }}
                            disabled={active}
                            className={`px-3 py-1 text-xs rounded ${
                              active
                                ? 'bg-gray-100 text-gray-400 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {active ? 'Current' : 'Use'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                        No users match "{filter}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer legend */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <span>V = view · E = edit · A = admin (per section)</span>
              <span>{filtered.length} of {users.length} users</span>
            </div>
          </div>
        </div>,
        document.body,
      )
    ) : null;

  return (
    <>
      {trigger}
      {modal}
    </>
  );
};

export default RoleViewSwitcher;
