import React from 'react';
import { HiPencil, HiChevronUp, HiChevronDown, HiSelector, HiDocumentDuplicate, HiLink } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';

// Define the type for a single project, including the joined data
export interface Project {
  id: number;
  project_name: string;
  builder_id: number;
  builder_name: string;
  estimator_id: number;
  estimator_name: string;
  supervisor_id: number | null;
  supervisor_name: string | null;
  status_id: number;
  status_label: string;
  status_name: string;
  lost_reason: string | null;
  location_id: number | null;
  location_name: string | null;
  due_date: string | null;
  submission_date: string | null;
  follow_up_date: string | null;
  contract_value: number | null;
  reference_project_id?: number | null;
  priority_id: number | null;
  priority_name: string | null;
}

export type SortDirection = 'asc' | 'desc' | null;
export type SortField = 'project_name' | 'builder_name' | 'location' | 'due_date' | 'estimator' | 'priority' | 'status' | 'submission_date' | 'contract_value' | 'follow_up_date' | null;

interface ProposalTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onExport?: (project: Project) => void;
  onSelectProject?: (project: Project) => void;
  selectedProjectId?: number;
  onSort?: (field: SortField, direction: SortDirection) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onShowMore?: () => void;
  scrollMode?: boolean;
}

const ProposalTable: React.FC<ProposalTableProps> = ({ 
  projects, 
  onEdit, 
  onExport = () => {},
  onSelectProject, 
  selectedProjectId,
  onSort = () => {},
  sortField = null,
  sortDirection = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  onShowMore = () => {},
  scrollMode = false
}) => {
  const { canEditProjects } = useAuth();
  
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = 'asc';

    if (sortField === field) {
      if (field === 'due_date') {
        // For due_date, toggle only between earliest (asc) and latest (desc)
        newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        if (sortDirection === 'asc') newDirection = 'desc';
        else if (sortDirection === 'desc') newDirection = null;
        else newDirection = 'asc';
      }
    }

    onSort(field, newDirection);
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <HiSelector className="w-4 h-4 ml-1 text-gray-400" />;
    if (sortDirection === 'asc') return <HiChevronUp className="w-4 h-4 ml-1 text-blue-600" />;
    if (sortDirection === 'desc') return <HiChevronDown className="w-4 h-4 ml-1 text-blue-600" />;
    return <HiSelector className="w-4 h-4 ml-1 text-gray-400" />;
  };
  const getPriorityColor = (priority_name?: string | null): string => {
    switch (priority_name) {
      case 'Overdue':
        return 'text-red-700 font-semibold';
      case 'High':
        return 'text-red-500 font-semibold';
      case 'Medium':
        return 'text-yellow-600 font-semibold';
      case 'Low':
        return 'text-green-600 font-semibold';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusColor = (status_label?: string | null): string => {
    if (status_label && status_label.toLowerCase() === 'awarded') {
      return 'text-yellow-700 font-semibold';
    }
    return 'text-gray-800';
  };

  return (
    <div>
      <div className={`overflow-x-auto ${scrollMode ? 'max-h-[640px] overflow-y-auto' : ''}`}>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-4 px-4 text-left w-24">Actions</th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('project_name')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Project Name
                  {renderSortIcon('project_name')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('builder_name')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Builder
                  {renderSortIcon('builder_name')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('location')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Location
                  {renderSortIcon('location')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('due_date')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Due Date
                  {renderSortIcon('due_date')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('estimator')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Estimator
                  {renderSortIcon('estimator')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('priority')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Priority
                  {renderSortIcon('priority')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('status')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Status
                  {renderSortIcon('status')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('submission_date')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Submission Date
                  {renderSortIcon('submission_date')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('contract_value')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Contract Value
                  {renderSortIcon('contract_value')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('follow_up_date')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Follow-up Date
                  {renderSortIcon('follow_up_date')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr 
                key={project.id} 
                className={`group border-b border-gray-200 ${selectedProjectId === project.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    {canEditProjects() ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                          className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                          title="Edit Project"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onExport(project); }}
                          className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                          title="Export Project"
                        >
                          <HiDocumentDuplicate className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          disabled
                          className="p-1 bg-gray-100 rounded-md text-gray-400 cursor-not-allowed"
                          title="View Only - No Edit Permission"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          disabled
                          className="p-1 bg-gray-100 rounded-md text-gray-400 cursor-not-allowed"
                          title="View Only - No Export Permission"
                        >
                          <HiDocumentDuplicate className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 cursor-pointer" onClick={() => onSelectProject && onSelectProject(project)}>
                  <div className="flex items-center">
                    {project.reference_project_id && (
                      <span title="Multiple builder project" className="mr-2">
                        <HiLink className="w-4 h-4 text-gray-500" />
                      </span>
                    )}
                    <span className="font-medium text-gray-800">{project.project_name}</span>
                  </div>
                </td>
                <td className="py-4 px-4">{project.builder_name}</td>
                <td className="py-4 px-4">{project.location_name || 'N/A'}</td>
                <td className="py-4 px-4">
                  {project.due_date && project.due_date.trim() 
                    ? (() => {
                        const date = new Date(project.due_date);
                        if (isNaN(date.getTime())) return 'Invalid Date';
                        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(date);
                      })()
                    : 'N/A'}
                </td>
                <td className="py-4 px-4">{project.estimator_name}</td>
                <td className={`py-4 px-4 ${getPriorityColor(project.priority_name)}`}>
                  {project.priority_name || 'N/A'}
                </td>
                <td className={`py-4 px-4 ${getStatusColor(project.status_label)}`}>{project.status_label}</td>
                <td className="py-4 px-4">
                  {project.submission_date && project.submission_date.trim() 
                    ? (() => {
                        const date = new Date(project.submission_date);
                        if (isNaN(date.getTime())) return 'Invalid Date';
                        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(date);
                      })()
                    : 'N/A'}
                </td>
                <td className="py-4 px-4">
                  {project.contract_value ? `$${Number(project.contract_value).toLocaleString()}` : 'N/A'}
                </td>
                <td className="py-4 px-4">
                  {project.follow_up_date && project.follow_up_date.trim() 
                    ? (() => {
                        const date = new Date(project.follow_up_date);
                        if (isNaN(date.getTime())) return 'Invalid Date';
                        return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(date);
                      })()
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!scrollMode && totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center px-2">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`px-3 py-1 border rounded-md ${currentPage <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
            >
              Previous
            </button>
            <button 
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 border rounded-md ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
            >
              Next
            </button>
            <button
              onClick={onShowMore}
              className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 text-gray-700"
              title={scrollMode ? 'Collapse to default view' : 'Show more and enable scrolling'}
            >
              {scrollMode ? 'Collapse' : 'Show more'}
            </button>
          </div>
        </div>
      )}
      {scrollMode && (
        <div className="mt-4 flex justify-end px-2">
          <button
            onClick={onShowMore}
            className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 text-gray-700"
            title="Collapse to default view"
          >
            Collapse
          </button>
        </div>
      )}
      {totalPages <= 1 && (
        <div className="mt-4 flex justify-end px-2">
          <button
            onClick={onShowMore}
            className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 text-gray-700"
            title={scrollMode ? 'Collapse to default view' : 'Show more and enable scrolling'}
          >
            {scrollMode ? 'Collapse' : 'Show more'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProposalTable;
