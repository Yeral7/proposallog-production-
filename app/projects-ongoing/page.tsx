'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Banner from '../../components/Banner';
import { HiOutlineClipboardList, HiOutlineCog } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

const ProjectsOngoingPage = () => {
  // State for data refresh mechanism
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dataChangeDetected, setDataChangeDetected] = useState(false);
  const [lastDataHash, setLastDataHash] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const { canAccessAdmin } = useAuth(); // Use auth context to check admin status

  // Set up auto-refresh on component mount
  useEffect(() => {
    // Initial fetch when component mounts
    fetchOngoingProjects(false);
    
    // Set up interval for regular silent refreshes
    refreshIntervalRef.current = setInterval(() => {
      fetchOngoingProjects(true);
    }, 30000); // Refresh every 30 seconds
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Simple hash function to detect data changes
  const hashData = (data: any[]): string => {
    return data.map(item => item.id + '-' + 
      (item.updated_at || item.completion_date || '')
    ).join('|');
  };

  // Fetch ongoing projects (placeholder for now)
  const fetchOngoingProjects = async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      // This is a placeholder - once the API is ready, uncomment this
      // const response = await fetchWithAuth('/api/projects/ongoing');
      // if (!response.ok) throw new Error('Failed to fetch ongoing projects');
      // const data = await response.json();
      
      // Placeholder data - will be replaced with actual API call
      const data: any[] = [];
      
      // Check if data has changed since last fetch
      const newDataHash = hashData(data);
      if (lastDataHash && newDataHash !== lastDataHash && silent) {
        setDataChangeDetected(true);
        // Only show notification to admin users
        if (canAccessAdmin()) {
          setNotification('Projects data was updated');
          setTimeout(() => setNotification(null), 5000);
        }
      }
      
      setLastDataHash(newDataHash);
      // setProjects(data); // Uncomment when projects state is added
      setLastRefreshTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching ongoing projects:', err);
      if (!silent) {
        setError('Failed to load projects. Please try again.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      } 
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Projects Ongoing" icon={<HiOutlineClipboardList />} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col">
          {/* Header with refresh controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ongoing Projects</h1>
              {lastRefreshTime && (
                <div className="text-xs text-gray-500 mt-1 flex items-center">
                  <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
                  {dataChangeDetected && (
                    <span className="ml-2 text-green-600 font-medium">• Data updated</span>
                  )}
                  {isRefreshing && (
                    <span className="ml-2 inline-block">
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500"></div>
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Refresh button */}
            <button
              onClick={() => {
                fetchOngoingProjects();
                setDataChangeDetected(false);
              }}
              disabled={isLoading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base ${dataChangeDetected ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'} text-gray-700 rounded-md flex items-center gap-2 shadow-sm hover:bg-gray-50 justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {/* Content placeholder */}
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-center">
              <HiOutlineCog className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Projects Ongoing - Under Development
              </h3>
              <p className="text-gray-500 max-w-md">
                This feature is being rebuilt with enhanced functionality. 
                Check back soon for the new and improved projects ongoing dashboard.
              </p>
              <div className="mt-4 text-sm text-gray-400">
                Beta v 1.02
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Notification toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{notification}</span>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-4 text-green-700 hover:text-green-900"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsOngoingPage;
