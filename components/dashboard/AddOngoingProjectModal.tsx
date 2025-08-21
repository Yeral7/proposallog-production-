'use client';

import React, { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

interface AwardedProject {
  id: number;
  project_name: string;
}

interface User {
  id: number;
  name: string;
}

interface ProjectType {
  id: number;
  name: string;
}

interface ProjectStyle {
  id: number;
  name: string;
}

interface ProgressStatus {
  id: number;
  name: string;
}

interface AddOngoingProjectModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProjectAdded: () => void;
}

export default function AddOngoingProjectModal({ isVisible, onClose, onProjectAdded }: AddOngoingProjectModalProps) {
  const [awardedProjects, setAwardedProjects] = useState<AwardedProject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [projectStyles, setProjectStyles] = useState<ProjectStyle[]>([]);
  const [progressStatuses, setProgressStatuses] = useState<ProgressStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectStyle, setProjectStyle] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('');
  const [fieldManagerId, setFieldManagerId] = useState('');
  const [progressStatus, setProgressStatus] = useState('');

  // Default fallback options (in case API fails)
  const defaultProjectTypes = ['Commercial', 'Residential', 'Industrial', 'Infrastructure', 'Renovation', 'New Construction'];
  const defaultProjectStyles = ['Traditional', 'Modern', 'Contemporary', 'Industrial', 'Mixed-Use', 'Custom'];
  const defaultProgressStatuses = ['N/A', 'Planning', 'In Progress', 'On Hold', 'Delayed', 'Nearly Complete'];

  // Fetch data when modal opens
  useEffect(() => {
    if (isVisible) {
      fetchData();
    }
  }, [isVisible]);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch awarded projects that aren't already ongoing
      const projectsResponse = await fetchWithAuth('/api/projects/awarded');
      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch awarded projects');
      }
      const projects = await projectsResponse.json();
      setAwardedProjects(projects);

      // Fetch users for project/field managers
      const usersResponse = await fetchWithAuth('/api/users');
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Fetch project types
      const projectTypesResponse = await fetchWithAuth('/api/project-types');
      if (projectTypesResponse.ok) {
        const typesData = await projectTypesResponse.json();
        setProjectTypes(typesData);
      } else {
        // Use defaults if API fails
        setProjectTypes(defaultProjectTypes.map((type, index) => ({ id: index + 1, name: type })));
      }

      // Fetch project styles
      const projectStylesResponse = await fetchWithAuth('/api/project-styles');
      if (projectStylesResponse.ok) {
        const stylesData = await projectStylesResponse.json();
        setProjectStyles(stylesData);
      } else {
        // Use defaults if API fails
        setProjectStyles(defaultProjectStyles.map((style, index) => ({ id: index + 1, name: style })));
      }

      // Fetch progress statuses
      const progressStatusesResponse = await fetchWithAuth('/api/progress-statuses');
      if (progressStatusesResponse.ok) {
        const statusesData = await progressStatusesResponse.json();
        setProgressStatuses(statusesData);
      } else {
        // Use defaults if API fails
        setProgressStatuses(defaultProgressStatuses.map((status, index) => ({ id: index + 1, name: status })));
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load form data. Please try again.');
      
      // Set defaults on error
      setProjectTypes(defaultProjectTypes.map((type, index) => ({ id: index + 1, name: type })));
      setProjectStyles(defaultProjectStyles.map((style, index) => ({ id: index + 1, name: style })));
      setProgressStatuses(defaultProgressStatuses.map((status, index) => ({ id: index + 1, name: status })));
    }
  };

  // Reset form fields
  const resetForm = () => {
    setSelectedProjectId('');
    setProjectType('');
    setProjectStyle('');
    setPlannedStartDate('');
    setPlannedEndDate('');
    setExactAddress('');
    setProjectManagerId('');
    setFieldManagerId('');
    setProgressStatus('N/A');
  };

  // Reset when modal closes
  useEffect(() => {
    if (!isVisible) {
      resetForm();
      setError(null);
    }
  }, [isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!selectedProjectId || !projectType || !projectStyle || !exactAddress || !fieldManagerId) {
      setError('Please fill in all required fields: Project, Project Type, Project Style, Exact Address, and Field Manager.');
      return;
    }

    setLoading(true);

    const ongoingProjectData = {
      project_id: parseInt(selectedProjectId),
      project_type: projectType,
      project_style: projectStyle,
      planned_start_date: plannedStartDate || null,
      planned_end_date: plannedEndDate || null,
      exact_address: exactAddress,
      project_manager_id: projectManagerId ? parseInt(projectManagerId) : null,
      field_manager_id: parseInt(fieldManagerId),
      progress_status: progressStatus || 'N/A',
      percent_complete: 0 // Default to 0%
    };

    try {
      const response = await fetchWithAuth('/api/projects/ongoing', {
        method: 'POST',
        body: JSON.stringify(ongoingProjectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add ongoing project');
      }

      const selectedProject = awardedProjects.find(p => p.id === parseInt(selectedProjectId));
      toast.success(`Project "${selectedProject?.project_name}" added to ongoing projects successfully.`);
      resetForm();
      onProjectAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 bg-[var(--header-gray)] text-white p-4 rounded-t shadow-sm -mt-6 -mx-6">
            <h2 className="text-xl font-bold">Add Ongoing Project</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Selection */}
              <div className="md:col-span-2">
                <label htmlFor="selectedProject" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Awarded Project <span className="text-red-500">*</span>
                </label>
                <select
                  id="selectedProject"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="">Select an awarded project</option>
                  {awardedProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
                {awardedProjects.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    No awarded projects available. All awarded projects may already be ongoing.
                  </p>
                )}
              </div>

              {/* Project Type */}
              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="projectType"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="">Select project type</option>
                  {projectTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Style */}
              <div>
                <label htmlFor="projectStyle" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Style <span className="text-red-500">*</span>
                </label>
                <select
                  id="projectStyle"
                  value={projectStyle}
                  onChange={(e) => setProjectStyle(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="">Select project style</option>
                  {projectStyles.map((style) => (
                    <option key={style.id} value={style.name}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Planned Start Date */}
              <div>
                <label htmlFor="plannedStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Planned Start Date
                </label>
                <input
                  type="date"
                  id="plannedStartDate"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Planned End Date */}
              <div>
                <label htmlFor="plannedEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Planned End Date
                </label>
                <input
                  type="date"
                  id="plannedEndDate"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Exact Address */}
              <div className="md:col-span-2">
                <label htmlFor="exactAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Exact Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="exactAddress"
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Enter the exact project address"
                  required
                />
              </div>

              {/* Project Manager */}
              <div>
                <label htmlFor="projectManager" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Manager
                </label>
                <select
                  id="projectManager"
                  value={projectManagerId}
                  onChange={(e) => setProjectManagerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Select project manager (optional)</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field Manager */}
              <div>
                <label htmlFor="fieldManager" className="block text-sm font-medium text-gray-700 mb-1">
                  Field Manager <span className="text-red-500">*</span>
                </label>
                <select
                  id="fieldManager"
                  value={fieldManagerId}
                  onChange={(e) => setFieldManagerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="">Select field manager</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress Status */}
              <div className="md:col-span-2">
                <label htmlFor="progressStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Progress Status
                </label>
                <select
                  id="progressStatus"
                  value={progressStatus}
                  onChange={(e) => setProgressStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  {progressStatuses.map((status) => (
                    <option key={status.id} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-[var(--accent-gray)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || awardedProjects.length === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Ongoing Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
