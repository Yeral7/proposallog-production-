'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Banner from '../../components/Banner';
import { HiOutlineClipboardList, HiOutlineCog, HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import AddOngoingProjectModal from '../../components/dashboard/AddOngoingProjectModal';
import EditOngoingProjectModal from '../../components/dashboard/EditOngoingProjectModal';
import { toast } from 'react-toastify';

const ProjectsOngoingPage = () => {
  // State for data refresh mechanism
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dataChangeDetected, setDataChangeDetected] = useState(false);
  const [lastDataHash, setLastDataHash] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [ongoingProjects, setOngoingProjects] = useState<any[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<any>(null);
  const { canAccessAdmin, canEditProjects } = useAuth(); // Use auth context to check admin status

  // Set up auto-refresh on component mount
  useEffect(() => {
    // Initial fetch when component mounts
    fetchOngoingProjects(false);
    
    // Set up interval for regular silent refreshes
    refreshIntervalRef.current = setInterval(() => {
      fetchOngoingProjects(true);
    }, 30000); // Refresh every 30 seconds
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Simple hash function to detect data changes
  const hashData = (data: any[]): string => {
    return data.map(item => item.ongoing_id + '-' + 
      (item.updated_at || '')
    ).join('|');
  };

  // Fetch ongoing projects
  const fetchOngoingProjects = async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetchWithAuth('/api/projects/ongoing');
      if (!response.ok) throw new Error('Failed to fetch ongoing projects');
      const data = await response.json();
      
      // Check if data has changed since last fetch
      const newDataHash = hashData(data);
      if (lastDataHash && newDataHash !== lastDataHash && silent) {
        setDataChangeDetected(true);
        // Only show notification to admin users
        if (canAccessAdmin()) {
          setNotification('Projects data was updated');
          setTimeout(() => setNotification(null), 5000);
        }
      }
      
      setLastDataHash(newDataHash);
      setOngoingProjects(data);
      setLastRefreshTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching ongoing projects:', err);
      if (!silent) {
        setError('Failed to load projects. Please try again.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      } 
      setIsRefreshing(false);
    }
  };

  // Handle successful project addition
  const handleProjectAdded = () => {
    fetchOngoingProjects(false);
  };

  // Handle edit project
  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setIsEditModalVisible(true);
  };

  // Handle successful project update
  const handleProjectUpdated = () => {
    fetchOngoingProjects(false);
    setIsEditModalVisible(false);
    setSelectedProject(null);
  };

  // Handle delete project
  const handleDeleteProject = async (project: any) => {
    if (!window.confirm(`Are you sure you want to delete the ongoing project "${project.projects?.project_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/projects/ongoing?id=${project.ongoing_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Ongoing project deleted successfully!');
        fetchOngoingProjects(false);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete project: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Projects Ongoing" icon={<HiOutlineClipboardList />} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col">
          {/* Header with refresh controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ongoing Projects</h1>
              {lastRefreshTime && (
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
                  {dataChangeDetected && (
                    <span className="ml-2 text-green-600 font-medium">• Data updated</span>
                  )}
                  {isRefreshing && (
                    <span className="ml-2 inline-block">
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500"></div>
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              {/* Add New Project button */}
              {canEditProjects() && (
                <button
                  onClick={() => setIsAddModalVisible(true)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-[var(--primary-color)] text-white rounded-md flex items-center gap-2 shadow-sm hover:bg-[var(--secondary-color)] justify-center"
                >
                  <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add New Project
                </button>
              )}
              
              {/* Refresh button */}
              <button
                onClick={() => {
                  fetchOngoingProjects();
                  setDataChangeDetected(false);
                }}
                disabled={isLoading}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base ${dataChangeDetected ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'} text-gray-700 rounded-md flex items-center gap-2 shadow-sm hover:bg-gray-50 justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {/* Projects Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading ongoing projects...</p>
              </div>
            </div>
          ) : ongoingProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-center">
                <HiOutlineClipboardList className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Ongoing Projects
                </h3>
                <p className="text-gray-500 max-w-md mb-4">
                  There are currently no ongoing projects. Add awarded projects from the proposal log to get started.
                </p>
                {canEditProjects() && (
                  <button
                    onClick={() => setIsAddModalVisible(true)}
                    className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md hover:bg-[var(--secondary-color)] flex items-center gap-2 mx-auto"
                  >
                    <HiPlus className="w-5 h-5" />
                    Add First Project
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      {canEditProjects() && (
                        <th className="py-4 px-4 text-left w-24">Actions</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Builder</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Contract Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Type/Style</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Managers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Timeline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ongoingProjects.map((project) => (
                      <tr 
                        key={project.ongoing_id} 
                        className="hover:bg-gray-50"
                      >
                        {canEditProjects() && (
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleEditProject(project)}
                              className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                              title="Edit project"
                            >
                              <HiPencil className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                            <div className="text-sm text-gray-500">{project.status_label}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.builder_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                          {project.contract_value ? `$${Number(project.contract_value).toLocaleString()}` : 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">{project.project_type}</div>
                          <div className="text-sm text-gray-500">{project.project_style}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 mb-2">{project.progress_status}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(project.percent_complete || 0, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{project.percent_complete || 0}% complete</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">PM: {project.project_manager_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">FM: {project.field_manager_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Start: {project.planned_start_date ? new Date(project.planned_start_date).toLocaleDateString() : 'TBD'}
                          </div>
                          <div className="text-sm text-gray-500">
                            End: {project.planned_end_date ? new Date(project.planned_end_date).toLocaleDateString() : 'TBD'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.exact_address}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Notification toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{notification}</span>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-4 text-green-700 hover:text-green-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Add New Project Modal */}
      <AddOngoingProjectModal
        isVisible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onProjectAdded={handleProjectAdded}
      />

      {/* Edit Project Modal */}
      <EditOngoingProjectModal
        isVisible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setSelectedProject(null);
        }}
        onProjectUpdated={handleProjectUpdated}
        onProjectDeleted={() => setNotification('Project deleted successfully')}
        project={selectedProject}
      />
    </div>
  );
};

export default ProjectsOngoingPage;
