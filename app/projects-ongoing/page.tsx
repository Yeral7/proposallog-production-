'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Header from '../../components/Header';
import Banner from '../../components/Banner';
import { HiOutlineClipboardList } from 'react-icons/hi';

const ProjectsOngoingClient = dynamic(
  () => import('../../components/dashboard/ProjectsOngoingClient'),
  { ssr: false }
);

const ProjectsOngoingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Banner title="Projects Ongoing" icon={<HiOutlineClipboardList />} />
      <main className="p-4 sm:p-6 lg:p-8">
        <ProjectsOngoingClient />
      </main>
    </div>
  );
};

export default ProjectsOngoingPage;
