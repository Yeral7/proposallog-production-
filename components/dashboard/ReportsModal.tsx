'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { HiX } from 'react-icons/hi';
import type { FilterOptions } from './FilterProjectsModal';
import type { SortDirection, SortField } from './ProposalTable';

export type ReportScope = 'filtered' | 'all';
export type ReportType = 'detailed' | 'summary' | 'detailed_summary';
export type ReportColumn =
  | 'project_name'
  | 'builder_name'
  | 'estimator_name'
  | 'status_label'
  | 'location_name'
  | 'due_date'
  | 'submission_date'
  | 'follow_up_date'
  | 'contract_value'
  | 'priority_name'
  | 'contacts'
  | 'notes'
  | 'lost_reason';

export interface ReportConfig {
  scope: ReportScope;
  reportType: ReportType;
  selectedColumns: ReportColumn[];
  useCurrentTableSorting: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  searchText: string;
  filters: FilterOptions;
}

interface ReportsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onGenerate: (config: ReportConfig) => void;
  initialConfig: ReportConfig;
  filteredRowCount: number;
  totalRowCount: number;
  isGenerating?: boolean;
}

const columnOptions: Array<{ value: ReportColumn; label: string; defaultSelected: boolean }> = [
  { value: 'project_name', label: 'Project Name', defaultSelected: true },
  { value: 'builder_name', label: 'Builder', defaultSelected: true },
  { value: 'estimator_name', label: 'Estimator', defaultSelected: true },
  { value: 'status_label', label: 'Status', defaultSelected: true },
  { value: 'location_name', label: 'Location', defaultSelected: true },
  { value: 'due_date', label: 'Due Date', defaultSelected: true },
  { value: 'submission_date', label: 'Submission Date', defaultSelected: true },
  { value: 'follow_up_date', label: 'Follow-up Date', defaultSelected: true },
  { value: 'contract_value', label: 'Contract Value', defaultSelected: true },
  { value: 'priority_name', label: 'Priority', defaultSelected: true },
  { value: 'contacts', label: 'Contacts', defaultSelected: false },
  { value: 'notes', label: 'Notes', defaultSelected: false },
  { value: 'lost_reason', label: 'Lost Reason', defaultSelected: false },
];

const sortOptions: Array<{ value: Exclude<SortField, null>; label: string }> = [
  { value: 'project_name', label: 'Project Name' },
  { value: 'builder_name', label: 'Builder' },
  { value: 'location', label: 'Location' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'submission_date', label: 'Submission Date' },
  { value: 'contract_value', label: 'Contract Value' },
  { value: 'follow_up_date', label: 'Follow-up Date' },
];

export default function ReportsModal({
  isVisible,
  onClose,
  onGenerate,
  initialConfig,
  filteredRowCount,
  totalRowCount,
  isGenerating = false,
}: ReportsModalProps) {
  const [scope, setScope] = useState<ReportScope>(initialConfig.scope);
  const [reportType, setReportType] = useState<ReportType>(initialConfig.reportType);
  const [selectedColumns, setSelectedColumns] = useState<ReportColumn[]>(initialConfig.selectedColumns);
  const [useCurrentTableSorting, setUseCurrentTableSorting] = useState<boolean>(initialConfig.useCurrentTableSorting);
  const [sortField, setSortField] = useState<SortField>(initialConfig.sortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialConfig.sortDirection);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    setScope(initialConfig.scope);
    setReportType(initialConfig.reportType);
    setSelectedColumns(initialConfig.selectedColumns);
    setUseCurrentTableSorting(initialConfig.useCurrentTableSorting);
    setSortField(initialConfig.sortField);
    setSortDirection(initialConfig.sortDirection);
    setError(null);
  }, [isVisible, initialConfig]);

  const scopeDescription = useMemo(() => {
    if (scope === 'filtered') {
      return `${filteredRowCount} matching row${filteredRowCount === 1 ? '' : 's'} will be included.`;
    }

    return `${totalRowCount} total row${totalRowCount === 1 ? '' : 's'} will be included.`;
  }, [filteredRowCount, scope, totalRowCount]);

  const currentSortLabel = useMemo(() => {
    if (!initialConfig.sortField || !initialConfig.sortDirection) {
      return 'No table sorting is currently applied.';
    }

    const option = sortOptions.find((item) => item.value === initialConfig.sortField);
    const directionLabel = initialConfig.sortDirection === 'asc' ? 'Ascending' : 'Descending';
    return `${option?.label || 'Selected field'} · ${directionLabel}`;
  }, [initialConfig.sortDirection, initialConfig.sortField]);

  const includesDetailedSheet = reportType === 'detailed' || reportType === 'detailed_summary';

  const toggleColumn = (column: ReportColumn) => {
    setSelectedColumns((current) => {
      if (current.includes(column)) {
        return current.filter((item) => item !== column);
      }

      return [...current, column];
    });
  };

  const handleGenerate = () => {
    if (includesDetailedSheet && !selectedColumns.length) {
      setError('Select at least one column for the detailed report.');
      return;
    }

    if (!useCurrentTableSorting && (!sortField || !sortDirection)) {
      setError('Choose a sort field and direction, or use the current table sorting.');
      return;
    }

    setError(null);
    onGenerate({
      scope,
      reportType,
      selectedColumns,
      useCurrentTableSorting,
      sortField,
      sortDirection,
      searchText: initialConfig.searchText,
      filters: initialConfig.filters,
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Reports</h2>
              <p className="text-sm text-gray-500 mt-1">Build a report separately from the Proposal Log table view.</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <section className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Scope</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`border rounded-lg px-4 py-3 cursor-pointer ${scope === 'filtered' ? 'border-[var(--primary-color)] bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="report-scope"
                      value="filtered"
                      checked={scope === 'filtered'}
                      onChange={() => setScope('filtered')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Current filtered results</div>
                      <div className="text-sm text-gray-500">Uses the current search and filters, and exports all matching rows.</div>
                    </div>
                  </div>
                </label>
                <label className={`border rounded-lg px-4 py-3 cursor-pointer ${scope === 'all' ? 'border-[var(--primary-color)] bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="report-scope"
                      value="all"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-800">All projects</div>
                      <div className="text-sm text-gray-500">Ignores the current filtered row count and includes the full proposal log dataset.</div>
                    </div>
                  </div>
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-3">{scopeDescription}</p>
            </section>

            <section className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Report type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`border rounded-lg px-4 py-3 cursor-pointer ${reportType === 'detailed' ? 'border-[var(--primary-color)] bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="report-type"
                      value="detailed"
                      checked={reportType === 'detailed'}
                      onChange={() => setReportType('detailed')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Detailed</div>
                      <div className="text-sm text-gray-500">One row per project.</div>
                    </div>
                  </div>
                </label>
                <label className={`border rounded-lg px-4 py-3 cursor-pointer ${reportType === 'summary' ? 'border-[var(--primary-color)] bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="report-type"
                      value="summary"
                      checked={reportType === 'summary'}
                      onChange={() => setReportType('summary')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Summary</div>
                      <div className="text-sm text-gray-500">Counts and totals grouped from the selected dataset.</div>
                    </div>
                  </div>
                </label>
                <label className={`border rounded-lg px-4 py-3 cursor-pointer ${reportType === 'detailed_summary' ? 'border-[var(--primary-color)] bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="report-type"
                      value="detailed_summary"
                      checked={reportType === 'detailed_summary'}
                      onChange={() => setReportType('detailed_summary')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Detailed + Summary</div>
                      <div className="text-sm text-gray-500">Includes detailed rows plus a separate summary sheet.</div>
                    </div>
                  </div>
                </label>
              </div>
            </section>

            <section className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Columns</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {includesDetailedSheet ? 'Choose the fields included on the detailed sheet.' : 'Summary-only reports will ignore detailed columns.'}
                  </p>
                </div>
                <span className="text-sm text-gray-500">{selectedColumns.length} selected</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {columnOptions.map((column) => (
                  <label key={column.value} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.value)}
                      onChange={() => toggleColumn(column.value)}
                      disabled={!includesDetailedSheet}
                    />
                    <span className={`text-sm ${includesDetailedSheet ? 'text-gray-700' : 'text-gray-400'}`}>{column.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Sorting</h3>
              <label className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={useCurrentTableSorting}
                  onChange={(e) => setUseCurrentTableSorting(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-800">Use current table sorting</div>
                  <div className="text-sm text-gray-500 mt-1">{currentSortLabel}</div>
                </div>
              </label>

              {!useCurrentTableSorting && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort field</label>
                    <select
                      value={sortField || ''}
                      onChange={(e) => setSortField((e.target.value || null) as SortField)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="">Select a field</option>
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                    <select
                      value={sortDirection || ''}
                      onChange={(e) => setSortDirection((e.target.value || null) as SortDirection)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="">Select direction</option>
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              )}
            </section>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--secondary-color)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
