'use client';

import React, { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';
import { toast } from 'react-toastify';

interface AddResidentialProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectAdded: (projectName?: string) => void;
}

interface ResidentialBuilder {
  id: number;
  name: string;
}

interface Subcontractor {
  id: number;
  name: string;
}

export default function AddResidentialProjectModal({ isOpen, onClose, onProjectAdded }: AddResidentialProjectModalProps) {
  // Form state
  const [projectName, setProjectName] = useState('');
  const [builderId, setBuilderId] = useState<number | null>(null);
  const [subcontractorId, setSubcontractorId] = useState<number | null>(null);
  const [noSubcontractor, setNoSubcontractor] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [estCompletionDate, setEstCompletionDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [noContractValue, setNoContractValue] = useState(false);
  const [status, setStatus] = useState('Pending');
  const [priority, setPriority] = useState('Medium');
  
  const [builders, setBuilders] = useState<ResidentialBuilder[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchBuilders = async () => {
        try {
          const response = await fetchWithAuth('/api/residential-builders');
          if (!response.ok) {
            throw new Error('Failed to fetch builders');
          }
          const data = await response.json();
          setBuilders(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not fetch builders');
        }
      };
      fetchBuilders();
      const fetchSubcontractors = async () => {
        try {
          const response = await fetchWithAuth('/api/residential-subcontractors');
          if (!response.ok) {
            throw new Error('Failed to fetch subcontractors');
          }
          const data = await response.json();
          setSubcontractors(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not fetch subcontractors');
        }
      };
      fetchSubcontractors();
    }
  }, [isOpen]);

  // Reset form fields
  const resetForm = () => {
    setProjectName('');
    setBuilderId(null);
    setSubcontractorId(null);
    setNoSubcontractor(false);
    setStartDate('');
    setEstCompletionDate('');
    setContractValue('');
    setNoContractValue(false);
    setStatus('Pending');
    setPriority('Medium');
  };

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!projectName || !builderId) {
      setError('Please ensure Project Name and Builder are provided.');
      return;
    }

    setLoading(true);

    const projectData = {
      project_name: projectName,
      builder_id: builderId,
      subcontractor_id: noSubcontractor ? null : subcontractorId,
      start_date: startDate || null,
      est_completion_date: estCompletionDate || null,
      contract_value: noContractValue || !contractValue ? null : parseFloat(contractValue),
      status,
      priority
    };

    try {
      const response = await fetchWithAuth('/api/residential-projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add residential project');
      }

      toast.success(`Project "${projectName}" added successfully.`);
      resetForm();
      onProjectAdded(projectName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 bg-[var(--header-gray)] text-white p-4 rounded-t shadow-sm -mt-6 -mx-6">
            <h2 className="text-xl font-bold">Add New Residential Project</h2>
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
                  value={builderId ?? ''}
                  onChange={(e) => setBuilderId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  required
                >
                  <option value="" disabled>Select a builder</option>
                  {builders.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="subcontractor" className="block text-sm font-medium text-gray-700">
                    Subcontractor
                    </label>
                    <div className="flex items-center">
                        <input
                        type="checkbox"
                        id="noSubcontractor"
                        checked={noSubcontractor}
                        onChange={(e) => setNoSubcontractor(e.target.checked)}
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                        <label htmlFor="noSubcontractor" className="ml-2 block text-sm text-gray-700">
                        Not yet determined
                        </label>
                    </div>
                </div>
                <select
                  id="subcontractor"
                  value={subcontractorId ?? ''}
                  onChange={(e) => setSubcontractorId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  disabled={noSubcontractor}
                  required={!noSubcontractor}
                >
                  <option value="">Select a subcontractor</option>
                  {subcontractors.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
