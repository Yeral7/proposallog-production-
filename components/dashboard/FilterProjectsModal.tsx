'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../lib/apiClient';
import { HiX } from 'react-icons/hi';

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

interface DropdownItem {
  id: number;
  name?: string;
  label?: string;
}

export interface FilterOptions {
  builderId?: string;
  estimatorId?: string;
  supervisorId?: string;
  statusId?: string;
  locationId?: string;
  dueDate?: string;
  priorityId?: string;
}

// Division interface removed

interface FilterProjectsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export default function FilterProjectsModal({ 
  isVisible, 
  onClose, 
  onApplyFilters,
  currentFilters 
}: FilterProjectsModalProps) {
  const [builders, setBuilders] = useState<DropdownItem[]>([]);
  const [estimators, setEstimators] = useState<DropdownItem[]>([]);
  const [supervisors, setSupervisors] = useState<DropdownItem[]>([]);
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [locations, setLocations] = useState<DropdownItem[]>([]);
  const [priorities, setPriorities] = useState<DropdownItem[]>([]);
  
  // Debug effect for priorities
  useEffect(() => {
    console.log('Priorities state updated:', priorities);
  }, [priorities]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [builderId, setBuilderId] = useState(currentFilters.builderId || '');
  const [estimatorId, setEstimatorId] = useState(currentFilters.estimatorId || '');
  const [supervisorId, setSupervisorId] = useState(currentFilters.supervisorId || '');
  const [statusId, setStatusId] = useState(currentFilters.statusId || '');
  const [locationId, setLocationId] = useState(currentFilters.locationId || '');
  const [dueDate, setDueDate] = useState(currentFilters.dueDate || '');
  const [priorityId, setPriorityId] = useState(currentFilters.priorityId || '');

  // Fetch dropdown data when modal opens
  useEffect(() => {
    // Only fetch data when component becomes visible and we're in a browser environment
    if (isVisible && typeof window !== 'undefined') {
      fetchReferenceData();
    }
  }, [isVisible]);

  // Update form state when currentFilters change
  useEffect(() => {
    setBuilderId(currentFilters.builderId || '');
    setEstimatorId(currentFilters.estimatorId || '');
    setSupervisorId(currentFilters.supervisorId || '');
    setStatusId(currentFilters.statusId || '');
    setLocationId(currentFilters.locationId || '');
    setDueDate(currentFilters.dueDate || '');
    setPriorityId(currentFilters.priorityId || '');
  }, [currentFilters]);

  const fetchReferenceData = async () => {
    try {
      const buildersRes = await fetchWithAuth('/api/builders');
      if (!buildersRes.ok) throw new Error(`Failed to fetch builders: ${buildersRes.statusText}`);
      const buildersData = await buildersRes.json();
      setBuilders(Array.isArray(buildersData) ? buildersData : []);

      const estimatorsRes = await fetchWithAuth('/api/estimators');
      if (!estimatorsRes.ok) throw new Error(`Failed to fetch estimators: ${estimatorsRes.statusText}`);
      const estimatorsData = await estimatorsRes.json();
      setEstimators(Array.isArray(estimatorsData) ? estimatorsData : []);
      
      const supervisorsRes = await fetchWithAuth('/api/supervisors');
      if (!supervisorsRes.ok) throw new Error(`Failed to fetch supervisors: ${supervisorsRes.statusText}`);
      const supervisorsData = await supervisorsRes.json();
      setSupervisors(Array.isArray(supervisorsData) ? supervisorsData : []);

      const statusesRes = await fetchWithAuth('/api/statuses');
      if (!statusesRes.ok) throw new Error(`Failed to fetch statuses: ${statusesRes.statusText}`);
      const statusesData = await statusesRes.json();
      setStatuses(Array.isArray(statusesData) ? statusesData : []);

      const locationsRes = await fetchWithAuth('/api/locations');
      if (!locationsRes.ok) throw new Error(`Failed to fetch locations: ${locationsRes.statusText}`);
      const locationsData = await locationsRes.json();
      setLocations(Array.isArray(locationsData) ? locationsData : []);

      const prioritiesRes = await fetchWithAuth('/api/priorities');
      if (!prioritiesRes.ok) throw new Error(`Failed to fetch priorities: ${prioritiesRes.statusText}`);
      const prioritiesData = await prioritiesRes.json();
      console.log('Priorities from API:', prioritiesData);
      setPriorities(Array.isArray(prioritiesData) ? prioritiesData : []);

    } catch (err) {
      console.error('Error fetching reference data:', err);
      setError(`Failed to load filter options: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleApplyFilters = () => {
    const filters: FilterOptions = {
      builderId: builderId || undefined,
      estimatorId: estimatorId || undefined,
      supervisorId: supervisorId || undefined,
      statusId: statusId || undefined,
      locationId: locationId || undefined,
      dueDate: dueDate || undefined,
      priorityId: priorityId || undefined
    };
    
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setBuilderId('');
    setEstimatorId('');
    setSupervisorId('');
    setStatusId('');
    setLocationId('');
    setDueDate('');
    setPriorityId('');
    
    onApplyFilters({});
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 bg-[var(--header-gray)] text-white p-4 rounded-t shadow-sm -mt-6 -mx-6">
            <h2 className="text-xl font-bold">Filter Projects</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="builderId" className="block text-sm font-medium text-gray-700 mb-1">
                Builder
              </label>
              <select
                id="builderId"
                value={builderId}
                onChange={(e) => setBuilderId(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">All Builders</option>
                {Array.isArray(builders) && builders.length > 0 ? builders.map((builder) => (
                  <option key={builder.id} value={builder.id}>
                    {builder.name}
                  </option>
                )) : <option disabled>No builders available</option>}
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
              >
                <option value="">All Estimators</option>
                {Array.isArray(estimators) && estimators.length > 0 ? estimators.map((estimator) => (
                  <option key={estimator.id} value={estimator.id}>
                    {estimator.name}
                  </option>
                )) : <option disabled>No estimators available</option>}
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
                <option value="">All Supervisors</option>
                {Array.isArray(supervisors) && supervisors.length > 0 ? supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </option>
                )) : <option disabled>No supervisors available</option>}
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
              >
                <option value="">All Statuses</option>
                {Array.isArray(statuses) && statuses.length > 0 ? statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                )) : <option disabled>No statuses available</option>}
              </select>
            </div>

            <div>
              <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                id="locationId"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">All Locations</option>
                {Array.isArray(locations) && locations.length > 0 ? locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                )) : <option disabled>No locations available</option>}
              </select>
            </div>

            {/* Division selection removed */}

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Before
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                disabled={loading}
              >
                <option value="">All Priorities</option>
                {Array.isArray(priorities) && priorities.map((priorityItem) => (
                  <option key={priorityItem.id} value={priorityItem.id}>
                    {priorityItem.name || priorityItem.label}
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

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-[var(--accent-gray)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Filters
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
                type="button"
                onClick={handleApplyFilters}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
