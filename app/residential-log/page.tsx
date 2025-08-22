'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HiPlus, HiOutlineViewGrid, HiSearch, HiFilter, HiDocumentDuplicate, HiX } from "react-icons/hi";
import Banner from "../../components/Banner";
import Header from "../../components/Header";
import ResidentialLogTable, { ResidentialProject, SortField, SortDirection } from "../../components/dashboard/ResidentialLogTable";
import AddProjectModal from "../../components/dashboard/AddProjectModal";
import ImportProjectModal from "../../components/dashboard/ImportProjectModal";

import FilterProjectsModal, { FilterOptions } from "../../components/dashboard/FilterProjectsModal";
import EditResidentialProjectModal from "../../components/dashboard/EditResidentialProjectModal";
import UpcomingSchedule from '../../components/dashboard/UpcomingSchedule';
import OngoingResidentialProjects from '../../components/dashboard/OngoingResidentialProjects';
import AddResidentialProjectModal from "../../components/dashboard/AddResidentialProjectModal";
import { fetchWithAuth } from '../../lib/apiClient';
import { toast } from 'react-toastify';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

export default function ResidentialLogPage() {
  const [projects, setProjects] = useState<ResidentialProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Modal states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'schedule', 'ongoing'
  const [selectedProject, setSelectedProject] = useState<ResidentialProject | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ResidentialProject | null>(null);
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [prioritySortCycle, setPrioritySortCycle] = useState(0); // 0: none, 1: Overdue, 2: High, 3: Medium, 4: Low
  // Removed pagination limit to allow full scrollable list

  // Fetch projects when the component mounts and set up auto-refresh
  useEffect(() => {
    fetchProjects();
    
    // Set up auto-refresh interval (every 30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      fetchProjects(true); // silent refresh
    }, 30000);
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchProjects = async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/residential-projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects(data || []);
      setLastRefreshTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching residential projects:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!projects.length) return [];

    let result = [...projects];

    // Apply text search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(project => project.project_name.toLowerCase().includes(searchLower));
    }

    // Note: Advanced filtering logic removed as it's not applicable to the new data structure.

    return result;
  }, [projects, searchText, filters, sortField, sortDirection, prioritySortCycle]);

  

  // Handle sorting
  const handleSort = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleProjectAdded = () => {
    fetchProjects();
  };

  const handleEditProject = (project: ResidentialProject) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleProjectUpdated = () => {
    fetchProjects();
    setIsEditModalOpen(false);
  };

  const handleDeleteProject = (project: ResidentialProject) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      const response = await fetchWithAuth(`/api/residential-projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      toast.success(`Project "${projectToDelete.project_name}" deleted successfully.`);
      fetchProjects(); // Refresh the list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error(message);
      setError(message);
    } finally {
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Residential" icon={<HiOutlineViewGrid />} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Residential Log</h1>
              {lastRefreshTime && (
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
                  {isRefreshing && (
                    <span className="ml-2 inline-block">
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-gray-600"></div>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white rounded-md flex items-center gap-2 shadow-sm justify-center"
              >
                <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add Project
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 bg-white text-gray-700 rounded-md flex items-center gap-2 shadow-sm hover:bg-gray-50"
              >
                <HiFilter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filter
              </button>
              <button 
                onClick={() => fetchProjects()}
                disabled={isLoading}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 shadow-sm hover:bg-gray-50 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>

            </div>
          </div>
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('all')}
                className={`${activeTab === 'all' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                All Projects
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`${activeTab === 'schedule' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Upcoming Schedule
              </button>
              <button
                onClick={() => setActiveTab('ongoing')}
                className={`${activeTab === 'ongoing' ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Ongoing Projects
              </button>
            </nav>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
            </div>
          ) : (
            <div>
              {activeTab === 'all' && (
                <>
                  <div className="mb-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                      <HiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search projects by name..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="block w-full pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:border-gray-500 focus:ring-0 text-sm"
                    />
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    <ResidentialLogTable 
                      projects={filteredProjects}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                      onSort={handleSort}
                      sortField={sortField}
                      sortDirection={sortDirection}
                    />
                  </div>
                </>
              )}
              {activeTab === 'schedule' && <UpcomingSchedule />}
              {activeTab === 'ongoing' && <OngoingResidentialProjects />}
            </div>
          )}
        </div>
      </main>
      
      {/* Modals */}
      
      <FilterProjectsModal
        isVisible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        currentFilters={filters}
      />

      <AddResidentialProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProjectAdded={handleProjectAdded}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Residential Project"
        message={`Are you sure you want to delete the project "${projectToDelete?.project_name}"? This action cannot be undone.`}
        loading={isLoading}
      />

      <EditResidentialProjectModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProjectUpdated={handleProjectUpdated}
        project={selectedProject}
      />
    </div>
  );
}
