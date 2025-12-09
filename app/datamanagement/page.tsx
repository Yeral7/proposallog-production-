'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HiPlus, HiTrash, HiSearch, HiPencil, HiOutlineCog, HiOutlineOfficeBuilding, HiOutlineUser, HiOutlineLocationMarker, HiOutlineCollection, HiOutlineColorSwatch, HiOutlineChartBar, HiUsers } from 'react-icons/hi';
import { toast } from 'react-toastify';
import Banner from '../../components/Banner';
import ManageBuilderContactsModal from '../../components/dashboard/ManageBuilderContactsModal';
import ProtectedRoute from '../../components/ProtectedRoute';
import Header from "../../components/Header";
import { useAuth } from '../../contexts/AuthContext';
import { fetchWithAuth } from '@/lib/apiClient';
import { logClientAuditAction } from '@/lib/clientAuditLogger';
import SubcontractorsManager from '../../components/dashboard/SubcontractorsManager';

// Define types for the data entities
interface Builder {
  id: number;
  name: string;
}

interface Estimator {
  id: number;
  name: string;
}


interface Location {
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

interface ResidentialStatus {
  id: number;
  name: string;
}

// Define the type for the active tab
type ActiveTab = 'builders' | 'estimators' | 'locations' | 'project_types' | 'project_styles' | 'progress_statuses' | 'subcontractors' | 'residential_statuses';

const DataManagementPage = () => {
  return (
    <ProtectedRoute requireManager={true}>
      <DataManagementPageContent />
    </ProtectedRoute>
  );
};

const DataManagementPageContent = () => {
  const { canDeleteData } = useAuth();
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [estimators, setEstimators] = useState<Estimator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [projectStyles, setProjectStyles] = useState<ProjectStyle[]>([]);
  const [progressStatuses, setProgressStatuses] = useState<ProgressStatus[]>([]);
  const [residentialStatuses, setResidentialStatuses] = useState<ResidentialStatus[]>([]);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('builders');
  const [managementType, setManagementType] = useState<'commercial' | 'residential'>('commercial');
  const [isManageContactsOpen, setIsManageContactsOpen] = useState(false);
  const [manageContactsBuilderId, setManageContactsBuilderId] = useState<number | null>(null);
  const [manageContactsBuilderName, setManageContactsBuilderName] = useState<string | undefined>(undefined);
  
  const [newItemName, setNewItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    id: number;
    type: ActiveTab;
    name: string;
  } | null>(null);

  const [editItem, setEditItem] = useState<{
    id: number;
    type: ActiveTab;
    name: string;
  } | null>(null);
  const [editName, setEditName] = useState('');

  const fetchAllData = useCallback(async () => {
    try {
      // Fetch different builder data based on management type
      const buildersEndpoint = managementType === 'residential' ? '/api/residential-builders' : '/api/builders';
      
      const [buildersRes, estimatorsRes, locationsRes, projectTypesRes, projectStylesRes, progressStatusesRes] = await Promise.all([
        fetchWithAuth(buildersEndpoint),
        fetchWithAuth('/api/estimators'),
        fetchWithAuth('/api/locations'),
        fetchWithAuth('/api/project-types'),
        fetchWithAuth('/api/project-styles'),
        fetchWithAuth('/api/progress-statuses'),
      ]);

      const buildersData = await buildersRes.json();
      const estimatorsData = await estimatorsRes.json();
      const locationsData = await locationsRes.json();
      const projectTypesData = await projectTypesRes.json();
      const projectStylesData = await projectStylesRes.json();
      const progressStatusesData = await progressStatusesRes.json();

      // API returns data directly as arrays, not wrapped in objects
      setBuilders(Array.isArray(buildersData) ? buildersData : []);
      setEstimators(Array.isArray(estimatorsData) ? estimatorsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setProjectTypes(Array.isArray(projectTypesData) ? projectTypesData : []);
      setProjectStyles(Array.isArray(projectStylesData) ? projectStylesData : []);
      setProgressStatuses(Array.isArray(progressStatusesData) ? progressStatusesData : []);
      
      // Residential-only: fetch residential statuses
      if (managementType === 'residential') {
        try {
          const resStatusesRes = await fetchWithAuth('/api/residential-statuses');
          const resStatusesData = await resStatusesRes.json();
          setResidentialStatuses(Array.isArray(resStatusesData) ? resStatusesData : []);
        } catch (e) {
          console.error('Failed to fetch residential statuses:', e);
          setResidentialStatuses([]);
        }
      } else {
        setResidentialStatuses([]);
      }
      
      console.log('Fetched data:', {
        builders: buildersData,
        estimators: estimatorsData,
        locations: locationsData
      });

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [managementType]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      // Use different endpoints based on management type
      let endpoint = `/api/${activeTab}/add`;
      if (managementType === 'residential' && activeTab === 'builders') {
        endpoint = '/api/residential-builders/add';
      } else if (activeTab === 'project_types') {
        endpoint = '/api/project-types';
      } else if (activeTab === 'project_styles') {
        endpoint = '/api/project-styles';
      } else if (activeTab === 'progress_statuses') {
        endpoint = '/api/progress-statuses';
      } else if (managementType === 'residential' && activeTab === 'residential_statuses') {
        endpoint = '/api/residential-statuses';
      }
      
      const response = await fetchWithAuth(endpoint,
        {
          method: 'POST',
          body: JSON.stringify({ name: newItemName }),
        });
      if (response.ok) {
        await fetchAllData();
        setNewItemName('');
        toast.success(`${activeTab.slice(0, -1)} "${newItemName}" added successfully!`);
        
        // Log audit action
        await logClientAuditAction({
          page: 'Data Management',
          action: `Added new ${activeTab.slice(0, -1)}: "${newItemName}"`
        });
      } else {
        const errorData = await response.json();
        toast.error(`Failed to add ${activeTab.slice(0, -1)}: ${errorData.message || 'Unknown error'}`);
        console.error(`Failed to add ${activeTab}:`, errorData);
      }
    } catch (error) {
      toast.error(`Error adding ${activeTab.slice(0, -1)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Error adding ${activeTab}:`, error);
    }
  };

  const confirmDelete = (id: number, type: ActiveTab, name: string) => {
    setDeleteConfirmItem({ id, type, name });
  };

  const handleEditItem = (id: number, type: ActiveTab, name: string) => {
    setEditItem({ id, type, name });
    setEditName(name);
  };

  const executeEdit = async () => {
    if (!editItem) return;

    const { id, type } = editItem;

    try {
      let endpoint = `/api/${type}`;
      if (managementType === 'residential' && type === 'builders') {
        endpoint = `/api/residential-builders`;
      } else if (type === 'project_types') {
        endpoint = `/api/project-types`;
      } else if (type === 'project_styles') {
        endpoint = `/api/project-styles`;
      } else if (type === 'progress_statuses') {
        endpoint = `/api/progress-statuses`;
      } else if (type === 'residential_statuses') {
        endpoint = `/api/residential-statuses`;
      }
      
      const response = await fetchWithAuth(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          name: editName
        }),
      });

      if (response.ok) {
        await fetchAllData();
        toast.success(`${editItem.type.slice(0, -1)} updated successfully!`);
        
        // Log audit action
        await logClientAuditAction({
          page: 'Data Management',
          action: `Updated ${editItem.type.slice(0, -1)}: "${editItem.name}" to "${editName}"`
        });
        
        setEditItem(null);
        setEditName('');
      } else {
        const errorData = await response.json();
        toast.error(`Failed to update: ${errorData.message || 'Unknown error'}`);
        setEditItem(null);
        setEditName('');
      }
    } catch (error) {
      toast.error(`Error updating ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Error updating ${type}:`, error);
      setEditItem(null);
      setEditName('');
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmItem) return;

    const { id, type } = deleteConfirmItem;

    try {
      // Use different endpoints based on management type and new metadata tables
      let endpoint = `/api/${type}/delete?id=${id}`;
      if (managementType === 'residential' && type === 'builders') {
        endpoint = `/api/residential-builders/delete?id=${id}`;
      } else if (type === 'project_types') {
        endpoint = `/api/project-types?id=${id}`;
      } else if (type === 'project_styles') {
        endpoint = `/api/project-styles?id=${id}`;
      } else if (type === 'progress_statuses') {
        endpoint = `/api/progress-statuses?id=${id}`;
      } else if (type === 'residential_statuses') {
        endpoint = `/api/residential-statuses?id=${id}`;
      }
      
      const response = await fetchWithAuth(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAllData();
        toast.success(`${deleteConfirmItem.type.slice(0, -1)} "${deleteConfirmItem.name}" deleted successfully!`);
        
        // Log audit action
        await logClientAuditAction({
          page: 'Data Management',
          action: `Deleted ${deleteConfirmItem.type.slice(0, -1)}: "${deleteConfirmItem.name}"`
        });
        
        setDeleteConfirmItem(null);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete: ${errorData.message || 'Unknown error'}`);
        setDeleteConfirmItem(null);
      }
    } catch (error) {
      toast.error(`Error deleting ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Error deleting ${type}:`, error);
      setDeleteConfirmItem(null);
    }
  };

  const renderTabContent = () => {
    let data: {id: number, name: string}[] = [];
    let placeholder = '';
    let entityName = '';
    const addItem = async () => {
      if (!newItemName.trim()) return;

      try {
        let endpoint = '';
        let entityName = '';
        
        switch (activeTab) {
          case 'builders':
            endpoint = managementType === 'residential' ? '/api/residential-builders' : '/api/builders';
            entityName = 'Builder';
            break;
          case 'estimators':
            endpoint = '/api/estimators';
            entityName = 'Estimator';
            break;
          case 'locations':
            endpoint = '/api/locations';
            entityName = 'Location';
            break;
          case 'project_types':
            endpoint = '/api/project-types';
            entityName = 'Project Type';
            break;
          case 'project_styles':
            endpoint = '/api/project-styles';
            entityName = 'Project Style';
            break;
          case 'progress_statuses':
            endpoint = '/api/progress-statuses';
            entityName = 'Progress Status';
            break;
          case 'subcontractors':
            endpoint = '/api/residential-subcontractors';
            entityName = 'Subcontractor';
            break;
        }
        
        const response = await fetchWithAuth(endpoint,
          {
            method: 'POST',
            body: JSON.stringify({ name: newItemName }),
          });
        if (response.ok) {
          await fetchAllData();
          setNewItemName('');
          toast.success(`${entityName} "${newItemName}" added successfully!`);
          
          // Log audit action
          await logClientAuditAction({
            page: 'Data Management',
            action: `Added new ${activeTab.slice(0, -1)}: "${newItemName}"`
          });
        } else {
          const errorData = await response.json();
          toast.error(`Failed to add ${entityName}: ${errorData.message || 'Unknown error'}`);
          console.error(`Failed to add ${activeTab}:`, errorData);
        }
      } catch (error) {
        toast.error(`Error adding ${entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`Error adding ${activeTab}:`, error);
      }
    };

    if (activeTab === 'subcontractors') {
      return <SubcontractorsManager />;
    }

    switch(activeTab) {
        case 'builders':
            data = builders;
            placeholder = 'Add new builder...';
            entityName = 'Builders';
            break;
        case 'estimators':
            data = estimators;
            placeholder = 'Add new estimator...';
            entityName = 'Estimators';
            break;
        case 'locations':
            data = locations;
            placeholder = 'Add new location...';
            entityName = 'Locations';
            break;
        case 'project_types':
            data = projectTypes;
            placeholder = 'Add new project type...';
            entityName = 'Project Types';
            break;
        case 'project_styles':
            data = projectStyles;
            placeholder = 'Add new project style...';
            entityName = 'Project Styles';
            break;
        case 'progress_statuses':
            data = progressStatuses;
            placeholder = 'Add new progress status...';
            entityName = 'Progress Statuses';
            break;
        case 'residential_statuses':
            data = residentialStatuses;
            placeholder = 'Add new residential status...';
            entityName = 'Residential Statuses';
            break;
    }

    // Filter data based on search term
    const filteredData = data.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{entityName}</h3>
                
                {/* Add new item form */}
                <form onSubmit={handleAddItem} className="mb-4 flex items-center space-x-2">
                    <input 
                        type="text" 
                        placeholder={placeholder}
                        value={newItemName} 
                        onChange={(e) => setNewItemName(e.target.value)} 
                        className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition duration-150 ease-in-out" 
                        required 
                    />
                    <button 
                        type="submit" 
                        className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-r-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] transition duration-150 ease-in-out"
                    >
                        <HiPlus className="h-5 w-5" />
                    </button>
                </form>
                
                {/* Search input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={`Search ${entityName.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent transition duration-150 ease-in-out"
                    />
                </div>
            </div>
            
            {/* Items list */}
            <div className="space-y-2">
                {filteredData.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                        {filteredData.map((item) => (
                            <li key={item.id} className="py-3 flex justify-between items-center">
                                <span className="text-gray-800 font-medium">{item.name}</span>
                                <div className="flex space-x-2">
                                    {/* Manage Contacts available for builders tab only */}
                                    {activeTab === 'builders' && (
                                      <button
                                        onClick={() => { setManageContactsBuilderId(item.id); setManageContactsBuilderName(item.name); setIsManageContactsOpen(true); }}
                                        className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                                        title={`Manage Contacts for ${item.name}`}
                                      >
                                        <HiUsers className="w-4 h-4" />
                                      </button>
                                    )}
                                    {canDeleteData() && (
                                      <>
                                        <button 
                                            onClick={() => handleEditItem(item.id, activeTab, item.name)} 
                                            className="p-1 bg-gray-200 rounded-md text-gray-600 hover:bg-gray-300"
                                            title={`Edit ${item.name}`}
                                        >
                                            <HiPencil className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => confirmDelete(item.id, activeTab, item.name)} 
                                            className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out p-1 rounded hover:bg-red-50"
                                            title={`Delete ${item.name}`}
                                        >
                                            <HiTrash className="h-5 w-5" />
                                        </button>
                                      </>
                                    )}
                                </div>
                            </li>
                        ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                        {searchTerm ? (
                            <p>No {entityName.toLowerCase()} found matching "{searchTerm}"</p>
                        ) : (
                            <p>No {entityName.toLowerCase()} available. Add one above to get started.</p>
                        )}
                  </div>
                )}
            </div>
            
            {/* Show count */}
            <div className="mt-4 text-sm text-gray-600">
                {searchTerm ? (
                    <p>Showing {filteredData.length} of {data.length} {entityName.toLowerCase()}</p>
                ) : (
                    <p>Total: {data.length} {entityName.toLowerCase()}</p>
                )}
            </div>
        </div>
    );
  };

  const TabButton = ({ tabName, label, icon: Icon }: { tabName: ActiveTab, label: string, icon: React.ElementType }) => (
    <button 
      onClick={() => setActiveTab(tabName)} 
      className={`${activeTab === tabName ? 'border-[var(--primary-color)] text-[var(--primary-color)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center transition duration-150 ease-in-out`}
    >
      <Icon className="mr-2 h-5 w-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <Banner title="Data Management" icon={<HiOutlineCog />} />

        <div className="mt-8">
          <div className="mb-6 flex justify-center">
            <div className="relative flex p-1 bg-gray-200 rounded-full">
              <button
                onClick={() => { setManagementType('commercial'); setActiveTab('builders'); }}
                className={`relative z-10 flex items-center justify-center w-32 h-10 text-sm font-medium rounded-full transition-colors ${managementType === 'commercial' ? 'text-white' : 'text-gray-600'}`}>
                Commercial
              </button>
              <button
                onClick={() => { setManagementType('residential'); setActiveTab('builders'); }}
                className={`relative z-10 flex items-center justify-center w-32 h-10 text-sm font-medium rounded-full transition-colors ${managementType === 'residential' ? 'text-white' : 'text-gray-600'}`}>
                Residential
              </button>
              <span
                className={`absolute top-1 left-1 w-32 h-10 bg-[var(--primary-color)] rounded-full transition-transform duration-300 ease-in-out ${managementType === 'residential' ? 'translate-x-full' : ''}`}>
              </span>
            </div>
          </div>
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              {managementType === 'commercial' ? (
                <>
                  <TabButton tabName="builders" label="Builders" icon={HiOutlineOfficeBuilding} />
                  <TabButton tabName="estimators" label="Estimators" icon={HiOutlineUser} />
                  <TabButton tabName="locations" label="Locations" icon={HiOutlineLocationMarker} />
                  <TabButton tabName="project_types" label="Project Types" icon={HiOutlineCollection} />
                  <TabButton tabName="project_styles" label="Project Styles" icon={HiOutlineColorSwatch} />
                  <TabButton tabName="progress_statuses" label="Progress Statuses" icon={HiOutlineChartBar} />
                </>
              ) : (
                <>
                  <TabButton tabName="builders" label="Builders" icon={HiOutlineOfficeBuilding} />
                  <TabButton tabName="subcontractors" label="Subcontractors" icon={HiUsers} />
                  <TabButton tabName="residential_statuses" label="Residential Statuses" icon={HiOutlineChartBar} />
                </>
              )}
            </nav>
          </div>

          {renderTabContent()}

          {deleteConfirmItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete <span className="font-semibold">{deleteConfirmItem.name}</span>? This action cannot be undone.</p>
                <div className="mt-6 flex justify-end space-x-3">
                  <button onClick={() => setDeleteConfirmItem(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out">Cancel</button>
                  <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center transition duration-150 ease-in-out">
                    <HiTrash className="mr-2 h-5 w-5" />
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Item Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit {editItem.type.slice(0, -1)}
            </h3>
            <div className="mb-4">
              <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter name"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditItem(null);
                  setEditName('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-[var(--accent-gray)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={executeEdit}
                disabled={!editName.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{deleteConfirmItem.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Builder Contacts Modal */}
      <ManageBuilderContactsModal
        isVisible={isManageContactsOpen}
        onClose={() => { setIsManageContactsOpen(false); setManageContactsBuilderId(null); setManageContactsBuilderName(undefined); }}
        builderId={manageContactsBuilderId}
        builderName={manageContactsBuilderName}
      />
    </div>
  );
};

export default DataManagementPage;
