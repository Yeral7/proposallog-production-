import React from 'react';
import { HiPencil, HiTrash, HiChevronUp, HiChevronDown, HiSelector } from 'react-icons/hi';

// Define the type for a single project, including the joined data
export interface ResidentialProject {
  id: number;
  project_name: string;
  builder: { id: number; name: string } | null;
  subcontractor_id: number | null;
  subcontractor: { id: number; name: string } | null;
  start_date: string | null;
  est_completion_date: string | null;
  contract_value: number | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export type SortDirection = 'asc' | 'desc' | null;
export type SortField = 'project_name' | 'builder' | 'subcontractor' | 'start_date' | 'est_completion_date' | 'contract_value' | 'status' | null;

interface ResidentialLogTableProps {
  projects: ResidentialProject[];
  onEdit: (project: ResidentialProject) => void;
  onDelete: (project: ResidentialProject) => void;
  onSort?: (field: SortField, direction: SortDirection) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const ResidentialLogTable: React.FC<ResidentialLogTableProps> = ({ 
  projects, 
  onEdit, 
  onDelete,
  onSort = () => {},
  sortField = null,
  sortDirection = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {}
}) => {
  
  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = 'asc';
    
    if (sortField === field) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = null;
      else newDirection = 'asc';
    }
    
    onSort(field, newDirection);
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <HiSelector className="w-4 h-4 ml-1 text-gray-400" />;
    if (sortDirection === 'asc') return <HiChevronUp className="w-4 h-4 ml-1 text-blue-600" />;
    if (sortDirection === 'desc') return <HiChevronDown className="w-4 h-4 ml-1 text-blue-600" />;
    return <HiSelector className="w-4 h-4 ml-1 text-gray-400" />;
  };

  return (
    <div>
      <div className="overflow-x-auto">
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
                <button onClick={() => handleSort('builder')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Builder
                  {renderSortIcon('builder')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('subcontractor')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Subcontractor
                  {renderSortIcon('subcontractor')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('start_date')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Start Date
                  {renderSortIcon('start_date')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('est_completion_date')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Est. Completion Date
                  {renderSortIcon('est_completion_date')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('contract_value')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Contract Value
                  {renderSortIcon('contract_value')}
                </button>
              </th>
              <th className="py-4 px-4 text-left">
                <button onClick={() => handleSort('status')} className="flex items-center hover:text-blue-500 focus:outline-none">
                  Status
                  {renderSortIcon('status')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onEdit(project)}
                      className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                      title="Edit Project"
                    >
                      <HiPencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(project)}
                      className="p-1 bg-red-200 rounded-md text-red-600 hover:bg-red-300"
                      title="Delete Project"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="font-medium text-gray-800">{project.project_name}</span>
                </td>
                <td className="py-4 px-4">{project.builder?.name || 'N/A'}</td>
                <td className="py-4 px-4">{project.subcontractor?.name || 'N/A'}</td>
                <td className="py-4 px-4">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-4 px-4">
                  {project.est_completion_date ? new Date(project.est_completion_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-4 px-4">
                  {project.contract_value ? `$${Number(project.contract_value).toLocaleString()}` : 'N/A'}
                </td>
                <td className="py-4 px-4">{project.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentialLogTable;
