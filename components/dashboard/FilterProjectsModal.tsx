'use client';

import React, { useState, useEffect } from 'react';
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

// Division interface removed

export interface FilterOptions {
  builderId?: string;
  estimatorId?: string;
  supervisorId?: string;
  statusId?: string;
  locationId?: string;
  dueDate?: string;
}

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
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [estimators, setEstimators] = useState<Estimator[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [builderId, setBuilderId] = useState(currentFilters.builderId || '');
  const [estimatorId, setEstimatorId] = useState(currentFilters.estimatorId || '');
  const [supervisorId, setSupervisorId] = useState(currentFilters.supervisorId || '');
  const [statusId, setStatusId] = useState(currentFilters.statusId || '');
  const [locationId, setLocationId] = useState(currentFilters.locationId || '');
  const [dueDate, setDueDate] = useState(currentFilters.dueDate || '');

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (isVisible) {
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
  }, [currentFilters]);

  const fetchReferenceData = async () => {
    try {
      const buildersRes = await fetch('/api/builders');
      const builders = await buildersRes.json();
      setBuilders(builders);

      const estimatorsRes = await fetch('/api/estimators');
      const estimators = await estimatorsRes.json();
      setEstimators(estimators);
      
      const supervisorsRes = await fetch('/api/supervisors');
      const supervisors = await supervisorsRes.json();
      setSupervisors(supervisors);

      const statusesRes = await fetch('/api/statuses');
      const statuses = await statusesRes.json();
      setStatuses(statuses);

      const locationsRes = await fetch('/api/locations');
      const locations = await locationsRes.json();
      setLocations(locations);

    } catch (err) {
      console.error('Error fetching reference data:', err);
      setError('Failed to load filter options. Please try again.');
    }
  };

  const handleApplyFilters = () => {
    const filters: FilterOptions = {
      builderId: builderId || undefined,
      estimatorId: estimatorId || undefined,
      supervisorId: supervisorId || undefined,
      statusId: statusId || undefined,
      locationId: locationId || undefined,
      dueDate: dueDate || undefined
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
              >
                <option value="">All Estimators</option>
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
                <option value="">All Supervisors</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
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
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
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
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
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
