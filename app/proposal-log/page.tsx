'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { HiPlus, HiOutlineViewGrid, HiSearch, HiFilter, HiDocumentDuplicate } from "react-icons/hi";
import Banner from "../../components/Banner";
import Header from "../../components/Header";
import ProposalTable, { Project, SortField, SortDirection } from "../../components/dashboard/ProposalTable";
import AddProjectModal from "../../components/dashboard/AddProjectModal";
import ImportProjectModal from "../../components/dashboard/ImportProjectModal";

import EditProjectModal from "../../components/dashboard/EditProjectModal";
import FilterProjectsModal, { FilterOptions } from "../../components/dashboard/FilterProjectsModal";
import ProjectDetails from "../../components/dashboard/ProjectDetails";

export default function ProposalLogPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [prioritySortCycle, setPrioritySortCycle] = useState(0); // 0: none, 1: Overdue, 2: High, 3: Medium, 4: Low
  const ITEMS_PER_PAGE = 7; // Limit to 7 projects per page

  // Fetch projects when the component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
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
    if (filters.supervisorId) result = result.filter(p => p.supervisor_id?.toString() === filters.supervisorId);
    if (filters.statusId) result = result.filter(p => p.status_id?.toString() === filters.statusId);
    if (filters.locationId) result = result.filter(p => p.location_id?.toString() === filters.locationId);

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
      const priorityOrder = ['Overdue', 'High', 'Medium', 'Low', null];
      const topPriorityIndex = prioritySortCycle - 1;
      const rotatedOrder = [...priorityOrder.slice(topPriorityIndex), ...priorityOrder.slice(0, topPriorityIndex)];
      const getSortValue = (priority?: string | null): number => {
        const p = priority || null;
        const index = rotatedOrder.indexOf(p as any);
        return index === -1 ? rotatedOrder.length : index;
      };
      result.sort((a, b) => getSortValue(a.priority) - getSortValue(b.priority));
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

  const handleProjectAdded = () => {
    fetchProjects();
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
  
  const handleProjectUpdated = () => {
    fetchProjects();
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projects</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-0">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-white border border-gray-300 text-gray-700 rounded-md flex items-center gap-2 shadow-sm hover:bg-gray-50 justify-center"
              >
                <HiFilter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filter
              </button>
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
                projects={currentProjects}
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
