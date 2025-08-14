'use client';

import React from 'react';
import Header from '../../components/Header';
import Banner from '../../components/Banner';
import { HiOutlineViewGrid, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineTrendingUp } from 'react-icons/hi';

const CommercialPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Commercial Dashboard" icon={<HiOutlineViewGrid />} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Stats Cards */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <HiOutlineClipboardList className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Active Projects</h3>
                <p className="text-sm text-gray-500">Projects currently in progress</p>
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-gray-900">--</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <HiOutlineTrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Proposals Pending</h3>
                <p className="text-sm text-gray-500">Awaiting client response</p>
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-gray-900">--</div>
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
              Beta v 1.01
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommercialPage;
