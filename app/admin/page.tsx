'use client';

import React, { useState, useEffect } from 'react';
import { HiOutlineShieldCheck, HiSearch, HiChevronLeft, HiChevronRight, HiRefresh, HiUsers } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';
import { formatAuditTimeToCharlotte } from '@/lib/timezone';
import { logClientAuditAction } from '@/lib/clientAuditLogger';
import Banner from '../../components/Banner';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';
import { toast } from 'react-toastify';

interface AuditLog {
  id: number;
  username: string;
  email: string;
  page: string;
  action: string;
  created_at: string;
}

interface AuditResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: 'viewer' | 'manager' | 'admin';
}

interface EstimatorRow {
  id: number;
  name: string;
  user_id: number | null;
}

interface SupervisorRow {
  id: number;
  name: string;
  user_id: number | null;
}

interface PositionRow {
  id: number;
  name: string;
  description?: string | null;
}

interface UserPosition {
  id: number;
  name: string;
  description?: string | null;
  is_primary: boolean;
}

type AdminTab = 'audit' | 'users' | 'positions' | 'createUser';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Users tab state
  const [users, setUsers] = useState<(UserRow & { positions?: UserPosition[] })[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleEdits, setRoleEdits] = useState<Record<number, 'viewer' | 'manager' | 'admin'>>({});
  const [savingUserIds, setSavingUserIds] = useState<number[]>([]);
  const [estimators, setEstimators] = useState<EstimatorRow[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorRow[]>([]);
  const [linkEdits, setLinkEdits] = useState<Record<number, { estimatorId?: number | null; supervisorId?: number | null }>>({});
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  // Positions state
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState('');
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionDesc, setNewPositionDesc] = useState('');
  const [creatingPosition, setCreatingPosition] = useState(false);

  // Create User state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>([]);
  const [primaryPositionId, setPrimaryPositionId] = useState<number | null>(null);

  // Edit positions modal state (Users table)
  const [editingPositionsUser, setEditingPositionsUser] = useState<(UserRow & { positions?: UserPosition[] }) | null>(null);
  const [modalSelectedPositionIds, setModalSelectedPositionIds] = useState<number[]>([]);
  const [modalPrimaryPositionId, setModalPrimaryPositionId] = useState<number | null>(null);

  // Open positions edit modal
  const openPositionsModal = (user: UserRow & { positions?: UserPosition[] }) => {
    setEditingPositionsUser(user);
    const currentIds = (user.positions || []).map((p) => p.id);
    setModalSelectedPositionIds(currentIds);
    const currentPrimary = (user.positions || []).find((p) => p.is_primary)?.id ?? null;
    setModalPrimaryPositionId(currentPrimary);
  };

  const closePositionsModal = () => {
    setEditingPositionsUser(null);
    setModalSelectedPositionIds([]);
    setModalPrimaryPositionId(null);
  };

  // Save positions for the selected user via PATCH
  const savePositionsForUser = async () => {
    if (!editingPositionsUser) return;
    const user = editingPositionsUser;
    const existingIds = (user.positions || []).map((p) => p.id);
    const desiredIds = modalSelectedPositionIds;
    const add = desiredIds.filter((id) => !existingIds.includes(id));
    const remove = existingIds.filter((id) => !desiredIds.includes(id));

    // Determine primary
    let finalPrimary: number | null = null;
    if (desiredIds.length > 0) {
      finalPrimary = desiredIds.includes(modalPrimaryPositionId || -1)
        ? (modalPrimaryPositionId as number)
        : desiredIds[0];
    } else {
      finalPrimary = null;
    }

    // If nothing changed, just close
    const primaryChanged = (user.positions || []).find((p) => p.is_primary)?.id !== finalPrimary;
    if (add.length === 0 && remove.length === 0 && !primaryChanged) {
      closePositionsModal();
      return;
    }

    // Build payload
    const payload: any = { positions: { add, remove } };
    if (finalPrimary !== null || (user.positions || []).length > 0) {
      payload.positions.primaryId = finalPrimary;
    }

    setSavingUserIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
    try {
      const res = await fetchWithAuth(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to update user positions');
      }

      // Update local state for the user
      const newPositions: UserPosition[] = desiredIds.map((id) => {
        const meta = positions.find((p) => p.id === id);
        return {
          id,
          name: meta?.name || `#${id}`,
          description: meta?.description ?? null,
          is_primary: id === finalPrimary,
        };
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, positions: newPositions } : u))
      );

      // Audit log
      const addNames = add
        .map((id) => positions.find((p) => p.id === id)?.name || `#${id}`)
        .join(', ');
      const removeNames = remove
        .map((id) => positions.find((p) => p.id === id)?.name || `#${id}`)
        .join(', ');
      const parts: string[] = [];
      if (add.length) parts.push(`add: ${addNames}`);
      if (remove.length) parts.push(`remove: ${removeNames}`);
      if (primaryChanged)
        parts.push(`primary → ${finalPrimary ? (positions.find((p) => p.id === finalPrimary)?.name || `#${finalPrimary}`) : 'none'}`);
      await logClientAuditAction({
        page: 'Admin - User Management',
        action: `Updated positions for ${user.name || user.email}: ${parts.join(', ')}`,
      });

      toast.success('Positions updated');
      closePositionsModal();
    } catch (e) {
      console.error('Failed to update positions:', e);
      toast.error('Failed to update positions');
    } finally {
      setSavingUserIds((prev) => prev.filter((id) => id !== user.id));
    }
  };

  const fetchAuditLogs = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/audit?page=${page}&limit=50`);
      if (response.ok) {
        const data: AuditResponse = await response.json();
        let filteredLogs = data.logs;
        
        // Client-side search filtering
        if (search) {
          filteredLogs = data.logs.filter(log => 
            log.username.toLowerCase().includes(search.toLowerCase()) ||
            log.email.toLowerCase().includes(search.toLowerCase()) ||
            log.page.toLowerCase().includes(search.toLowerCase()) ||
            log.action.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        setAuditLogs(filteredLogs);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch audit logs');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(currentPage, searchTerm);
  }, [currentPage]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAuditLogs(1, searchTerm);
      setCurrentPage(1);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchEstimators();
      fetchSupervisors();
      fetchPositions();
    } else if (activeTab === 'positions' || activeTab === 'createUser') {
      fetchPositions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    setUsersCurrentPage(1);
  }, [userSearchTerm, users.length]);

  const formatDate = (dateString: string) => {
    return formatAuditTimeToCharlotte(dateString);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Users tab pagination controls
  const handleUsersPageChange = (newPage: number, totalPages: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setUsersCurrentPage(newPage);
    }
  };

  // Users tab logic
  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const response = await fetchWithAuth('/api/users?includePositions=true');
      if (response.ok) {
        const data: (UserRow & { positions?: UserPosition[] })[] = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setUsersError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsersError('Error loading users');
    } finally {
      setUsersLoading(false);
    }
  };

  const refreshUsers = () => {
    fetchUsers();
    fetchEstimators();
    fetchSupervisors();
  };

  const fetchEstimators = async () => {
    try {
      const res = await fetchWithAuth('/api/estimators');
      if (res.ok) {
        const data: EstimatorRow[] = await res.json();
        setEstimators(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching estimators:', e);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await fetchWithAuth('/api/supervisors');
      if (res.ok) {
        const data: SupervisorRow[] = await res.json();
        // Normalize to only fields we use
        const normalized = (Array.isArray(data) ? data : []).map((s: any) => ({ id: s.id, name: s.name, user_id: s.user_id ?? null }));
        setSupervisors(normalized);
      }
    } catch (e) {
      console.error('Error fetching supervisors:', e);
    }
  };

  const fetchPositions = async () => {
    setPositionsLoading(true);
    setPositionsError('');
    try {
      const res = await fetchWithAuth('/api/positions');
      if (res.ok) {
        const data: PositionRow[] = await res.json();
        setPositions(Array.isArray(data) ? data : []);
      } else {
        setPositionsError('Failed to fetch positions');
      }
    } catch (e) {
      console.error('Error fetching positions:', e);
      setPositionsError('Error loading positions');
    } finally {
      setPositionsLoading(false);
    }
  };

  const createPosition = async () => {
    const name = newPositionName.trim();
    if (!name) {
      toast.error('Position name is required');
      return;
    }
    setCreatingPosition(true);
    try {
      const res = await fetchWithAuth('/api/positions', {
        method: 'POST',
        body: JSON.stringify({ name, description: newPositionDesc.trim() || undefined }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create position');
      }
      const created: PositionRow = await res.json();
      setPositions((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPositionName('');
      setNewPositionDesc('');
      toast.success('Position created');
    } catch (e) {
      console.error('Failed to create position:', e);
      toast.error('Failed to create position');
    } finally {
      setCreatingPosition(false);
    }
  };

  const createUser = async () => {
    const name = newUserName.trim();
    const email = newUserEmail.trim();
    const password = newUserPassword;
    if (!name) {
      toast.error('Name is required');
      return;
    }
    if (!password) {
      toast.error('Password is required');
      return;
    }
    setCreatingUser(true);
    try {
      let positionIds: number[] | undefined = undefined;
      if (selectedPositionIds.length > 0) {
        const primary = primaryPositionId && selectedPositionIds.includes(primaryPositionId)
          ? primaryPositionId
          : selectedPositionIds[0];
        positionIds = [primary, ...selectedPositionIds.filter((id) => id !== primary)];
      }

      const res = await fetchWithAuth('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name, email: email || undefined, password, positionIds }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create user');
      }
      // Optional: parse response
      await res.json().catch(() => null);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setSelectedPositionIds([]);
      setPrimaryPositionId(null);
      toast.success('User created');
      // Optionally refresh users list if currently on users tab
      if (activeTab === 'users') {
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to create user:', e);
      toast.error('Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const saveUserChanges = async (user: UserRow) => {
    const selectedRole = roleEdits[user.id];
    const originalEstimatorId = estimators.find((e) => e.user_id === user.id)?.id ?? null;
    const originalSupervisorId = supervisors.find((s) => s.user_id === user.id)?.id ?? null;
    const edited = linkEdits[user.id] || {};
    const effectiveEstimatorId = edited.estimatorId !== undefined ? edited.estimatorId : originalEstimatorId;
    const effectiveSupervisorId = edited.supervisorId !== undefined ? edited.supervisorId : originalSupervisorId;

    const roleChanged = !!selectedRole && selectedRole !== user.role;
    const estChanged = effectiveEstimatorId !== originalEstimatorId;
    const supChanged = effectiveSupervisorId !== originalSupervisorId;

    if (!roleChanged && !estChanged && !supChanged) return;

    setSavingUserIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
    try {
      const payload: any = {};
      if (roleChanged) payload.role = selectedRole;
      if (estChanged) payload.estimatorId = effectiveEstimatorId ?? null;
      if (supChanged) payload.supervisorId = effectiveSupervisorId ?? null;

      const res = await fetchWithAuth(`/api/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to update user');
      }
      // Update local role
      if (roleChanged) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: selectedRole! } : u)));
        setRoleEdits((prev) => {
          const { [user.id]: _, ...rest } = prev;
          return rest;
        });
      }
      // Refresh lists to reflect new links
      if (estChanged) await fetchEstimators();
      if (supChanged) await fetchSupervisors();
      // Clear link edits for this user
      setLinkEdits((prev) => {
        const { [user.id]: _, ...rest } = prev;
        return rest;
      });
      // Audit log
      const parts: string[] = [];
      if (roleChanged) parts.push(`role → ${selectedRole}`);
      if (estChanged) parts.push(`estimator → ${effectiveEstimatorId ?? 'none'}`);
      if (supChanged) parts.push(`supervisor → ${effectiveSupervisorId ?? 'none'}`);
      await logClientAuditAction({
        page: 'Admin - User Management',
        action: `Updated ${user.name || user.email}: ${parts.join(', ')}`,
      });
      toast.success('User updated successfully');
    } catch (e) {
      console.error('Failed to save user changes:', e);
      toast.error('Failed to update user');
    } finally {
      setSavingUserIds((prev) => prev.filter((id) => id !== user.id));
    }
  };

  // Users tab derived data for client-side pagination
  const usersPageSize = 20;
  const term = userSearchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (!term) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });
  const usersTotal = filteredUsers.length;
  const usersTotalPages = Math.max(1, Math.ceil(usersTotal / usersPageSize));
  const currentUsersPage = Math.min(usersCurrentPage, usersTotalPages);
  const usersStartIdx = (currentUsersPage - 1) * usersPageSize;
  const usersEndIdx = Math.min(usersStartIdx + usersPageSize, usersTotal);
  const pagedUsers = filteredUsers.slice(usersStartIdx, usersEndIdx);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <Banner title="Admin & Audit" icon={<HiOutlineShieldCheck />} />
          
          <div className="mt-8">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'audit'
                        ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <HiOutlineShieldCheck className="mr-2 h-5 w-5" />
                      Audit Log
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'users'
                        ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <HiUsers className="mr-2 h-5 w-5" />
                      User Management
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('positions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'positions'
                        ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      {/* reuse icon for consistency */}
                      <HiUsers className="mr-2 h-5 w-5" />
                      Positions
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('createUser')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'createUser'
                        ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <HiUsers className="mr-2 h-5 w-5" />
                      Create User
                    </div>
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'audit' && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                {/* Header with search and refresh */}
                <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Audit Log</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Track all user actions across the application
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search audit logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                      />
                    </div>
                    
                    {/* Refresh button */}
                    <button
                      onClick={() => fetchAuditLogs(currentPage, searchTerm)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Refresh"
                    >
                      <HiRefresh className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)] mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading audit logs...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-500">
                    <p>{error}</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No audit logs found</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Page
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {log.page}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                            <div className="truncate" title={log.action}>
                              {log.action}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Pagination */}
              {!loading && !error && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      <HiChevronLeft className="h-5 w-5" />
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      <HiChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
              </div>
            )}

            {/* Positions Tab */}
            {activeTab === 'positions' && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Positions</h2>
                      <p className="text-sm text-gray-600 mt-1">Create and view positions used across the app</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Position name (e.g., Field Manager)"
                      value={newPositionName}
                      onChange={(e) => setNewPositionName(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newPositionDesc}
                      onChange={(e) => setNewPositionDesc(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                    />
                    <div>
                      <button
                        onClick={createPosition}
                        disabled={creatingPosition}
                        className={`w-full px-4 py-2 rounded-md text-white text-sm ${creatingPosition ? 'bg-gray-300 cursor-not-allowed' : 'bg-[var(--primary-color)] hover:opacity-90'}`}
                      >
                        {creatingPosition ? 'Creating...' : 'Add Position'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    {positionsLoading ? (
                      <p className="text-sm text-gray-500">Loading positions...</p>
                    ) : positionsError ? (
                      <p className="text-sm text-red-500">{positionsError}</p>
                    ) : positions.length === 0 ? (
                      <p className="text-sm text-gray-500">No positions yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {positions.map((p) => (
                              <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm text-gray-900">{p.name}</td>
                                <td className="px-6 py-3 text-sm text-gray-500">{p.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Create User Tab */}
            {activeTab === 'createUser' && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Create User</h2>
                      <p className="text-sm text-gray-600 mt-1">Add a new user with name, email, and password</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Full name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                    />
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700">Assign Positions</h3>
                    <p className="text-xs text-gray-500 mb-2">Optional. Select one or more positions and mark one as primary.</p>
                    {positionsLoading ? (
                      <p className="text-sm text-gray-500">Loading positions...</p>
                    ) : positionsError ? (
                      <p className="text-sm text-red-500">{positionsError}</p>
                    ) : positions.length === 0 ? (
                      <p className="text-sm text-gray-500">No positions defined yet</p>
                    ) : (
                      <div className="space-y-2">
                        {positions.map((p) => {
                          const checked = selectedPositionIds.includes(p.id);
                          return (
                            <div key={p.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-[var(--primary-color)] border-gray-300 rounded"
                                  checked={checked}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setSelectedPositionIds((prev) =>
                                      isChecked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                                    );
                                    if (!isChecked && primaryPositionId === p.id) {
                                      setPrimaryPositionId(null);
                                    }
                                  }}
                                />
                                <span className="text-sm text-gray-700">{p.name}</span>
                                {p.description ? (
                                  <span className="text-xs text-gray-500">- {p.description}</span>
                                ) : null}
                              </label>
                              <label className="flex items-center gap-2 text-xs text-gray-600">
                                <input
                                  type="radio"
                                  name="primaryPosition"
                                  disabled={!checked}
                                  checked={primaryPositionId === p.id}
                                  onChange={() => setPrimaryPositionId(p.id)}
                                />
                                Primary
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={createUser}
                      disabled={creatingUser}
                      className={`px-4 py-2 rounded-md text-white text-sm ${creatingUser ? 'bg-gray-300 cursor-not-allowed' : 'bg-[var(--primary-color)] hover:opacity-90'}`}
                    >
                      {creatingUser ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200">
                {/* Header with search and refresh */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage user accounts, roles, and permissions
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HiSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                        />
                      </div>
                      {/* Refresh button */}
                      <button
                        onClick={refreshUsers}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        title="Refresh"
                      >
                        <HiRefresh className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Positions management moved to Positions tab */}

                {/* Users table */}
                <div className="overflow-x-auto">
                  {usersLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)] mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading users...</p>
                    </div>
                  ) : usersError ? (
                    <div className="p-8 text-center text-red-500">
                      <p>{usersError}</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>No users found</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimator</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pagedUsers
                          .map((user) => {
                            const currentValue = roleEdits[user.id] ?? user.role;
                            const originalEstimatorId = estimators.find((e) => e.user_id === user.id)?.id ?? null;
                            const originalSupervisorId = supervisors.find((s) => s.user_id === user.id)?.id ?? null;
                            const selectedEstimatorId =
                              linkEdits[user.id]?.estimatorId !== undefined
                                ? linkEdits[user.id]?.estimatorId ?? null
                                : originalEstimatorId;
                            const selectedSupervisorId =
                              linkEdits[user.id]?.supervisorId !== undefined
                                ? linkEdits[user.id]?.supervisorId ?? null
                                : originalSupervisorId;
                            const changed =
                              currentValue !== user.role ||
                              selectedEstimatorId !== originalEstimatorId ||
                              selectedSupervisorId !== originalSupervisorId;
                            const isSaving = savingUserIds.includes(user.id);
                            return (
                              <tr key={user.id} className={changed ? 'bg-yellow-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {user.name || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <select
                                    value={selectedEstimatorId ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setLinkEdits((prev) => ({
                                        ...prev,
                                        [user.id]: {
                                          ...(prev[user.id] || {}),
                                          estimatorId: val === '' ? null : parseInt(val, 10),
                                        },
                                      }));
                                    }}
                                    disabled={isSaving}
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                                  >
                                    <option value="">None</option>
                                    {estimators.map((est) => (
                                      <option
                                        key={est.id}
                                        value={est.id}
                                        disabled={est.user_id !== null && est.user_id !== user.id}
                                      >
                                        {est.name}
                                        {est.user_id !== null && est.user_id !== user.id ? ' (linked)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <select
                                    value={selectedSupervisorId ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setLinkEdits((prev) => ({
                                        ...prev,
                                        [user.id]: {
                                          ...(prev[user.id] || {}),
                                          supervisorId: val === '' ? null : parseInt(val, 10),
                                        },
                                      }));
                                    }}
                                    disabled={isSaving}
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                                  >
                                    <option value="">None</option>
                                    {supervisors.map((sup) => (
                                      <option
                                        key={sup.id}
                                        value={sup.id}
                                        disabled={sup.user_id !== null && sup.user_id !== user.id}
                                      >
                                        {sup.name}
                                        {sup.user_id !== null && sup.user_id !== user.id ? ' (linked)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-wrap gap-1">
                                      {(user.positions || []).length === 0 ? (
                                        <span className="text-gray-400">—</span>
                                      ) : (
                                        (user.positions || []).map((p) => (
                                          <span
                                            key={p.id}
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                              p.is_primary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                                            }`}
                                            title={p.description || ''}
                                          >
                                            {p.name}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                    <button
                                      onClick={() => openPositionsModal(user)}
                                      disabled={isSaving || positionsLoading}
                                      className={`px-2 py-1 rounded-md border text-xs transition-colors ${
                                        isSaving || positionsLoading
                                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <select
                                    value={currentValue}
                                    onChange={(e) =>
                                      setRoleEdits((prev) => ({
                                        ...prev,
                                        [user.id]: e.target.value as 'viewer' | 'manager' | 'admin',
                                      }))
                                    }
                                    disabled={isSaving}
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
                                  >
                                    <option value="viewer">Viewer</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => saveUserChanges(user)}
                                      disabled={!changed || isSaving}
                                      className={`px-3 py-1 rounded-md text-white text-sm transition-colors ${
                                        !changed || isSaving
                                          ? 'bg-gray-300 cursor-not-allowed'
                                          : 'bg-[var(--primary-color)] hover:opacity-90'
                                      }`}
                                    >
                                      {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  )}
                </div>
                {/* Users pagination */}
                {!usersLoading && !usersError && usersTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {usersTotal === 0 ? 0 : usersStartIdx + 1} to {usersEndIdx} of {usersTotal} users
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUsersPageChange(currentUsersPage - 1, usersTotalPages)}
                        disabled={currentUsersPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        <HiChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentUsersPage} of {usersTotalPages}
                      </span>
                      <button
                        onClick={() => handleUsersPageChange(currentUsersPage + 1, usersTotalPages)}
                        disabled={currentUsersPage === usersTotalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        <HiChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Edit Positions Modal */}
            {editingPositionsUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closePositionsModal} />
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Edit Positions</h3>
                    <p className="text-xs text-gray-500 mt-1">{editingPositionsUser.name || editingPositionsUser.email}</p>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {positionsLoading ? (
                      <p className="text-sm text-gray-500">Loading positions...</p>
                    ) : positionsError ? (
                      <p className="text-sm text-red-500">{positionsError}</p>
                    ) : positions.length === 0 ? (
                      <p className="text-sm text-gray-500">No positions defined yet</p>
                    ) : (
                      <div className="space-y-2">
                        {positions.map((p) => {
                          const checked = modalSelectedPositionIds.includes(p.id);
                          return (
                            <div key={p.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-md">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-[var(--primary-color)] border-gray-300 rounded"
                                  checked={checked}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setModalSelectedPositionIds((prev) =>
                                      isChecked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                                    );
                                    if (!isChecked && modalPrimaryPositionId === p.id) {
                                      setModalPrimaryPositionId(null);
                                    }
                                  }}
                                />
                                <span className="text-sm text-gray-700">{p.name}</span>
                                {p.description ? (
                                  <span className="text-xs text-gray-500">- {p.description}</span>
                                ) : null}
                              </label>
                              <label className="flex items-center gap-2 text-xs text-gray-600">
                                <input
                                  type="radio"
                                  name="modalPrimaryPosition"
                                  disabled={!checked}
                                  checked={modalPrimaryPositionId === p.id}
                                  onChange={() => setModalPrimaryPositionId(p.id)}
                                />
                                Primary
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-2">
                    <button
                      onClick={closePositionsModal}
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePositionsForUser}
                      className={`px-4 py-1.5 rounded-md text-white text-sm ${savingUserIds.includes(editingPositionsUser.id) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[var(--primary-color)] hover:opacity-90'}`}
                      disabled={savingUserIds.includes(editingPositionsUser.id)}
                    >
                      {savingUserIds.includes(editingPositionsUser.id) ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
