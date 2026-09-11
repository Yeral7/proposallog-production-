'use client';

/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — per-section weekly schedule page.
 * Dynamic route /labor-log/[section] for rafa | mambo | juan.
 * Orchestrates: week navigation, search, All/Internal/Subs tabs, and the
 * read/write tables (gated by canEditSection). Edits flow through
 * setCell → setEntries → appendAudit.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { CellValue, DayIndex, SECTIONS, SECTION_LABELS, SectionId, EntriesStore, Subject } from '../../../lib/laborLog/types';
import { getSubjectsForSection } from '../../../lib/laborLog/mockData';
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

const isSection = (v: string): v is SectionId => (SECTIONS as readonly string[]).includes(v);

export default function SectionPage() {
  const params = useParams<{ section: string }>();
  const sectionParam = params?.section ?? '';
  const { canViewSection, canEditSection, user } = useAuth();

  const [weekIso, setWeekIso] = useState<string>('');
  const [tab, setTab] = useState<ScheduleTab>('all');
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<EntriesStore>({});

  useEffect(() => {
    setWeekIso(weekStartIso());
    setEntries(loadEntries());
  }, []);

  // NOTE: Hooks must run in the same order every render. Compute everything
  // unconditionally, then decide what to render at the end.
  const sectionIsValid = isSection(sectionParam);
  const section: SectionId = sectionIsValid ? sectionParam : 'rafa';

  const allSubjects = useMemo(() => getSubjectsForSection(section), [section]);
  const internal = useMemo(() => allSubjects.filter((s) => s.kind === 'internal'), [allSubjects]);
  const subs = useMemo(() => allSubjects.filter((s) => s.kind === 'sub'), [allSubjects]);

  if (!sectionIsValid) {
    return <AccessDenied message="Unknown section." hint="Pick a section from the Labor Log landing page." />;
  }

  if (!canViewSection(section)) {
    return (
      <AccessDenied
        message={`You don't have permission to view the ${SECTION_LABELS[section]} section.`}
      />
    );
  }

  const q = search.trim().toLowerCase();
  const matches = (name: string, role?: string) =>
    !q || name.toLowerCase().includes(q) || (role || '').toLowerCase().includes(q);

  const filteredInternal = internal.filter((s) => matches(s.name, s.role));
  const filteredSubs = subs.filter((s) => matches(s.name));
  const hasSubs = subs.length > 0;

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
          <h1 className="text-2xl font-bold text-gray-900">
            Labor Log · {SECTION_LABELS[section]} Section
          </h1>
          <p className="text-sm text-gray-500">
            {canEditSection(section) ? 'Editor access' : 'Read-only access'}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <ScheduleSearch value={search} onChange={setSearch} />
          <WeekNavigator weekIso={weekIso} onChange={setWeekIso} />
        </div>
      </header>

      <ScheduleTabs value={tab} onChange={setTab} hasSubs={hasSubs} />

      <div className="bg-white rounded-b-lg shadow p-4 mt-0">
        {(tab === 'all' || tab === 'internal') && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Internal Team</h2>
            <InternalScheduleTable
              subjects={filteredInternal}
              entries={entries}
              weekIso={weekIso}
              canEditSection={canEditSection}
              onCellChange={handleCellChange}
            />
          </section>
        )}

        {hasSubs && (tab === 'all' || tab === 'subs') && (
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
            />
          </section>
        )}
      </div>
    </div>
  );
}
