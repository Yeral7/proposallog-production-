'use client';

import React, { useState, useEffect } from 'react';
import { HiX, HiUpload } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';

// Import interfaces from the proposal table
import { Project } from './ProposalTable';

interface ImportProjectModalProps {
  isVisible: boolean;
  onClose: () => void;
  onProjectImported: (projectName?: string) => void;
  initialProjectData?: any;
}

export default function ImportProjectModal({ 
  isVisible, 
  onClose, 
  onProjectImported,
  initialProjectData = null 
}: ImportProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<string>('');
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isVisible) {
      setJsonData('');
      setError(null);
      setFileUploadError(null);
    }
    
    // If initial data is provided, use it
    if (isVisible && initialProjectData) {
      try {
        setJsonData(JSON.stringify(initialProjectData, null, 2));
      } catch (err) {
        console.error('Error setting initial project data:', err);
      }
    }
  }, [isVisible, initialProjectData]);
  
  // Validate and parse the JSON data
  const validateProjectData = (data: string): {valid: boolean; project?: Partial<Project>; error?: string} => {
    try {
      const parsed = JSON.parse(data);
      
      // Basic validation - ensure required fields are present
      if (!parsed.project_name) {
        return { valid: false, error: 'Project name is required' };
      }
      
      if (!parsed.builder_name) {
        return { valid: false, error: 'Builder name is required' };
      }
      
      if (!parsed.estimator_name) {
        return { valid: false, error: 'Estimator name is required' };
      }
      
      return { valid: true, project: parsed };
    } catch (err) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  };
  
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Import Project</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
          
          <form className="space-y-4">
            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="projectFile"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  setFileUploadError(null);
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const fileContent = event.target?.result as string;
                      // Try to parse it to validate JSON format
                      JSON.parse(fileContent);
                      setJsonData(fileContent);
                    } catch (err) {
                      setFileUploadError('Invalid JSON file format');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <label
                htmlFor="projectFile"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <HiUpload className="w-10 h-10 text-gray-400" />
                <span className="mt-2 text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  JSON file
                </span>
              </label>
              {fileUploadError && <p className="text-red-500 text-sm mt-2">{fileUploadError}</p>}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  or paste JSON here
                </span>
              </div>
            </div>
            
            <div>
              <textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 min-h-[200px] font-mono text-sm"
                placeholder='{"project_name": "Example Project", ...}'
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste project JSON data or use the file upload above
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!jsonData.trim()) return;
                  
                  setLoading(true);
                  setError(null);
                  
                  try {
                    // Validate the JSON data
                    const validationResult = validateProjectData(jsonData);
                    
                    if (!validationResult.valid) {
                      setError(validationResult.error || 'Invalid project data');
                      setLoading(false);
                      return;
                    }
                    
                    // Send the project data to the API
                    const projectData = validationResult.project!;
                    
                    const response = await fetchWithAuth('/api/projects', {
                      method: 'POST',
                      body: JSON.stringify(projectData),
                    });
                    
                    if (!response.ok) {
                      let errorMessage = 'Failed to import project';
                      try {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                          const errorData = await response.json();
                          errorMessage = errorData.message || errorMessage;
                        } else {
                          // Handle non-JSON responses (like HTML error pages)
                          const errorText = await response.text();
                          console.error('Non-JSON error response:', errorText);
                        }
                      } catch (parseError) {
                        console.error('Error parsing error response:', parseError);
                      }
                      throw new Error(errorMessage);
                    }
                    
                    onProjectImported(projectData.project_name);
                    onClose();
                  } catch (err) {
                    console.error('Error importing project:', err);
                    setError('Failed to import project. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !jsonData.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Import Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
