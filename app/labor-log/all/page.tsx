'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — All Sections (finance / payables) page.
 * Merged view across Rafa + Mambo + Juan. Adds a "Section" column to both
 * tables. Gated by labor:view:all (or wider). Same edit gating as section
 * pages — edits only land where the user has labor:edit:<section>.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { CellValue, DayIndex, EntriesStore, Subject } from '../../../lib/laborLog/types';
import { getAllSubjects } from '../../../lib/laborLog/mockData';
import { getCell, loadEntries, setCell } from '../../../lib/laborLog/store';
import { weekStartIso } from '../../../lib/laborLog/weekUtils';
import { appendAudit } from '../../../lib/laborLog/audit';
import WeekNavigator from '../../../components/labor-log/WeekNavigator';
import ScheduleTabs, { ScheduleTab } from '../../../components/labor-log/ScheduleTabs';
import ScheduleSearch from '../../../components/labor-log/ScheduleSearch';
import InternalScheduleTable from '../../../components/labor-log/InternalScheduleTable';
import SubScheduleTable from '../../../components/labor-log/SubScheduleTable';
import AccessDenied from '../../../components/labor-log/AccessDenied';
import SectionPicker from '../../../components/labor-log/SectionPicker';

export default function AllSectionsPage() {
  const { canViewAllSections, canEditSection, user } = useAuth();

  const [weekIso, setWeekIso] = useState<string>('');
  const [tab, setTab] = useState<ScheduleTab>('all');
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<EntriesStore>({});

  useEffect(() => {
    setWeekIso(weekStartIso());
    setEntries(loadEntries());
  }, []);

  if (!canViewAllSections()) {
    return (
      <AccessDenied
        message="You don't have permission to view all sections."
        hint="This view is for Finance / Payables only."
      />
    );
  }

  const allSubjects = useMemo(() => getAllSubjects(), []);
  const internal = useMemo(() => allSubjects.filter((s) => s.kind === 'internal'), [allSubjects]);
  const subs = useMemo(() => allSubjects.filter((s) => s.kind === 'sub'), [allSubjects]);

  const q = search.trim().toLowerCase();
  const matches = (name: string, role?: string, section?: string) =>
    !q ||
    name.toLowerCase().includes(q) ||
    (role || '').toLowerCase().includes(q) ||
    (section || '').toLowerCase().includes(q);

  const filteredInternal = internal.filter((s) => matches(s.name, s.role, s.section));
  const filteredSubs = subs.filter((s) => matches(s.name, undefined, s.section));

  const handleCellChange = (subject: Subject, day: DayIndex, next: CellValue) => {
    const before = getCell(entries, weekIso, subject.id, day) ?? null;
    const nextStore = setCell(weekIso, subject.id, day, next);
    setEntries({ ...nextStore });
    appendAudit({
      ts: new Date().toISOString(),
      userId: user?.id || 'anon',
      userName: user?.name || user?.email || 'anon',
      section: subject.section,
      subjectId: subject.id,
      subjectName: subject.name,
      weekIso,
      day,
      before,
      after: next,
    });
  };

  if (!weekIso) {
    return <div className="p-6 text-gray-500">Loading…</div>;
  }

  return (
    <div className="p-6">
      <SectionPicker />
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Labor Log · All Sections</h1>
          <p className="text-sm text-gray-500">Merged Rafa + Mambo + Juan · Finance / Payables view</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <ScheduleSearch value={search} onChange={setSearch} />
          <WeekNavigator weekIso={weekIso} onChange={setWeekIso} />
        </div>
      </header>

      <ScheduleTabs value={tab} onChange={setTab} hasSubs={subs.length > 0} />

      <div className="bg-white rounded-b-lg shadow p-4">
        {(tab === 'all' || tab === 'internal') && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Internal Team</h2>
            <InternalScheduleTable
              subjects={filteredInternal}
              entries={entries}
              weekIso={weekIso}
              canEditSection={canEditSection}
              onCellChange={handleCellChange}
              showSection
            />
          </section>
        )}

        {(tab === 'all' || tab === 'subs') && subs.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Subcontractors</h2>
            <p className="text-xs text-gray-500 mb-2">
              Dispatch board — daily project/location only, no day totals.
            </p>
            <SubScheduleTable
              subjects={filteredSubs}
              entries={entries}
              weekIso={weekIso}
              canEditSection={canEditSection}
              onCellChange={handleCellChange}
              showSection
            />
          </section>
        )}
      </div>
    </div>
  );
}
