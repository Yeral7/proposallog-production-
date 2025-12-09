'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchWithAuth } from '@/lib/apiClient';
import { HiPlus, HiOutlineViewGrid, HiSearch, HiFilter, HiDocumentDuplicate } from "react-icons/hi";
import Banner from "../../components/Banner";
import Header from "../../components/Header";
import ProposalTable, { Project, SortField, SortDirection } from "../../components/dashboard/ProposalTable";
import AddProjectModal from "../../components/dashboard/AddProjectModal";
import ImportProjectModal from "../../components/dashboard/ImportProjectModal";

import EditProjectModal from "../../components/dashboard/EditProjectModal";
import FilterProjectsModal, { FilterOptions } from "../../components/dashboard/FilterProjectsModal";
import ProjectDetails from "../../components/dashboard/ProjectDetails";
import { useAuth } from "../../contexts/AuthContext";
import { logClientAuditAction } from '@/lib/clientAuditLogger';

export default function ProposalLogPage() {
  const { canEditProjects } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dataChangeDetected, setDataChangeDetected] = useState(false);
  const [lastDataHash, setLastDataHash] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const { canAccessAdmin } = useAuth(); // Use auth context to check admin status
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [exportedProjectData, setExportedProjectData] = useState<Project | null>(null);
  const projectDetailsRef = React.useRef<HTMLDivElement>(null);
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  
  // Pagination and sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [prioritySortCycle, setPrioritySortCycle] = useState(0); // 0: none, 1: Overdue, 2: High, 3: Medium, 4: Low
  const ITEMS_PER_PAGE = 7; // Limit to 7 projects per page
  const [scrollMode, setScrollMode] = useState(false); // Show more: enable scroll with larger viewport

  // Fetch projects when the component mounts and set up auto-refresh
  useEffect(() => {
    fetchProjects();
    
    // Set up auto-refresh interval (every 30 seconds)
    refreshIntervalRef.current = setInterval(() => {
      fetchProjects(true); // true = silent refresh (don't show full loading spinner)
    }, 30000);
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Simple hash function to detect data changes
  const hashData = (data: any[]): string => {
    return data.map(item => item.id + '-' + 
      (item.updated_at || item.submission_date || '')
    ).join('|');
  };

  const fetchProjects = async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetchWithAuth('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      
      // Check if data has changed since last fetch
      const newDataHash = hashData(data);
      if (lastDataHash && newDataHash !== lastDataHash && silent) {
        // Data changed during silent refresh = likely changed by another user
        setDataChangeDetected(true);
        
        // Only show notification to admin users
        if (canAccessAdmin()) {
          setNotification('Projects data was updated');
          setTimeout(() => setNotification(null), 5000); // Clear notification after 5 seconds
        }
      }
      
      setLastDataHash(newDataHash);
      setProjects(data);
      setLastRefreshTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
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

  const filteredProjects = useMemo(() => {
    if (!projects.length) return [];

    let result = [...projects];

    // Apply text search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(project => project.project_name.toLowerCase().includes(searchLower));
    }

    // Apply dropdown filters
    if (filters.builderId) result = result.filter(p => p.builder_id?.toString() === filters.builderId);
    if (filters.estimatorId) result = result.filter(p => p.estimator_id?.toString() === filters.estimatorId);
    if (filters.statusId) result = result.filter(p => p.status_id?.toString() === filters.statusId);
    if (filters.locationId) result = result.filter(p => p.location_id?.toString() === filters.locationId);
    if (filters.priorityId) result = result.filter(p => p.priority_id?.toString() === filters.priorityId);

    if (filters.dueDate) {
      result = result.filter(p => {
        if (!p.due_date) return false;
        const dueDate = new Date(p.due_date);
        const filterDate = new Date(filters.dueDate as string);
        return dueDate <= filterDate;
      });
    }

    // Apply sorting
    if (sortField === 'priority' && prioritySortCycle > 0) {
      const priorityOrder = ['Overdue', 'High', 'Medium', 'Low', 'Not Set', null];
      const topPriorityIndex = prioritySortCycle - 1;
      const rotatedOrder = [...priorityOrder.slice(topPriorityIndex), ...priorityOrder.slice(0, topPriorityIndex)];
      const getSortValue = (priority_name?: string | null): number => {
        const p = priority_name || null;
        const index = rotatedOrder.indexOf(p as any);
        return index === -1 ? rotatedOrder.length : index;
      };
      result.sort((a, b) => getSortValue(a.priority_name) - getSortValue(b.priority_name));
    } else if (sortField && sortDirection) {
      result.sort((a, b) => {
        // Map of sort fields to the actual property names in the Project object
        const fieldToPropMap: Partial<Record<SortField & string, keyof Project>> = {
          location: 'location_name',
          estimator: 'estimator_name',
          status: 'status_label',
        };

        const propName = (sortField && fieldToPropMap[sortField]) || (sortField as keyof Project);

        if (!propName) return 0;

        const aValue = a[propName];
        const bValue = b[propName];

        // Handle nulls and undefined values to sort them at the end
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        // Handle dates
        if (['due_date', 'submission_date', 'follow_up_date'].includes(sortField!)) {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        // Handle strings (case-insensitive)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, undefined, { sensitivity: 'base' })
            : bValue.localeCompare(aValue, undefined, { sensitivity: 'base' });
        }

        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return result;
  }, [projects, searchText, filters, sortField, sortDirection, prioritySortCycle]);

  // Reset page to 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filters, sortField, sortDirection]);

  // Apply pagination to get current page items
  const currentProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, ITEMS_PER_PAGE]);

  // Display projects: in scroll mode show all filtered projects; otherwise current page only
  const displayProjects = useMemo(() => {
    return scrollMode ? filteredProjects : currentProjects;
  }, [scrollMode, filteredProjects, currentProjects]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  }, [filteredProjects, ITEMS_PER_PAGE]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle sorting
  const handleSort = (field: SortField, direction: SortDirection) => {
    if (field === 'priority') {
      const nextCycle = (prioritySortCycle + 1) % 5;
      setPrioritySortCycle(nextCycle);

      if (nextCycle === 0) {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortField('priority');
        setSortDirection('asc'); // Direction doesn't matter for cycle sort
      }
    } else {
      setPrioritySortCycle(0); // Reset priority cycle when sorting other columns
      setSortField(field);
      setSortDirection(direction);
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const handleProjectAdded = async (projectName?: string) => {
    await fetchProjects();
    setDataChangeDetected(false); // Reset change indicator after manual refresh
    
    // Log audit action
    if (projectName) {
      await logClientAuditAction({
        page: 'Proposal Log',
        action: `Added new project: "${projectName}"`
      });
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };
  
  const handleSelectProject = (project: Project) => {
    setDetailsProject(project);
    // Scroll to details section after a short delay to let it render
    setTimeout(() => {
      if (projectDetailsRef.current) {
        projectDetailsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  const handleProjectUpdated = async (projectName?: string, action?: string) => {
    await fetchProjects();
    setDataChangeDetected(false); // Reset change indicator after manual refresh
    
    // Log audit action
    if (projectName) {
      await logClientAuditAction({
        page: 'Proposal Log',
        action: action || `Updated project: "${projectName}"`
      });
    }
  };
  
  // Handle project export
  const handleExportProject = (project: Project) => {
    // Create a copy of the project data for export
    const exportData = {
      ...project,
      // Remove the ID so a new one will be generated when imported
      id: undefined
    };
    
    // Create a JSON string for download
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.project_name.replace(/\s+/g, '_')}_export.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Store the exported project data for potential import
    setExportedProjectData(exportData);
  };

  return (
    <div className="flex flex-col min-h-screen bg-accent">
      <Header />
      <div className="relative">
        <Banner title="Proposal Log" icon={<HiOutlineViewGrid className="w-10 h-10" />} />
      </div>
      
      <main className="flex-1 bg-gray-50 rounded-t-3xl -mt-8 relative z-10 shadow-lg">
        <div className="p-3 sm:p-6 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projects</h1>
              {lastRefreshTime && (
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
                  {dataChangeDetected && canAccessAdmin() && (
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-0">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 shadow-sm hover:bg-gray-50 justify-center"
              >
                <HiFilter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filter
              </button>
              <button 
                onClick={() => {
                  fetchProjects();
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
              {canEditProjects() ? (
                <>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white rounded-md flex items-center gap-2 shadow-sm justify-center"
                  >
                    <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add New
                  </button>
                  <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] text-white rounded-md flex items-center gap-2 shadow-sm justify-center"
                  >
                    <HiDocumentDuplicate className="w-4 h-4 sm:w-5 sm:h-5" />
                    Import
                  </button>
                </>
              ) : (
                <>
                  <button 
                    disabled
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-300 text-gray-500 rounded-md flex items-center gap-2 shadow-sm justify-center cursor-not-allowed"
                    title="View Only - No Add Permission"
                  >
                    <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add New
                  </button>
                  <button 
                    disabled
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-300 text-gray-500 rounded-md flex items-center gap-2 shadow-sm justify-center cursor-not-allowed"
                    title="View Only - No Import Permission"
                  >
                    <HiDocumentDuplicate className="w-4 h-4 sm:w-5 sm:h-5" />
                    Import
                  </button>
                </>
              )}
            </div>
          </div>
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <ProposalTable 
                projects={displayProjects}
                onEdit={handleEditProject}
                onExport={handleExportProject}
                onSelectProject={handleSelectProject}
                selectedProjectId={detailsProject?.id}
                onSort={handleSort}
                sortField={sortField}
                sortDirection={sortDirection}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onShowMore={() => setScrollMode((v) => !v)}
                scrollMode={scrollMode}
              />
              
              {detailsProject && (
                <div ref={projectDetailsRef} className="mt-6 sm:mt-8 bg-white rounded-lg shadow-md p-3 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Project Details: {detailsProject.project_name}
                  </h2>
                  <ProjectDetails project={detailsProject} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      
      {/* Modals */}
      <AddProjectModal 
        isVisible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProjectAdded={handleProjectAdded}
      />
      
      <ImportProjectModal
        isVisible={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onProjectImported={handleProjectAdded}
        initialProjectData={exportedProjectData}
      />
      
      <EditProjectModal
        isVisible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={selectedProject}
        onProjectUpdated={handleProjectUpdated}
      />
      
      <FilterProjectsModal
        isVisible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={(newFilters) => setFilters(newFilters)}
        currentFilters={filters}
      />
    </div>
  );
}
