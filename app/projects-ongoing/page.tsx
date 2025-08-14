'use client';

import React from 'react';
import Header from '../../components/Header';
import Banner from '../../components/Banner';
import { HiOutlineClipboardList, HiOutlineCog } from 'react-icons/hi';

const ProjectsOngoingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Projects Ongoing" icon={<HiOutlineClipboardList />} />
      <main className="p-4 sm:p-6 lg:p-8">
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
              Beta v 1.01
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectsOngoingPage;
