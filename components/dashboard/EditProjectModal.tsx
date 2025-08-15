'use client';

import React, { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import type { Project } from './ProposalTable';
import { fetchWithAuth } from '@/lib/apiClient';

interface Builder {
  id: number;
  name: string;
}

interface Estimator {
  id: number;
  name: string;
}

interface Supervisor {
  id: number;
  name: string;
}

interface Status {
  id: number;
  label: string;
}

interface Location {
  id: number;
  name: string;
}

// Division interface removed

interface EditProjectModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProjectUpdated: (projectName?: string, action?: string) => void;
  project: Project | null;
}

export default function EditProjectModal({ isVisible, onClose, onProjectUpdated, project }: EditProjectModalProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [estimators, setEstimators] = useState<Estimator[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [builderId, setBuilderId] = useState('');
  const [estimatorId, setEstimatorId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [noDueDate, setNoDueDate] = useState(false);
  const [contractValue, setContractValue] = useState('');
  const [noContractValue, setNoContractValue] = useState(false);
  const [priority, setPriority] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');


  // Fallback reference data to use when API fails
  const fallbackData = {
    builders: [{id: 1, name: "Default Builder"}],
    estimators: [{id: 1, name: "Default Estimator"}],
    supervisors: [{id: 1, name: "Default Supervisor"}],
    statuses: [{id: 1, label: "Pending"}],
    locations: [{id: 1, name: "Default Location"}]
  };

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (isVisible) {
      fetchReferenceData()
        .catch(err => {
          console.error('Falling back to default data due to fetch error:', err);
          // Use fallback data if fetch fails
          setBuilders(fallbackData.builders);
          setEstimators(fallbackData.estimators);
          setSupervisors(fallbackData.supervisors);
          setStatuses(fallbackData.statuses);
          setLocations(fallbackData.locations);
          setError('Using default data. Some options may be limited.');
        });
    }
  }, [isVisible]);
  
  // Populate form when project changes or reference data is loaded
  useEffect(() => {
    // Populate form when project is available and modal is visible.
    // The populateForm function will run again if the reference data loads later.
    if (project && isVisible) {
      populateForm();
    }
  }, [project, isVisible, builders, estimators, statuses, supervisors, locations]);

  // Populate the form with project data
  const populateForm = () => {
    if (!project) return;
    
    // Set text fields first
    setProjectName(project.project_name);

    if (project.due_date) {
      setDueDate(project.due_date);
      setNoDueDate(false);
    } else {
      setDueDate('');
      setNoDueDate(true);
    }
    
    // Handle contract value (may be null)
    if (project.contract_value === null) {
      setNoContractValue(true);
      setContractValue('');
    } else {
      setNoContractValue(false);
      setContractValue(project.contract_value.toString());
    }

    setPriority(project.priority || '');

    if (project.submission_date) {
      setSubmissionDate(project.submission_date);
    } else {
      setSubmissionDate('');
    }

    if (project.follow_up_date) {
      setFollowUpDate(project.follow_up_date);
    } else {
      setFollowUpDate('');
    }


    
    // Find builder ID from name - with error handling
    const builder = builders.find(b => b.name === project.builder_name);
    if (builder) {
      setBuilderId(builder.id.toString());
    } else {
      console.warn('Could not find builder:', project.builder_name);
    }
    
    // Find estimator ID from name
    const estimator = estimators.find(e => e.name === project.estimator_name);
    if (estimator) {
      setEstimatorId(estimator.id.toString());
    } else {
      console.warn('Could not find estimator:', project.estimator_name);
    }
    
    // Find supervisor ID from name
    if (project.supervisor_name) {
      const supervisor = supervisors.find(s => s.name === project.supervisor_name);
      if (supervisor) {
        setSupervisorId(supervisor.id.toString());
      } else {
        console.warn('Could not find supervisor:', project.supervisor_name);
        setSupervisorId('');
      }
    } else {
      setSupervisorId('');
    }
    
    // Find status ID from label
    const status = statuses.find(s => s.label === project.status_label);
    if (status) {
      setStatusId(status.id.toString());
    } else {
      console.warn('Could not find status:', project.status_label);
    }
    
    // Find location ID from name
    if (project.location_name) {
      const location = locations.find(l => l.name === project.location_name);
      if (location) {
        setLocationId(location.id.toString());
      } else {
        console.warn('Could not find location:', project.location_name);
        setLocationId('');
      }
    } else {
      setLocationId('');
    }
  };

  const fetchReferenceData = async () => {
    try {
      // Helper function for safe fetch and parse
      const fetchData = async (url, label) => {
        try {
          const response = await fetchWithAuth(url);
          
          if (!response.ok) {
            throw new Error(`${label} fetch failed with status ${response.status}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error(`${label} response is not JSON:`, await response.text());
            throw new Error(`${label} response is not in JSON format`);
          }
          
          return await response.json();
        } catch (err) {
          console.error(`Error fetching ${label}:`, err);
          throw err;
        }
      };

      // Fetch all reference data
      const builders = await fetchData('/api/builders', 'Builders');
      setBuilders(builders);

      const estimators = await fetchData('/api/estimators', 'Estimators');
      setEstimators(estimators);
      
      const supervisors = await fetchData('/api/supervisors', 'Supervisors');
      setSupervisors(supervisors);

      const statuses = await fetchData('/api/statuses', 'Statuses');
      setStatuses(statuses);

      const locations = await fetchData('/api/locations', 'Locations');
      setLocations(locations);
      
      // Clear any previous error
      setError(null);
    } catch (err) {
      console.error('Failed to fetch reference data:', err);
      setError('Failed to fetch reference data. Please check console for details.');
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    
    try {
      // Ensure we're using the numeric ID value directly
      const projectId = typeof project.id === 'number' ? project.id : parseInt(project.id);
      
      const response = await fetchWithAuth(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!response.ok) {
        const errorMessage = result.error || 'Failed to delete project';
        console.error('API response error:', errorMessage, result);
        throw new Error(errorMessage);
      }

      onProjectUpdated(project.project_name, `Deleted project: "${project.project_name}"`);
      onClose();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Core fields that are always required
    if (!projectName || !builderId || !estimatorId || !statusId) {
      setError('Please ensure Project Name, Builder, Estimator, and Status are selected.');
      return;
    }

    // Conditional validation for due date
    if (!noDueDate && !dueDate) {
      setError('Please provide a due date or check "No due date".');
      return;
    }

    // Conditional validation for contract value
    if (!noContractValue && !contractValue) {
      setError('Please provide a contract value or check "No contract value".');
      return;
    }
    
    setLoading(true);

    // Prepare data, handling optional fields correctly by sending null if they are not set
    const projectData = {
      id: project?.id,
      project_name: projectName,
      builder_id: parseInt(builderId),
      estimator_id: parseInt(estimatorId),
      supervisor_id: supervisorId ? parseInt(supervisorId) : null,
      status_id: parseInt(statusId),
      location_id: locationId ? parseInt(locationId) : null,
      due_date: noDueDate ? null : dueDate,
      contract_value: noContractValue || !contractValue ? null : parseFloat(contractValue),
      priority: priority || null,
      submission_date: submissionDate || null,
      follow_up_date: followUpDate || null,
    };

    try {
      const response = await fetchWithAuth(`/api/projects/${project?.id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      onProjectUpdated(projectName, `Updated project: "${projectName}"`);
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const DeleteConfirmation = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] px-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Project</h3>
          <p className="text-gray-700 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-[var(--accent-gray)] focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isVisible || !project) return null;

  return (
    <>
      {showDeleteConfirmation && <DeleteConfirmation />}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="builder" className="block text-sm font-medium text-gray-700 mb-1">
                    Builder
                  </label>
                  <select
                    id="builder"
                    value={builderId}
                    onChange={(e) => setBuilderId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  >
                    <option value="">Select Builder</option>
                    {builders.map((builder) => (
                      <option key={builder.id} value={builder.id}>
                        {builder.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="estimator" className="block text-sm font-medium text-gray-700 mb-1">
                    Estimator
                  </label>
                  <select
                    id="estimator"
                    value={estimatorId}
                    onChange={(e) => setEstimatorId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  >
                    <option value="">Select Estimator</option>
                    {estimators.map((estimator) => (
                      <option key={estimator.id} value={estimator.id}>
                        {estimator.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor
                  </label>
                  <select
                    id="supervisor"
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={statusId}
                    onChange={(e) => setStatusId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  >
                    <option value="">Select Status</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Not Set</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                  <select
                    id="location"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="noDueDate"
                        checked={noDueDate}
                        onChange={(e) => setNoDueDate(e.target.checked)}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label htmlFor="noDueDate" className="ml-2 block text-sm text-gray-700">
                        No due date
                      </label>
                    </div>
                  </div>
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={noDueDate}
                    required={!noDueDate}
                  />
                </div>

                <div>
                  <label htmlFor="submissionDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Submission Date
                  </label>
                  <input
                    type="date"
                    id="submissionDate"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    id="followUpDate"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="contractValue" className="block text-sm font-medium text-gray-700">
                      Contract Value
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="noContractValue"
                        checked={noContractValue}
                        onChange={(e) => setNoContractValue(e.target.checked)}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <label htmlFor="noContractValue" className="ml-2 block text-sm text-gray-700">
                        No contract value
                      </label>
                    </div>
                  </div>
                  <input
                    type="number"
                    id="contractValue"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={noContractValue}
                    required={!noContractValue}
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Project
                </button>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-[var(--accent-gray)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
