'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireManager?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false, requireManager = false }) => {
  const { user, loading, canAccessAdmin, canAccessDataManagement } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for the auth state to load
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (requireAdmin && !canAccessAdmin()) {
      router.push('/'); // Redirect non-admins from admin pages
      return;
    }

    if (requireManager && !canAccessDataManagement()) {
      router.push('/'); // Redirect users without manager access
      return;
    }
  }, [user, loading, requireAdmin, requireManager, router, canAccessAdmin, canAccessDataManagement]);

  // Render a loading state or nothing while checking auth
  if (loading || !user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        </div>
    );
  }

  // Check permissions before rendering children to prevent flash of content
  if (requireAdmin && !canAccessAdmin()) {
    return null; // Or a loading/unauthorized component
  }

  if (requireManager && !canAccessDataManagement()) {
    return null; // Or a loading/unauthorized component
  }

  return <>{children}</>;
};

export default ProtectedRoute;
