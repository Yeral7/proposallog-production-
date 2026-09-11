'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — landing route.
 * Auto-routes to /labor-log/all (finance users) or /labor-log/<first-accessible-section>
 * (everyone else). Renders AccessDenied if the user has no labor permissions.
 */
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { SECTIONS, SectionId } from '../../lib/laborLog/types';
import AccessDenied from '../../components/labor-log/AccessDenied';

/**
 * Labor Log entry point.
 * Skips a "pick a section" screen — auto-routes to the user's natural view:
 *   - If they can see all sections (finance/Allisson) → /labor-log/all
 *   - If they can see exactly one section → /labor-log/<that-section>
 *   - If multiple but not "all" → the first accessible section
 *   - Otherwise → access denied
 */
export default function LaborLogLanding() {
  const router = useRouter();
  const { canAccessLaborLog, canViewSection, canViewAllSections, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!canAccessLaborLog()) return;

    if (canViewAllSections()) {
      router.replace('/labor-log/all');
      return;
    }
    const accessible = (SECTIONS as readonly SectionId[]).filter((s) => canViewSection(s));
    if (accessible.length > 0) {
      router.replace(`/labor-log/${accessible[0]}`);
    }
  }, [loading, canAccessLaborLog, canViewAllSections, canViewSection, router]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading…</div>;
  }

  if (!canAccessLaborLog()) {
    return (
      <AccessDenied
        message="You don't have access to the Labor Log."
        hint="This tool is for Project Managers, Field Managers, and Finance/Payables."
      />
    );
  }

  // Brief intermediate state while router.replace runs
  return <div className="p-6 text-gray-500">Opening your schedule…</div>;
}
