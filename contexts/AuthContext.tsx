'use client';

/**
 * @branch feature/schedulesprototype
 * AuthContext — extended with labor-log permission tags + role/view switcher.
 *
 * All proposal-log behavior is unchanged. Additions:
 *   - User shape gains `permissions?: string[]` (additive, optional).
 *   - `realUser` / `isViewingAs` / `viewAsUser(id|null)` power the mock
 *     impersonation flow used by RoleViewSwitcher.
 *   - New helpers: canAccessLaborLog, canAccessProposalLog, canViewSection,
 *     canEditSection, canViewAllSections, canManageLaborUsers, hasTag.
 *
 * Permission tag grammar: `tool:action:scope` — see lib/laborLog/types.ts.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
// @branch feature/schedulesprototype — labor-log integration imports
import { getAllUsers } from '../lib/laborLog/mockData';
import { getViewAsUserId, setViewAsUserId } from '../lib/laborLog/store';
import type { SectionId } from '../lib/laborLog/types';

export type UserRole = 'viewer' | 'manager' | 'admin';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  /**
   * @branch feature/schedulesprototype
   * Additive permission tags (v1: labor-log scope). Optional for backward
   * compat with existing DB users that pre-date the tag system.
   */
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (action: string) => boolean;
  canAccessAdmin: () => boolean;
  canAccessDataManagement: () => boolean;
  canEditProjects: () => boolean;
  canViewAnalytics: () => boolean;
  canDeleteData: () => boolean;
  canDeleteStatus: () => boolean;

  // ── Labor-log permission helpers (additive — proposal-log code unchanged) ──
  // @branch feature/schedulesprototype
  /** Real underlying logged-in user (ignores the "view as" override). */
  realUser: User | null;
  /** True when the dev role/view switcher is active. */
  isViewingAs: boolean;
  /** Switch the effective user (mock — used by the role/view switcher). */
  viewAsUser: (userId: string | null) => void;
  hasTag: (tag: string) => boolean;
  canAccessLaborLog: () => boolean;
  canAccessProposalLog: () => boolean;
  canViewSection: (s: SectionId) => boolean;
  canEditSection: (s: SectionId) => boolean;
  canViewAllSections: () => boolean;
  canManageLaborUsers: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [viewAsId, setViewAsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setRealUser(JSON.parse(savedUser));
      }
      setViewAsId(getViewAsUserId());
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      // Clear corrupted data if parsing fails
      localStorage.removeItem('user');
    } finally {
      // This ensures loading is false after the initial check, preventing a stuck state
      setLoading(false);
    }
  }, []);

  // The effective user — either the real logged-in user, or whoever the role/view
  // switcher is currently impersonating (mock-only, v1).
  const user: User | null = (() => {
    if (!viewAsId) return realUser;
    const mockUser = getAllUsers().find((u) => u.id === viewAsId);
    if (!mockUser) return realUser;
    return {
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      name: mockUser.name,
      permissions: mockUser.permissions,
    };
  })();

  const viewAsUser = (userId: string | null) => {
    setViewAsUserId(userId);
    setViewAsId(userId);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { user: userData, token } = await response.json();
        const userWithRole: User = {
          id: userData.id,
          email: userData.email,
          role: userData.role || 'viewer',
          name: userData.name,
          permissions: userData.permissions || [],
        };

        setRealUser(userWithRole);
        localStorage.setItem('user', JSON.stringify(userWithRole));
        localStorage.setItem('token', token); // Store the token
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // Best-effort request to clear server-side refresh cookie
    try {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).catch(() => {});
    } catch {}

    setRealUser(null);
    setViewAsId(null);
    setViewAsUserId(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Remove the token on logout
    window.location.href = '/login';
  };

  // Permission checking functions
  const hasPermission = (action: string): boolean => {
    if (!user) return false;

    const permissions = {
      viewer: {
        view_projects: true,
        view_analytics: true,
        edit_projects: false,
        delete_projects: false,
        access_admin: false,
        access_data_management: false,
        delete_data: false,
        delete_status: false,
      },
      manager: {
        view_projects: true,
        view_analytics: true,
        edit_projects: true,
        delete_projects: true,
        access_admin: false,
        access_data_management: true,
        delete_data: true,
        delete_status: false,
      },
      admin: {
        view_projects: true,
        view_analytics: true,
        edit_projects: true,
        delete_projects: true,
        access_admin: true,
        access_data_management: true,
        delete_data: true,
        delete_status: true,
      },
    };

    return permissions[user.role]?.[action] || false;
  };

  const canAccessAdmin = (): boolean => hasPermission('access_admin');
  const canAccessDataManagement = (): boolean => hasPermission('access_data_management');
  const canEditProjects = (): boolean => hasPermission('edit_projects');
  const canViewAnalytics = (): boolean => hasPermission('view_analytics');
  const canDeleteData = (): boolean => hasPermission('delete_data');
  const canDeleteStatus = (): boolean => hasPermission('delete_status');

  // ── Labor-log permission helpers ───────────────────────────────────────────
  // @branch feature/schedulesprototype
  // These layer on top of the existing role system. A user can have an
  // estimation role (admin/manager/viewer) AND a set of labor:* tags
  // independently — they don't imply each other.

  const tags = (): string[] => user?.permissions || [];
  const hasTag = (tag: string): boolean => tags().includes(tag);

  const canAccessLaborLog = (): boolean => tags().some((t) => t.startsWith('labor:'));

  /**
   * Estimation/proposal-log side visibility.
   *
   * Rule:
   *   - Explicit `estimation:access` tag → yes.
   *   - Has labor tags but NO estimation tag → no (labor-only user, e.g. Ricardo).
   *   - No labor tags AND has a platform role → yes (backward compat for existing
   *     DB users who pre-date the tag system).
   */
  const canAccessProposalLog = (): boolean => {
    if (!user) return false;
    if (hasTag('estimation:access')) return true;
    const hasLaborTags = tags().some((t) => t.startsWith('labor:'));
    if (hasLaborTags) return false; // labor-only user — opt-in to estimation required
    // Legacy users without any tags fall back to role-based access
    return user.role === 'admin' || user.role === 'manager' || user.role === 'viewer';
  };

  const canViewSection = (s: SectionId): boolean =>
    hasTag(`labor:view:${s}`) ||
    hasTag(`labor:edit:${s}`) ||
    hasTag(`labor:admin:${s}`) ||
    hasTag('labor:view:all') ||
    hasTag('labor:edit:all') ||
    hasTag('labor:admin:global');

  const canEditSection = (s: SectionId): boolean =>
    hasTag(`labor:edit:${s}`) ||
    hasTag(`labor:admin:${s}`) ||
    hasTag('labor:edit:all') ||
    hasTag('labor:admin:global');

  const canViewAllSections = (): boolean =>
    hasTag('labor:view:all') ||
    hasTag('labor:edit:all') ||
    hasTag('labor:admin:global');

  const canManageLaborUsers = (): boolean => hasTag('labor:admin:global');

  const value: AuthContextType = {
    user,
    loading,
    role: user?.role || null,
    login,
    logout,
    hasPermission,
    canAccessAdmin,
    canAccessDataManagement,
    canEditProjects,
    canViewAnalytics,
    canDeleteData,
    canDeleteStatus,

    realUser,
    isViewingAs: viewAsId !== null,
    viewAsUser,
    hasTag,
    canAccessLaborLog,
    canAccessProposalLog,
    canViewSection,
    canEditSection,
    canViewAllSections,
    canManageLaborUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
