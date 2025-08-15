'use client';

import React, { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
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

interface AddProjectModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProjectAdded: (projectName?: string) => void;
}

interface Project {
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
  location_id: number | null;
  location_name: string | null;
  due_date: string;
  submission_date?: string | null;
  follow_up_date?: string | null;
  contract_value: number | null;
  reference_project_id?: number | null;
  priority?: string | null;
}

export default function AddProjectModal({ isVisible, onClose, onProjectAdded }: AddProjectModalProps) {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [estimators, setEstimators] = useState<Estimator[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMultipleBuilder, setIsMultipleBuilder] = useState(false);
  const [referenceProjectId, setReferenceProjectId] = useState<string>('');

  // Form state
  const [projectName, setProjectName] = useState('');
  const [builderId, setBuilderId] = useState('');
  const [estimatorId, setEstimatorId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [noContractValue, setNoContractValue] = useState(false);
  const [noDueDate, setNoDueDate] = useState(false);
  const [priority, setPriority] = useState<string>('');
  const [submissionDate, setSubmissionDate] = useState('');

  // Fetch dropdown data when modal opens
  // Fallback reference data to use when API fails
  const fallbackData = {
    builders: [{id: 1, name: "Default Builder"}],
    estimators: [{id: 1, name: "Default Estimator"}],
    supervisors: [{id: 1, name: "Default Supervisor"}],
    statuses: [{id: 1, label: "Pending"}],
    locations: [{id: 1, name: "Default Location"}]
  };

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
      
      // Fetch existing projects for reference selection
      const projects = await fetchData('/api/projects', 'Projects');
      setExistingProjects(projects);
      
      // Clear any previous error
      setError(null);
    } catch (err) {
      console.error('Error fetching reference data:', err);
      setError('Failed to load form data. Please check console for details.');
    }
  };

  // Reset form fields
  const resetForm = () => {
    setProjectName('');
    setBuilderId('');
    setEstimatorId('');
    setSupervisorId('');
    setStatusId('');
    setLocationId('');
    setDueDate('');
    setContractValue('');
    setNoContractValue(false);
    setDueDate('');
    setNoDueDate(false);
    setPriority('');
    setSubmissionDate('');
    setIsMultipleBuilder(false);
    setReferenceProjectId('');
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

    // Validation
    if (!projectName || !builderId || !estimatorId || !statusId) {
      setError('Please ensure Project Name, Builder, Estimator, and Status are selected.');
      return;
    }
    if (!noDueDate && !dueDate) {
      setError('Please provide a due date or check "No due date".');
      return;
    }
    if (!noContractValue && !contractValue) {
      setError('Please provide a contract value or check "No contract value".');
      return;
    }

    setLoading(true);

    const projectData = {
      project_name: projectName,
      builder_id: parseInt(builderId),
      estimator_id: parseInt(estimatorId),
      supervisor_id: supervisorId ? parseInt(supervisorId) : null,
      status_id: parseInt(statusId),
      location_id: locationId ? parseInt(locationId) : null,
      due_date: noDueDate ? null : dueDate,
      contract_value: noContractValue || !contractValue ? null : parseFloat(contractValue),
      reference_project_id: isMultipleBuilder && referenceProjectId ? parseInt(referenceProjectId) : null,
      priority: priority || null,
      submission_date: submissionDate || null,
    };

    try {
      const response = await fetchWithAuth('/api/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add project');
      }

      resetForm();
      onProjectAdded(projectName);
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
            <h2 className="text-xl font-bold">Add New Project</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Multiple builder checkbox - full width */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="multipleBuilder"
                  checked={isMultipleBuilder}
                  onChange={(e) => {
                    setIsMultipleBuilder(e.target.checked);
                    // Clear the reference project when unchecked
                    if (!e.target.checked) {
                      setReferenceProjectId('');
                    }
                  }}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="multipleBuilder" className="ml-2 block text-sm text-gray-700">
                  Multiple builder project (shared with other builders)
                </label>
              </div>
              
              {/* Reference project selection */}
              {isMultipleBuilder && (
                <div className="mt-3">
                  <label htmlFor="referenceProject" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Existing Project
                  </label>
                  <select
                    id="referenceProject"
                    value={referenceProjectId}
                    onChange={(e) => {
                      setReferenceProjectId(e.target.value);
                      // Auto-populate fields from the selected project
                      if (e.target.value) {
                        const selectedProject = existingProjects.find(p => p.id === parseInt(e.target.value));
                        if (selectedProject) {
                          setProjectName(selectedProject.project_name);
                          setEstimatorId(selectedProject.estimator_id.toString());
                          setSupervisorId(selectedProject.supervisor_id?.toString() || '');
                          setStatusId(selectedProject.status_id.toString());
                          setLocationId(selectedProject.location_id?.toString() || '');
                          setDueDate(selectedProject.due_date);
                          
                          if (selectedProject.contract_value === null) {
                            setNoContractValue(true);
                            setContractValue('');
                          } else {
                            setNoContractValue(false);
                            setContractValue(selectedProject.contract_value.toString());
                          }
                        }
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required={isMultipleBuilder}
                  >
                    <option value="">Select existing project</option>
                    {existingProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_name} ({project.builder_name})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Selecting a project will pre-fill information except builder
                  </p>
                </div>
              )}
            </div>

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
              <label htmlFor="builderId" className="block text-sm font-medium text-gray-700 mb-1">
                Builder
              </label>
              <select
                id="builderId"
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
              <label htmlFor="estimatorId" className="block text-sm font-medium text-gray-700 mb-1">
                Estimator
              </label>
              <select
                id="estimatorId"
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
              <label htmlFor="supervisorId" className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor
              </label>
              <select
                id="supervisorId"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">Select Supervisor (Optional)</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                id="location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
              <label htmlFor="statusId" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="statusId"
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
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
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

            {/* Division selection removed */}

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
                    No Due Date
                  </label>
                </div>
              </div>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
            >
              {loading ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
