'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Banner from '../../components/Banner';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineOfficeBuilding, HiOutlineExclamation } from 'react-icons/hi';
import { fetchWithAuth } from '@/lib/apiClient';

interface Project {
  id: number;
  project_name: string;
  builder_name: string;
  priority: string;
}

interface BuilderStats {
  builder: string;
  project_count: number;
}

const CommercialPage = () => {
  const [highPriorityProjects, setHighPriorityProjects] = useState<Project[]>([]);
  const [topBuilder, setTopBuilder] = useState<BuilderStats | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (highPriorityProjects.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % highPriorityProjects.length);
      }, 3000); // Change slide every 3 seconds
      return () => clearInterval(interval);
    }
  }, [highPriorityProjects.length]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetchWithAuth('/api/projects');
      if (response.ok) {
        const projects = await response.json();
        
        // Filter high priority projects
        const highPriority = projects.filter((p: Project) => 
          p.priority && p.priority.toLowerCase() === 'high'
        );
        setHighPriorityProjects(highPriority);
        
        // Calculate most used builder
        const builderCounts: { [key: string]: number } = {};
        projects.forEach((project: Project) => {
          if (project.builder_name && project.builder_name !== 'N/A') {
            builderCounts[project.builder_name] = (builderCounts[project.builder_name] || 0) + 1;
          }
        });
        
        const topBuilderEntry = Object.entries(builderCounts)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (topBuilderEntry) {
          setTopBuilder({
            builder: topBuilderEntry[0],
            project_count: topBuilderEntry[1]
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Commercial Dashboard" icon={<HiOutlineViewGrid />} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* High Priority Projects Slideshow - Left */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HiOutlineExclamation className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">High Priority Projects</h3>
                <p className="text-sm text-gray-500">Projects requiring immediate attention</p>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              </div>
            ) : highPriorityProjects.length > 0 ? (
              <div className="relative">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="text-xl font-bold text-gray-900">
                    {highPriorityProjects[currentSlide]?.project_name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {highPriorityProjects[currentSlide]?.builder_name}
                  </div>
                </div>
                
                {highPriorityProjects.length > 1 && (
                  <div className="flex justify-center mt-3 space-x-2">
                    {highPriorityProjects.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentSlide ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {currentSlide + 1} of {highPriorityProjects.length}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineExclamation className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No high priority projects</p>
              </div>
            )}
          </div>

          {/* Most Used Builder - Right */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HiOutlineOfficeBuilding className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Top Builder</h3>
                <p className="text-sm text-gray-500">Most frequently used builder</p>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : topBuilder ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {topBuilder.builder}
                </div>
                <div className="text-lg text-blue-600 font-semibold">
                  {topBuilder.project_count} projects
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Most active builder
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HiOutlineOfficeBuilding className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No builder data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <HiOutlineChartBar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Commercial Dashboard - Coming Soon
            </h3>
            <p className="text-gray-500 max-w-2xl mx-auto mb-6">
              This dashboard will provide insights from tools like 
              Proposal Log and Projects Ongoing data, working with future integrations of project timelines, 
              revenue tracking, and performance metrics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Project Analytics
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Revenue Tracking
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Timeline Management
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Performance Metrics
              </div>
            </div>
            <div className="mt-6 text-sm text-gray-400">
              Beta v 1.05
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommercialPage;
