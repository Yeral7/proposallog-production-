'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { HiPlus, HiOutlineViewGrid, HiSearch, HiFilter, HiDocumentDuplicate } from "react-icons/hi";
import Banner from "../../components/Banner";
import Header from "../../components/Header";
import ResidentialLogTable, { ResidentialProject, SortField, SortDirection } from "../../components/dashboard/ResidentialLogTable";
import AddProjectModal from "../../components/dashboard/AddProjectModal";
import ImportProjectModal from "../../components/dashboard/ImportProjectModal";

import EditProjectModal from "../../components/dashboard/EditProjectModal";
import FilterProjectsModal, { FilterOptions } from "../../components/dashboard/FilterProjectsModal";
import ProjectDetails from "../../components/dashboard/ProjectDetails";
import UpcomingSchedule from '../../components/dashboard/UpcomingSchedule';
import OngoingResidentialProjects from '../../components/dashboard/OngoingResidentialProjects';

export default function ResidentialLogPage() {
  const [projects, setProjects] = useState<ResidentialProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'schedule', 'ongoing'
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
    // Data fetching is removed. We will use a different table for this.
    setProjects([]); 
    setIsLoading(false);
    setError(null);
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

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const currentProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle sorting
  const handleSort = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  const handleProjectAdded = () => {
    fetchProjects();
  };

  const handleEditProject = (project: ResidentialProject) => {
    // TODO: Implement edit functionality with a new modal
    console.log('Editing project:', project);
  };

  const handleProjectUpdated = () => {
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Residential Log" icon={<HiOutlineViewGrid />} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-full mx-auto">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Residential Log</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 bg-white text-gray-700 rounded-md flex items-center gap-2 shadow-sm hover:bg-gray-50"
              >
                <HiFilter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filter
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
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
                  <ResidentialLogTable 
                    projects={currentProjects}
                    onEdit={handleEditProject}
                    onSort={handleSort}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
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
    </div>
  );
}
