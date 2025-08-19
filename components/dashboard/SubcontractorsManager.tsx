'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HiTrash, HiPlus, HiSearch } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';

interface Subcontractor {
  id: number;
  name: string;
}

const SubcontractorsManager = () => {
  const { canDeleteData } = useAuth();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: number; name: string } | null>(null);

  const fetchSubcontractors = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/residential-subcontractors');
      const data = await res.json();
      setSubcontractors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch subcontractors:', error);
    }
  }, []);

  useEffect(() => {
    fetchSubcontractors();
  }, [fetchSubcontractors]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const response = await fetchWithAuth('/api/residential-subcontractors/add',
        {
          method: 'POST',
          body: JSON.stringify({ name: newItemName }),
        });
      if (response.ok) {
        await fetchSubcontractors();
        setNewItemName('');
      } else {
        const errorData = await response.json();
        alert(`Failed to add subcontractor: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding subcontractor:', error);
    }
  };

  const confirmDelete = (id: number, name: string) => {
    setDeleteConfirmItem({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteConfirmItem) return;

    try {
      const response = await fetchWithAuth(`/api/residential-subcontractors/delete?id=${deleteConfirmItem.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSubcontractors();
        setDeleteConfirmItem(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete: ${errorData.error || 'Unknown error'}`);
        setDeleteConfirmItem(null);
      }
    } catch (error) {
      console.error('Error deleting subcontractor:', error);
      setDeleteConfirmItem(null);
    }
  };

  const filteredData = subcontractors.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Subcontractors</h3>
        <form onSubmit={handleAddItem} className="mb-4 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Add new subcontractor..."
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
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search subcontractors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent transition duration-150 ease-in-out"
          />
        </div>
      </div>
      <div className="space-y-2">
        {filteredData.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <li key={item.id} className="py-3 flex justify-between items-center">
                <span className="text-gray-800 font-medium">{item.name}</span>
                {canDeleteData() && (
                  <button
                    onClick={() => confirmDelete(item.id, item.name)}
                    className="text-red-500 hover:text-red-700 transition duration-150 ease-in-out p-1 rounded hover:bg-red-50"
                    title={`Delete ${item.name}`}
                  >
                    <HiTrash className="h-5 w-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <p>No subcontractors found matching "{searchTerm}"</p>
            ) : (
              <p>No subcontractors available. Add one above to get started.</p>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        {searchTerm ? (
          <p>Showing {filteredData.length} of {subcontractors.length} subcontractors</p>
        ) : (
          <p>Total: {subcontractors.length} subcontractors</p>
        )}
      </div>
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
  );
};

export default SubcontractorsManager;
