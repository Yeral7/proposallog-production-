'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/apiClient';
import { HiX } from 'react-icons/hi';

interface Builder {
  id: number;
  name: string;
}

interface ResidentialProject {
  id: number;
  project_name: string;
  builder: string; // This might now be stale, we'll use builder_id
  builder_id: number | null;
  subcontractor: string | null;
  start_date: string | null;
  est_completion_date: string | null;
  contract_value: number | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface ResidentialProjectDetailsProps {
  project: ResidentialProject;
  onClose: () => void;
  onProjectUpdated: () => void;
}

export default function ResidentialProjectDetails({ project, onClose, onProjectUpdated }: ResidentialProjectDetailsProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [builderId, setBuilderId] = useState<number | null>(null);
  const [subcontractor, setSubcontractor] = useState('');
  const [subcontractorNotDetermined, setSubcontractorNotDetermined] = useState(false);
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [startDate, setStartDate] = useState('');
  const [estCompletionDate, setEstCompletionDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [noContractValue, setNoContractValue] = useState(false);
  const [status, setStatus] = useState('Pending');
  const [priority, setPriority] = useState('Medium');

  const [isEditing, setIsEditing] = useState(false);

  // Populate form when project prop changes
  useEffect(() => {
    const fetchBuilders = async () => {
      try {
        const response = await fetchWithAuth('/api/residential-builders');
        if (!response.ok) {
          throw new Error('Failed to fetch builders');
        }
        const data = await response.json();
        setBuilders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch builders');
      }
    };

    fetchBuilders();

    if (project) {
      setProjectName(project.project_name);
      setBuilderId(project.builder_id);
      setSubcontractor(project.subcontractor || '');
      setSubcontractorNotDetermined(!project.subcontractor);
      setStartDate(project.start_date || '');
      setEstCompletionDate(project.est_completion_date || '');
      setContractValue(project.contract_value ? project.contract_value.toString() : '');
      setNoContractValue(project.contract_value === null);
      setStatus(project.status);
      setPriority(project.priority);
    }
  }, [project]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form to current project data
    if (project) {
      setProjectName(project.project_name);
      setBuilderId(project.builder_id);
      setSubcontractor(project.subcontractor || '');
      setSubcontractorNotDetermined(!project.subcontractor);
      setStartDate(project.start_date || '');
      setEstCompletionDate(project.est_completion_date || '');
      setContractValue(project.contract_value ? project.contract_value.toString() : '');
      setNoContractValue(project.contract_value === null);
      setStatus(project.status);
      setPriority(project.priority);
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;
    
    setError(null);
    setLoading(true);

    try {
      const projectData = {
        project_name: projectName,
        builder_id: builderId,
        subcontractor: subcontractorNotDetermined ? null : subcontractor, 
        start_date: startDate || null,
        est_completion_date: estCompletionDate || null,
        contract_value: noContractValue || !contractValue ? null : parseFloat(contractValue),
        status,
        priority
      };

      const response = await fetchWithAuth(`/api/residential-projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update residential project');
      }

      setIsEditing(false);
      onProjectUpdated(); // This will trigger a re-fetch in the parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 bg-[var(--header-gray)] text-white p-4 rounded-t shadow-sm -mt-6 -mx-6">
            <h2 className="text-xl font-bold">
              {isEditing ? 'Edit Residential Project' : 'Residential Project Details'}
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>
          
          {loading ? (
            <div className="py-10 text-center">Loading...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : (
            <form onSubmit={handleSubmit}>
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
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="builderId" className="block text-sm font-medium text-gray-700 mb-1">
                    Builder
                  </label>
                  <select
                    id="builderId"
                    value={builderId || ''}
                    onChange={(e) => setBuilderId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    disabled={!isEditing}
                    required
                  >
                    <option value="" disabled>Select a builder</option>
                    {builders.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="subcontractor" className="block text-sm font-medium text-gray-700">
                      Subcontractor
                    </label>
                    {isEditing && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="subcontractorNotDetermined"
                          checked={subcontractorNotDetermined}
                          onChange={(e) => {
                            setSubcontractorNotDetermined(e.target.checked);
                            if (e.target.checked) {
                              setSubcontractor('');
                            }
                          }}
                          className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                        <label htmlFor="subcontractorNotDetermined" className="ml-2 block text-sm text-gray-900">
                          Not yet determined
                        </label>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    id="subcontractor"
                    value={subcontractor}
                    onChange={(e) => setSubcontractor(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    disabled={!isEditing || subcontractorNotDetermined}
                  />
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label htmlFor="estCompletionDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Completion Date
                  </label>
                  <input
                    type="date"
                    id="estCompletionDate"
                    value={estCompletionDate}
                    onChange={(e) => setEstCompletionDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    disabled={!isEditing}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    disabled={!isEditing}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="contractValue" className="block text-sm font-medium text-gray-700">
                      Contract Value
                    </label>
                    {isEditing && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="noContractValue"
                          checked={noContractValue}
                          onChange={(e) => setNoContractValue(e.target.checked)}
                          className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                          disabled={!isEditing}
                        />
                        <label htmlFor="noContractValue" className="ml-2 block text-sm text-gray-700">
                          No contract value
                        </label>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    id="contractValue"
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    disabled={!isEditing || noContractValue}
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
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
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-[var(--accent-gray)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
                    >
                      Edit Project
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
