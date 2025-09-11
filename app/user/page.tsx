'use client';

import React from 'react';
import Header from '../../components/Header';
import Banner from '../../components/Banner';
import { HiOutlineUser, HiOutlineBell } from 'react-icons/hi';

const UserPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="User" icon={<HiOutlineUser />} />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Tasks</h2>
            <p className="text-sm text-gray-600">This is a placeholder. We will surface your upcoming tasks here.</p>
          </section>

          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
              <HiOutlineBell className="text-gray-500" />
            </div>
            <p className="text-sm text-gray-600">This is a placeholder. Notifications will appear here.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default UserPage;
