'use client';

import React, { useState, useEffect } from 'react';
import { HiOutlineShieldCheck, HiSearch, HiChevronLeft, HiChevronRight, HiRefresh } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import { fetchWithAuth } from '@/lib/apiClient';
import { formatAuditTimeToCharlotte } from '@/lib/timezone';
import Banner from '../../components/Banner';
import Header from '../../components/Header';
import ProtectedRoute from '../../components/ProtectedRoute';

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

const AdminPage = () => {
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

  const formatDate = (dateString: string) => {
    return formatAuditTimeToCharlotte(dateString);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          <Banner title="Admin & Audit" icon={<HiOutlineShieldCheck />} />
          
          <div className="mt-8">
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
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
