'use client';

import React, { useState, useEffect } from 'react';
import { HiOutlineCog, HiTrash, HiPlus, HiOutlineOfficeBuilding, HiOutlineLocationMarker, HiOutlineUser, HiSearch, HiStatusOnline } from "react-icons/hi";
import Banner from "../../components/Banner";
import Header from "../../components/Header";

// Define types
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

interface Location {
  id: number;
  name: string;
}

interface Status {
  id: number;
  label: string;
}

const AdminPage = () => {
  // State for all entities
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [estimators, setEstimators] = useState<Estimator[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  
  // Add tab state
  const [activeTab, setActiveTab] = useState<'builders' | 'estimators' | 'supervisors' | 'locations' | 'statuses'>('builders');
  
  // State for new items
  const [newBuilder, setNewBuilder] = useState('');
  const [newEstimator, setNewEstimator] = useState('');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState('');
  
  // Search states
  const [builderSearch, setBuilderSearch] = useState('');
  const [estimatorSearch, setEstimatorSearch] = useState('');
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  
  // Filtered entities
  const filteredBuilders = builders.filter(b => 
    b.name.toLowerCase().includes(builderSearch.toLowerCase())
  );
  
  const filteredEstimators = estimators.filter(e => 
    e.name.toLowerCase().includes(estimatorSearch.toLowerCase())
  );
  
  const filteredSupervisors = supervisors.filter(s => 
    s.name.toLowerCase().includes(supervisorSearch.toLowerCase())
  );
  
  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );
  
  const filteredStatuses = statuses.filter(s => 
    s && s.label && s.label.toLowerCase().includes(statusSearch.toLowerCase())
  );
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation states
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{id: number, type: 'builder' | 'estimator' | 'supervisor' | 'location' | 'status', name: string} | null>(null);

  // Load all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Function to fetch all entity data
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data with individual error handling
      let buildersRes, estimatorsRes, supervisorsRes, locationsRes, statusesRes;
      
      try {
        buildersRes = await fetch('/api/builders');
        if (!buildersRes.ok) throw new Error('Failed to fetch builders');
      } catch (err) {
        console.error('Builders API error:', err);
        throw new Error('Failed to fetch builders data');
      }
      
      try {
        estimatorsRes = await fetch('/api/estimators');
        if (!estimatorsRes.ok) throw new Error('Failed to fetch estimators');
      } catch (err) {
        console.error('Estimators API error:', err);
        throw new Error('Failed to fetch estimators data');
      }
      
      try {
        supervisorsRes = await fetch('/api/supervisors');
        if (!supervisorsRes.ok) throw new Error('Failed to fetch supervisors');
      } catch (err) {
        console.error('Supervisors API error:', err);
        throw new Error('Failed to fetch supervisors data');
      }
      
      try {
        locationsRes = await fetch('/api/locations');
        if (!locationsRes.ok) throw new Error('Failed to fetch locations');
      } catch (err) {
        console.error('Locations API error:', err);
        throw new Error('Failed to fetch locations data');
      }
      
      try {
        statusesRes = await fetch('/api/statuses');
        if (!statusesRes.ok) throw new Error('Failed to fetch statuses');
      } catch (err) {
        console.error('Statuses API error:', err);
        throw new Error('Failed to fetch statuses data');
      }

      const buildersData = await buildersRes.json();
      const estimatorsData = await estimatorsRes.json();
      const supervisorsData = await supervisorsRes.json();
      const locationsData = await locationsRes.json();
      const statusesData = await statusesRes.json();

      setBuilders(buildersData);
      setEstimators(estimatorsData);
      setSupervisors(supervisorsData);
      setLocations(locationsData);
      setStatuses(statusesData || []); // Default to empty array if null
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Functions to add new entities
  const addBuilder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuilder.trim()) return;
    
    try {
      const response = await fetch('/api/builders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBuilder.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add builder');
      }
      
      setNewBuilder('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addEstimator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstimator.trim()) return;
    
    try {
      const response = await fetch('/api/estimators/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEstimator.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add estimator');
      }
      
      setNewEstimator('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    
    try {
      const response = await fetch('/api/locations/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLocation.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add location');
      }
      
      setNewLocation('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  // Function to add a new supervisor
  const addSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupervisor.trim()) return;
    
    try {
      const response = await fetch('/api/supervisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSupervisor.trim() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add supervisor');
      }
      
      setNewSupervisor('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Functions to handle delete confirmations
  const confirmDelete = (id: number, type: 'builder' | 'estimator' | 'supervisor' | 'location' | 'status', name: string) => {
    setDeleteConfirmItem({ id, type, name });
  };
  
  const cancelDelete = () => {
    setDeleteConfirmItem(null);
  };
  
  const executeDelete = async () => {
    if (!deleteConfirmItem) return;
    
    const { id, type } = deleteConfirmItem;
    let endpoint = '';
    
    switch (type) {
      case 'builder':
        endpoint = `/api/builders/delete?id=${id}`;
        break;
      case 'estimator':
        endpoint = `/api/estimators/delete?id=${id}`;
        break;
      case 'supervisor':
        endpoint = `/api/supervisors/delete?id=${id}`;
        break;
      case 'location':
        endpoint = `/api/locations/delete?id=${id}`;
        break;
      case 'status':
        endpoint = `/api/statuses/delete?id=${id}`;
        break;
    }
    
    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${type}`);
      }
      
      fetchAllData();
      setDeleteConfirmItem(null);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  // Legacy delete functions now just show confirmation
  const deleteSupervisor = (id: number, name: string) => {
    confirmDelete(id, 'supervisor', name);
  };
  
  const deleteBuilder = (id: number, name: string) => {
    confirmDelete(id, 'builder', name);
  };
  
  const deleteEstimator = (id: number, name: string) => {
    confirmDelete(id, 'estimator', name);
  };
  
  const deleteLocation = (id: number, name: string) => {
    confirmDelete(id, 'location', name);
  };

  // Status management functions
  const addStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus.trim()) return;
    
    try {
      const response = await fetch('/api/statuses/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newStatus.trim()
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add status');
      }
      
      setNewStatus('');
      fetchAllData(); // Refresh data after adding new status
    } catch (err) {
      console.error('Error adding status:', err);
      setError('Failed to add status. Please try again.');
    }
  };

  const deleteStatus = (id: number, name: string) => {
    confirmDelete(id, 'status', name);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="relative">
        <Banner title="Admin Settings" icon={<HiOutlineCog className="w-6 h-6" />} />
      </div>
      
      <main className="flex-1 bg-white relative z-10">        
        <div className="p-3 sm:p-6 w-full">  
          {/* Tab Navigation */}
          <div className="overflow-x-auto mb-4 sm:mb-6 pb-1">
            <div className="flex min-w-max border-b border-gray-200">
              <button
                onClick={() => setActiveTab('builders')}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 mr-2 sm:mr-4 whitespace-nowrap ${activeTab === 'builders' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Builders
              </button>
              <button
                onClick={() => setActiveTab('estimators')}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 mr-2 sm:mr-4 whitespace-nowrap ${activeTab === 'estimators' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Estimators
              </button>
              <button
                onClick={() => setActiveTab('supervisors')}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 mr-2 sm:mr-4 whitespace-nowrap ${activeTab === 'supervisors' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Supervisors
              </button>
              <button
                onClick={() => setActiveTab('locations')}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 mr-2 sm:mr-4 whitespace-nowrap ${activeTab === 'locations' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Locations
              </button>
              <button
                onClick={() => setActiveTab('statuses')}
                className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 mr-2 sm:mr-4 whitespace-nowrap ${activeTab === 'statuses' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Status
              </button>
            </div>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-gray-100 border border-gray-300 text-gray-700 rounded shadow-sm">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          {/* Delete Confirmation Dialog */}
          {deleteConfirmItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-4 sm:p-6 max-w-xs sm:max-w-md w-full">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Confirm Delete</h3>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">
                  Are you sure you want to delete {deleteConfirmItem.type} <span className="font-medium">{deleteConfirmItem.name}</span>? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2 sm:space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Tab Content based on active tab */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
            </div>
          ) : (
            <div className="mb-8">
              {/* Builders Panel - Only shown when builders tab is active */}
              {activeTab === 'builders' && (
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200 w-full overflow-y-auto" style={{maxHeight: 'calc(100vh - 250px)'}}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-gray-800">Builders</h3>
                    <span className="bg-gray-100 text-gray-700 p-2 rounded-full">
                      <HiOutlineOfficeBuilding className="w-6 h-6" />
                    </span>
                  </div>
                  
                  {/* Search input for builders */}
                  <div className="relative mb-3 sm:mb-4">
                    <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                      <HiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md py-1.5 sm:py-2 pl-8 sm:pl-10 pr-2 sm:pr-4 text-sm sm:text-base block w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Search builders..."
                      value={builderSearch}
                      onChange={(e) => setBuilderSearch(e.target.value)}
                    />
                  </div>
                  
                  <form onSubmit={addBuilder} className="mb-6">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        placeholder="Add new builder..."
                        value={newBuilder}
                        onChange={(e) => setNewBuilder(e.target.value)}
                        required
                      />
                      <button 
                        type="submit"
                        className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-r hover:bg-gray-800 transition-colors"
                      >
                        <HiPlus className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                  
                  {builders.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {filteredBuilders.length > 0 ? (
                        filteredBuilders.map(builder => (
                          <li key={builder.id} className="py-4 flex justify-between items-center">
                            <span className="text-gray-800 text-lg">{builder.name}</span>
                            <button
                              onClick={() => deleteBuilder(builder.id, builder.name)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title="Delete Builder"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-gray-500 italic text-center py-4">No matching builders found</p>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-center py-4">No builders found</p>
                  )}
                </div>
              )}

              {/* Estimators Panel - Only shown when estimators tab is active */}
              {activeTab === 'estimators' && (
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200 w-full overflow-y-auto" style={{maxHeight: 'calc(100vh - 250px)'}}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-gray-800">Estimators</h3>
                    <span className="bg-gray-100 text-gray-700 p-2 rounded-full">
                      <HiOutlineUser className="w-6 h-6" />
                    </span>
                  </div>
                  
                  {/* Search input for estimators */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md py-2 pl-10 pr-4 block w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Search estimators..."
                      value={estimatorSearch}
                      onChange={(e) => setEstimatorSearch(e.target.value)}
                    />
                  </div>
                  
                  <form onSubmit={addEstimator} className="mb-4 sm:mb-6">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <input
                        type="text"
                        placeholder="Add new estimator..."
                        value={newEstimator}
                        onChange={(e) => setNewEstimator(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-l px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-gray-400"
                        required
                      />
                      <button 
                        type="submit"
                        className="bg-[var(--primary-color)] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-r hover:bg-gray-800 transition-colors"
                      >
                        <HiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </form>
                  
                  {estimators.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {filteredEstimators.length > 0 ? (
                        filteredEstimators.map((estimator) => (
                          <li 
                            key={estimator.id} 
                            className="py-4 flex justify-between items-center"
                          >
                            <span className="text-gray-800 text-lg">{estimator.name}</span>
                            <button
                              onClick={() => deleteEstimator(estimator.id, estimator.name)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title="Delete Estimator"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-gray-500 italic text-center py-4">No matching estimators found</p>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-center py-4">No estimators found</p>
                  )}
                </div>
              )}

              {/* Supervisors Panel - Only shown when supervisors tab is active */}
              {activeTab === 'supervisors' && (
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200 w-full overflow-y-auto" style={{maxHeight: 'calc(100vh - 250px)'}}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-gray-800">Supervisors</h3>
                    <span className="bg-gray-100 text-gray-700 p-2 rounded-full">
                      <HiOutlineUser className="w-6 h-6" />
                    </span>
                  </div>
                  
                  {/* Search input for supervisors */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md py-2 pl-10 pr-4 block w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Search supervisors..."
                      value={supervisorSearch}
                      onChange={(e) => setSupervisorSearch(e.target.value)}
                    />
                  </div>
                  
                  <form onSubmit={addSupervisor} className="mb-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add new supervisor..."
                        value={newSupervisor}
                        onChange={(e) => setNewSupervisor(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        required
                      />
                      <button 
                        type="submit"
                        className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-r hover:bg-gray-800 transition-colors"
                      >
                        <HiPlus className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                  
                  {supervisors.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {filteredSupervisors.length > 0 ? (
                        filteredSupervisors.map((supervisor) => (
                          <li 
                            key={supervisor.id} 
                            className="py-4 flex justify-between items-center"
                          >
                            <span className="text-gray-800 text-lg">{supervisor.name}</span>
                            <button
                              onClick={() => deleteSupervisor(supervisor.id, supervisor.name)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title="Delete Supervisor"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-gray-500 italic text-center py-4">No matching supervisors found</p>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-center py-4">No supervisors found</p>
                  )}
                </div>
              )}
              
              {/* Locations Panel - Only shown when locations tab is active */}
              {activeTab === 'locations' && (
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200 w-full overflow-y-auto" style={{maxHeight: 'calc(100vh - 250px)'}}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-gray-800">Locations</h3>
                    <span className="bg-gray-100 text-gray-700 p-2 rounded-full">
                      <HiOutlineLocationMarker className="w-6 h-6" />
                    </span>
                  </div>
                  
                  {/* Search input for locations */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md py-2 pl-10 pr-4 block w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                    />
                  </div>
                  
                  <form onSubmit={addLocation} className="mb-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add new location..."
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        required
                      />
                      <button 
                        type="submit"
                        className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-r hover:bg-gray-800 transition-colors"
                      >
                        <HiPlus className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                  
                  {locations.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((location) => (
                          <li 
                            key={location.id} 
                            className="py-4 flex justify-between items-center"
                          >
                            <span className="text-gray-800 text-lg">{location.name}</span>
                            <button
                              onClick={() => deleteLocation(location.id, location.name)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title="Delete Location"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-gray-500 italic text-center py-4">No matching locations found</p>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-center py-4">No locations found</p>
                  )}
                </div>
              )}
              
              {/* Statuses Panel - Only shown when statuses tab is active */}
              {activeTab === 'statuses' && (
                <div className="bg-white p-6 rounded shadow-sm border border-gray-200 w-full overflow-y-auto" style={{maxHeight: 'calc(100vh - 250px)'}}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-gray-800">Project Status</h3>
                    <span className="bg-gray-100 text-gray-700 p-2 rounded-full">
                      <HiStatusOnline className="w-6 h-6" />
                    </span>
                  </div>
                  
                  {/* Search input for statuses */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md py-2 pl-10 pr-4 block w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Search status..."
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                    />
                  </div>
                  
                  <form onSubmit={addStatus} className="mb-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add new status..."
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        required
                      />
                      <button 
                        type="submit"
                        className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-r hover:bg-gray-800 transition-colors"
                      >
                        <HiPlus className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                  
                  {statuses.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {filteredStatuses.length > 0 ? (
                        filteredStatuses.map((status) => (
                          <li 
                            key={status.id} 
                            className="py-4 flex justify-between items-center"
                          >
                            <span className="text-gray-800 text-lg">{status.label}</span>
                            <button
                              onClick={() => deleteStatus(status.id, status.label)}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title="Delete Status"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-gray-500 italic text-center py-4">No matching status found</p>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic text-center py-4">No status found</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
