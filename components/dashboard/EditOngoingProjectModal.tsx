'use client';

import React, { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '@/lib/apiClient';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

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

interface OngoingProject {
  ongoing_id: number;
  project_type_id?: number;
  project_style_id?: number;
  progress_status_id?: number;
  planned_start_date?: string;
  planned_end_date?: string;
  exact_address?: string;
  project_manager_id?: number;
  field_manager_id?: number;
  percent_complete?: number;
  project_types?: { id: number; name: string };
  project_styles?: { id: number; name: string };
  progress_statuses?: { id: number; name: string };
  field_manager?: { id: number; name: string };
  project_manager?: { id: number; name: string };
}

interface EditOngoingProjectModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
  onProjectDeleted?: () => void;
  project: OngoingProject | null;
}

export default function EditOngoingProjectModal({ 
  isVisible, 
  onClose, 
  onProjectUpdated, 
  onProjectDeleted,
  project 
}: EditOngoingProjectModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [projectStyles, setProjectStyles] = useState<ProjectStyle[]>([]);
  const [progressStatuses, setProgressStatuses] = useState<ProgressStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Form state
  const [projectTypeId, setProjectTypeId] = useState('');
  const [projectStyleId, setProjectStyleId] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('');
  const [fieldManagerId, setFieldManagerId] = useState('');
  const [progressStatusId, setProgressStatusId] = useState('');
  const [percentComplete, setPercentComplete] = useState('');

  // Fetch data when modal opens
  useEffect(() => {
    if (isVisible) {
      fetchData();
    }
  }, [isVisible]);

  // Populate form when project changes
  useEffect(() => {
    if (project) {
      setProjectTypeId(project.project_type_id?.toString() || '');
      setProjectStyleId(project.project_style_id?.toString() || '');
      setProgressStatusId(project.progress_status_id?.toString() || '');
      setPlannedStartDate(project.planned_start_date || '');
      setPlannedEndDate(project.planned_end_date || '');
      setExactAddress(project.exact_address || '');
      setProjectManagerId(project.project_manager_id?.toString() || '');
      setFieldManagerId(project.field_manager_id?.toString() || '');
      setPercentComplete(project.percent_complete?.toString() || '0');
    }
  }, [project]);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch users for project/field managers
      const usersResponse = await fetchWithAuth('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Fetch project types
      const projectTypesResponse = await fetchWithAuth('/api/project-types');
      if (projectTypesResponse.ok) {
        const typesData = await projectTypesResponse.json();
        setProjectTypes(typesData);
      }

      // Fetch project styles
      const projectStylesResponse = await fetchWithAuth('/api/project-styles');
      if (projectStylesResponse.ok) {
        const stylesData = await projectStylesResponse.json();
        setProjectStyles(stylesData);
      }

      // Fetch progress statuses
      const progressStatusesResponse = await fetchWithAuth('/api/progress-statuses');
      if (progressStatusesResponse.ok) {
        const statusesData = await progressStatusesResponse.json();
        setProgressStatuses(statusesData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load form data. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/projects/ongoing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ongoing_id: project.ongoing_id,
          project_type_id: projectTypeId ? parseInt(projectTypeId) : null,
          project_style_id: projectStyleId ? parseInt(projectStyleId) : null,
          progress_status_id: progressStatusId ? parseInt(progressStatusId) : null,
          planned_start_date: plannedStartDate || null,
          planned_end_date: plannedEndDate || null,
          exact_address: exactAddress,
          project_manager_id: projectManagerId ? parseInt(projectManagerId) : null,
          field_manager_id: fieldManagerId ? parseInt(fieldManagerId) : null,
          percent_complete: percentComplete ? parseInt(percentComplete) : 0
        }),
      });

      if (response.ok) {
        onProjectUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setError('An error occurred while updating the project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    setConfirmOpen(true);
  };

  const confirmDelete = async (ongoingId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/projects/ongoing?id=${ongoingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Project deleted successfully');
        if (onProjectDeleted) onProjectDeleted();
        onProjectUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete project');
        setError(errorData.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('An error occurred while deleting the project');
      setError('An error occurred while deleting the project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectTypeId('');
    setProjectStyleId('');
    setProgressStatusId('');
    setPlannedStartDate('');
    setPlannedEndDate('');
    setExactAddress('');
    setProjectManagerId('');
    setFieldManagerId('');
    setPercentComplete('0');
  };

  useEffect(() => {
    if (!isVisible) {
      resetForm();
      setError(null);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Ongoing Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Type */}
              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select
                  id="projectType"
                  value={projectTypeId}
                  onChange={(e) => setProjectTypeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Select project type</option>
                  {projectTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Style */}
              <div>
                <label htmlFor="projectStyle" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Style
                </label>
                <select
                  id="projectStyle"
                  value={projectStyleId}
                  onChange={(e) => setProjectStyleId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Select project style</option>
                  {projectStyles.map((style) => (
                    <option key={style.id} value={style.id}>
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
              <div>
                <label htmlFor="progressStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Progress Status
                </label>
                <select
                  id="progressStatus"
                  value={progressStatusId}
                  onChange={(e) => setProgressStatusId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="">Select progress status</option>
                  {progressStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Percent Complete */}
              <div>
                <label htmlFor="percentComplete" className="block text-sm font-medium text-gray-700 mb-1">
                  Percent Complete (%)
                </label>
                <input
                  type="number"
                  id="percentComplete"
                  min="0"
                  max="100"
                  value={percentComplete}
                  onChange={(e) => setPercentComplete(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="0"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={async () => await handleDelete()}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Project'}
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (project) {
            await confirmDelete(project.ongoing_id);
          }
          setConfirmOpen(false);
        }}
        title="Delete project"
        message={`Are you sure you want to delete project "${project?.ongoing_id}"? This action cannot be undone.`}
        loading={loading}
      />
    </div>
  );
}
