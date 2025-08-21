'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import type { ResidentialProject } from './ResidentialLogTable';

interface Builder {
  id: number;
  name: string;
}

interface Subcontractor {
  id: number;
  name: string;
}

interface ResidentialStatus {
  id: number;
  name: string;
}


interface EditResidentialProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
  project: ResidentialProject | null;
}

const EditResidentialProjectModal: React.FC<EditResidentialProjectModalProps> = ({ isOpen, onClose, onProjectUpdated, project }) => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [residentialStatuses, setResidentialStatuses] = useState<ResidentialStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [builderId, setBuilderId] = useState<number | null>(null);
  const [subcontractorId, setSubcontractorId] = useState<number | null>(null);
  const [subcontractorNotDetermined, setSubcontractorNotDetermined] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [noStartDate, setNoStartDate] = useState(false);
  const [estCompletionDate, setEstCompletionDate] = useState('');
  const [noEstCompletionDate, setNoEstCompletionDate] = useState(false);
  const [contractValue, setContractValue] = useState('');
  const [noContractValue, setNoContractValue] = useState(false);
  const [statusId, setStatusId] = useState<number | null>(null);
  const [priority, setPriority] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchBuilders();
      fetchSubcontractors();
      fetchResidentialStatuses();
    }
  }, [isOpen]);

  useEffect(() => {
    if (project) {
      setProjectName(project.project_name);
      setBuilderId(project.builder?.id || null);
      setSubcontractorId(project.subcontractor_id || null);
      setSubcontractorNotDetermined(!project.subcontractor_id);
      setStartDate(project.start_date?.split('T')[0] || '');
      setNoStartDate(project.start_date === null);
      setEstCompletionDate(project.est_completion_date?.split('T')[0] || '');
      setNoEstCompletionDate(project.est_completion_date === null);
      setContractValue(project.contract_value ? project.contract_value.toString() : '');
      setNoContractValue(project.contract_value === null);
      setStatusId(project.status?.id || null);
      setPriority(project.priority || '');
    }
  }, [project]);


  const fetchSubcontractors = async () => {
    try {
      const response = await fetchWithAuth('/api/residential-subcontractors');
      if (!response.ok) throw new Error('Failed to fetch subcontractors');
      const data = await response.json();
      setSubcontractors(data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load subcontractors.');
    }
  };

  const fetchResidentialStatuses = async () => {
    try {
      const response = await fetchWithAuth('/api/residential-statuses');
      if (!response.ok) throw new Error('Failed to fetch statuses');
      const data = await response.json();
      setResidentialStatuses(data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load statuses.');
    }
  };

  const fetchBuilders = async () => {
    try {
      const response = await fetchWithAuth('/api/residential-builders');
      if (!response.ok) throw new Error('Failed to fetch builders');
      const data = await response.json();
      setBuilders(data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load builders.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setLoading(true);
    setError(null);

    const projectData = {
      project_name: projectName,
      builder_id: builderId,
      subcontractor_id: subcontractorNotDetermined ? null : subcontractorId,
      start_date: noStartDate ? null : startDate,
      est_completion_date: noEstCompletionDate ? null : estCompletionDate,
      contract_value: noContractValue ? null : parseFloat(contractValue),
      status_id: statusId,
      priority,
    };

    try {
      const response = await fetchWithAuth(`/api/residential-projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      toast.success('Project updated successfully!');
      onProjectUpdated();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh]">
        <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Edit Residential Project</h2>
        </div>
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Builder</label>
                    <select value={builderId ?? ''} onChange={e => setBuilderId(Number(e.target.value))} className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2" required>
                        <option value="">Select Builder</option>
                        {builders.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subcontractor</label>
                    <select value={subcontractorId ?? ''} onChange={e => setSubcontractorId(Number(e.target.value))} className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2" disabled={subcontractorNotDetermined} required={!subcontractorNotDetermined}>
                        <option value="">Select Subcontractor</option>
                        {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="flex items-center mt-2">
                        <input type="checkbox" id="subcontractorNotDetermined" checked={subcontractorNotDetermined} onChange={e => setSubcontractorNotDetermined(e.target.checked)} className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                        <label htmlFor="subcontractorNotDetermined" className="ml-2 text-sm text-gray-700">Not yet determined</label>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2" disabled={noStartDate} />
                    <div className="flex flex-col">
                      <label htmlFor="no_start_date" className="text-sm font-medium text-gray-700 mb-1">No Start Date</label>
                      <input
                        type="checkbox"
                        id="no_start_date"
                        checked={noStartDate}
                        onChange={(e) => setNoStartDate(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                      />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Est. Completion Date</label>
                    <input type="date" value={estCompletionDate} onChange={e => setEstCompletionDate(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2" disabled={noEstCompletionDate} />
                    <div className="flex flex-col">
                      <label htmlFor="no_est_completion_date" className="text-sm font-medium text-gray-700 mb-1">No Est. Completion Date</label>
                      <input
                        type="checkbox"
                        id="no_est_completion_date"
                        checked={noEstCompletionDate}
                        onChange={(e) => setNoEstCompletionDate(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                      />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Contract Value</label>
                    <input type="number" value={contractValue} onChange={e => setContractValue(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2" disabled={noContractValue} />
                     <div className="flex items-center mt-2">
                        <input type="checkbox" id="noContractValue" checked={noContractValue} onChange={e => setNoContractValue(e.target.checked)} className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)]" />
                        <label htmlFor="noContractValue" className="ml-2 text-sm text-gray-700">No contract value</label>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select value={statusId ?? ''} onChange={e => setStatusId(Number(e.target.value))} className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2" required>
                        <option value="">Select Status</option>
                        {residentialStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)} 
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>
            {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>}
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)]">{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditResidentialProjectModal;
