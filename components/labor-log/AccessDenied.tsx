'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — Standard "you can't view this" page.
 * Used by /labor-log routes when the current user lacks the required tags.
 */
import React from 'react';
import Link from 'next/link';
import { HiOutlineLockClosed } from 'react-icons/hi';

interface Props {
  message?: string;
  hint?: string;
}

const AccessDenied: React.FC<Props> = ({
  message = "You don't have permission to view this section.",
  hint = 'Ask your admin for access, or use the Switch View button in the sidebar to test as another user.',
}) => (
  <div className="flex items-center justify-center min-h-[60vh] p-8">
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
      <HiOutlineLockClosed className="mx-auto text-gray-400" size={48} />
      <h2 className="text-xl font-semibold text-gray-800 mt-4">Access denied</h2>
      <p className="text-gray-600 mt-2">{message}</p>
      <p className="text-sm text-gray-500 mt-3">{hint}</p>
      <Link
        href="/labor-log"
        className="inline-block mt-5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Back to Labor Log
      </Link>
    </div>
  </div>
);

export default AccessDenied;
