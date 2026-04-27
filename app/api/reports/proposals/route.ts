import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getDb } from '@/lib/db';
import { getVerifiedSession } from '@/lib/auth';

type ReportScope = 'filtered' | 'all';
type ReportType = 'detailed' | 'summary' | 'detailed_summary';
type ReportColumn =
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

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'project_name' | 'builder_name' | 'location' | 'due_date' | 'estimator' | 'priority' | 'status' | 'submission_date' | 'contract_value' | 'follow_up_date' | null;

interface FilterOptions {
  builderId?: string;
  estimatorId?: string;
  statusId?: string;
  locationId?: string;
  dueDate?: string;
  priorityId?: string;
}

interface ReportConfig {
  scope: ReportScope;
  reportType: ReportType;
  selectedColumns: ReportColumn[];
  useCurrentTableSorting: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  searchText: string;
  filters: FilterOptions;
}

interface ProposalRow {
  id: number;
  project_name: string;
  builder_id: number | null;
  builder_name: string;
  estimator_id: number | null;
  estimator_name: string;
  status_id: number | null;
  status_label: string;
  location_id: number | null;
  location_name: string | null;
  due_date: string | null;
  submission_date: string | null;
  follow_up_date: string | null;
  contract_value: number | null;
  priority_id: number | null;
  priority_name: string | null;
  contacts: string | null;
  notes: string | null;
  lost_reason: string | null;
}

const columnLabels: Record<ReportColumn, string> = {
  project_name: 'Project Name',
  builder_name: 'Builder',
  estimator_name: 'Estimator',
  status_label: 'Status',
  location_name: 'Location',
  due_date: 'Due Date',
  submission_date: 'Submission Date',
  follow_up_date: 'Follow-up Date',
  contract_value: 'Contract Value',
  priority_name: 'Priority',
  contacts: 'Contacts',
  notes: 'Notes',
  lost_reason: 'Lost Reason',
};

const dateColumns = new Set<ReportColumn>(['due_date', 'submission_date', 'follow_up_date']);
const currencyColumns = new Set<ReportColumn>(['contract_value']);
const priorityOrder = ['Overdue', 'High', 'Medium', 'Low', 'Not Set', null];

function getFileName(config: ReportConfig) {
  const scopeLabel = config.scope === 'filtered' ? 'filtered' : 'all';
  const typeLabel = config.reportType.replace(/_/g, '-');
  const dateLabel = new Date().toISOString().slice(0, 10);
  return `proposal-report-${scopeLabel}-${typeLabel}-${dateLabel}.xlsx`;
}

function parseDateValue(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatSummaryCurrency(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function formatContactValue(contact: { title?: string | null; name?: string | null; email?: string | null; phone?: string | null }) {
  const parts = [contact.title, contact.name].filter(Boolean);
  const header = parts.join(' - ');
  const details = [contact.email, contact.phone].filter(Boolean).join(' | ');

  if (header && details) {
    return `${header} (${details})`;
  }

  return header || details || '';
}

function formatNoteValue(note: { content?: string | null; author?: string | null; timestamp?: string | null }) {
  const content = (note.content || '').trim();
  const author = (note.author || '').trim();
  const timestamp = (note.timestamp || '').trim();
  const meta = [author, timestamp].filter(Boolean).join(' · ');

  if (meta && content) {
    return `${meta}: ${content}`;
  }

  return content || meta || '';
}

async function appendContactsAndNotes(supabase: ReturnType<typeof getDb>, rows: ProposalRow[], selectedColumns: ReportColumn[]) {
  const needsContacts = selectedColumns.includes('contacts');
  const needsNotes = selectedColumns.includes('notes');

  if (!needsContacts && !needsNotes) {
    return rows;
  }

  const projectIds = rows.map((row) => row.id);
  const builderIds = Array.from(new Set(rows.map((row) => row.builder_id).filter((value): value is number => value != null)));

  const [builderContactsResult, projectContactsResult, notesResult] = await Promise.all([
    needsContacts && builderIds.length
      ? supabase
          .from('builder_contacts')
          .select('id, builder_id, name, title, email, phone')
          .in('builder_id', builderIds)
          .order('name', { ascending: true })
      : Promise.resolve({ data: [], error: null } as any),
    needsContacts
      ? supabase
          .from('project_contacts')
          .select('id, project_id, name, title, email, phone, created_at')
          .in('project_id', projectIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null } as any),
    needsNotes
      ? supabase
          .from('project_notes')
          .select('id, project_id, content, timestamp, created_at, users ( name )')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  if (builderContactsResult.error) {
    throw new Error(`Failed to fetch builder contacts: ${builderContactsResult.error.message}`);
  }

  if (projectContactsResult.error) {
    throw new Error(`Failed to fetch project contacts: ${projectContactsResult.error.message}`);
  }

  if (notesResult.error) {
    throw new Error(`Failed to fetch project notes: ${notesResult.error.message}`);
  }

  const builderContactsByBuilder = new Map<number, string>();
  (builderContactsResult.data || []).forEach((contact: any) => {
    const builderId = Number(contact.builder_id);
    const existing = builderContactsByBuilder.get(builderId);
    const formatted = formatContactValue(contact);
    if (!formatted) return;
    builderContactsByBuilder.set(builderId, existing ? `${existing}\n${formatted}` : formatted);
  });

  const projectContactsByProject = new Map<number, string>();
  (projectContactsResult.data || []).forEach((contact: any) => {
    const projectId = Number(contact.project_id);
    const existing = projectContactsByProject.get(projectId);
    const formatted = formatContactValue(contact);
    if (!formatted) return;
    projectContactsByProject.set(projectId, existing ? `${existing}\n${formatted}` : formatted);
  });

  const notesByProject = new Map<number, string>();
  (notesResult.data || []).forEach((note: any) => {
    const projectId = Number(note.project_id);
    const userData = Array.isArray(note.users) ? note.users[0] : note.users;
    const formatted = formatNoteValue({
      content: note.content,
      author: userData?.name || '',
      timestamp: note.timestamp || note.created_at || '',
    });
    if (!formatted) return;
    const existing = notesByProject.get(projectId);
    notesByProject.set(projectId, existing ? `${existing}\n\n${formatted}` : formatted);
  });

  return rows.map((row) => ({
    ...row,
    contacts: needsContacts
      ? (row.builder_id != null && builderContactsByBuilder.get(row.builder_id)) || projectContactsByProject.get(row.id) || null
      : row.contacts,
    notes: needsNotes ? notesByProject.get(row.id) || null : row.notes,
  }));
}

function getSortValue(row: ProposalRow, field: SortField) {
  if (field === 'location') return row.location_name || '';
  if (field === 'estimator') return row.estimator_name || '';
  if (field === 'status') return row.status_label || '';
  if (field === 'priority') return row.priority_name || null;
  if (!field) return null;
  return row[field as keyof ProposalRow] ?? null;
}

function sortRows(rows: ProposalRow[], field: SortField, direction: SortDirection) {
  if (!field || !direction) return rows;

  return [...rows].sort((a, b) => {
    const aValue = getSortValue(a, field);
    const bValue = getSortValue(b, field);

    if (field === 'priority') {
      const aIndex = priorityOrder.indexOf((aValue as string | null) ?? null);
      const bIndex = priorityOrder.indexOf((bValue as string | null) ?? null);
      return direction === 'asc' ? aIndex - bIndex : bIndex - aIndex;
    }

    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (['due_date', 'submission_date', 'follow_up_date'].includes(field)) {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      if (Number.isNaN(aDate)) return 1;
      if (Number.isNaN(bDate)) return -1;
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const aText = String(aValue);
    const bText = String(bValue);
    return direction === 'asc'
      ? aText.localeCompare(bText, undefined, { sensitivity: 'base' })
      : bText.localeCompare(aText, undefined, { sensitivity: 'base' });
  });
}

function filterRows(rows: ProposalRow[], config: ReportConfig) {
  if (config.scope === 'all') {
    return rows;
  }

  let filtered = [...rows];
  const { filters, searchText } = config;

  if (searchText) {
    const searchLower = searchText.toLowerCase();
    filtered = filtered.filter((row) => row.project_name.toLowerCase().includes(searchLower));
  }

  if (filters.builderId) filtered = filtered.filter((row) => row.builder_id?.toString() === filters.builderId);
  if (filters.estimatorId) filtered = filtered.filter((row) => row.estimator_id?.toString() === filters.estimatorId);
  if (filters.statusId) filtered = filtered.filter((row) => row.status_id?.toString() === filters.statusId);
  if (filters.locationId) filtered = filtered.filter((row) => row.location_id?.toString() === filters.locationId);
  if (filters.priorityId) filtered = filtered.filter((row) => row.priority_id?.toString() === filters.priorityId);

  if (filters.dueDate) {
    const filterDate = new Date(filters.dueDate);
    filtered = filtered.filter((row) => {
      if (!row.due_date) return false;
      const dueDate = new Date(row.due_date);
      return !Number.isNaN(dueDate.getTime()) && dueDate <= filterDate;
    });
  }

  return filtered;
}

function setHeaderStyle(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' },
  };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
}

function autoFitColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns?.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value == null ? '' : String(cell.value);
      maxLength = Math.max(maxLength, cellValue.length + 2);
    });
    column.width = Math.min(maxLength, 32);
  });
}

function addDetailedSheet(workbook: ExcelJS.Workbook, rows: ProposalRow[], selectedColumns: ReportColumn[], sheetName: string) {
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.columns = selectedColumns.map((column) => ({
    header: columnLabels[column],
    key: column,
  }));

  setHeaderStyle(worksheet.getRow(1));

  rows.forEach((row) => {
    const values = selectedColumns.map((column) => {
      if (dateColumns.has(column)) {
        return parseDateValue(row[column] as string | null);
      }
      if (currencyColumns.has(column)) {
        return row[column] == null ? null : Number(row[column]);
      }
      return row[column] ?? '';
    });
    worksheet.addRow(values);
  });

  selectedColumns.forEach((column, index) => {
    const worksheetColumn = worksheet.getColumn(index + 1);
    if (dateColumns.has(column)) {
      worksheetColumn.numFmt = 'mm/dd/yyyy';
    }
    if (currencyColumns.has(column)) {
      worksheetColumn.numFmt = '$#,##0.00';
    }
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: selectedColumns.length },
  };

  autoFitColumns(worksheet);
}

function buildSummaryGroups(rows: ProposalRow[], key: keyof ProposalRow) {
  const map = new Map<string, { label: string; count: number; contractValue: number }>();

  rows.forEach((row) => {
    const rawValue = row[key];
    const label = rawValue == null || rawValue === '' ? 'Not Set' : String(rawValue);
    const current = map.get(label) || { label, count: 0, contractValue: 0 };
    current.count += 1;
    current.contractValue += Number(row.contract_value || 0);
    map.set(label, current);
  });

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

function addSummarySection(
  worksheet: ExcelJS.Worksheet,
  title: string,
  groups: Array<{ label: string; count: number; contractValue: number }>,
  startRow: number,
) {
  const titleRow = worksheet.getRow(startRow);
  titleRow.getCell(1).value = title;
  titleRow.font = { bold: true, size: 12 };

  const headerRow = worksheet.getRow(startRow + 1);
  headerRow.values = ['Label', 'Count', 'Contract Value'];
  setHeaderStyle(headerRow);

  groups.forEach((group, index) => {
    const row = worksheet.getRow(startRow + 2 + index);
    row.getCell(1).value = group.label;
    row.getCell(2).value = group.count;
    row.getCell(3).value = formatSummaryCurrency(group.contractValue);
  });

  const totalRowIndex = startRow + 2 + groups.length;
  const totalRow = worksheet.getRow(totalRowIndex);
  totalRow.getCell(1).value = 'Total';
  totalRow.getCell(2).value = groups.reduce((sum, group) => sum + group.count, 0);
  totalRow.getCell(3).value = groups.reduce((sum, group) => sum + group.contractValue, 0);
  totalRow.font = { bold: true };

  worksheet.getColumn(3).numFmt = '$#,##0.00';

  return totalRowIndex + 2;
}

function addSummarySheet(workbook: ExcelJS.Workbook, rows: ProposalRow[], sheetName: string) {
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.views = [{ state: 'frozen', ySplit: 2 }];

  let nextRow = 1;
  nextRow = addSummarySection(worksheet, 'By Status', buildSummaryGroups(rows, 'status_label'), nextRow);
  nextRow = addSummarySection(worksheet, 'By Estimator', buildSummaryGroups(rows, 'estimator_name'), nextRow);
  nextRow = addSummarySection(worksheet, 'By Builder', buildSummaryGroups(rows, 'builder_name'), nextRow);
  addSummarySection(worksheet, 'By Priority', buildSummaryGroups(rows, 'priority_name'), nextRow);

  autoFitColumns(worksheet);
}

export async function POST(request: NextRequest) {
  const session = getVerifiedSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['manager', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const config = (await request.json()) as ReportConfig;
    const selectedColumns = Array.isArray(config.selectedColumns) ? config.selectedColumns : [];

    if ((config.reportType === 'detailed' || config.reportType === 'detailed_summary') && !selectedColumns.length) {
      return NextResponse.json({ error: 'At least one column must be selected for the detailed report.' }, { status: 400 });
    }

    const supabase = getDb();
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        builders:builder_id(name),
        estimators:estimator_id(name),
        statuses:status_id(label),
        locations:location_id(name),
        priorities:priority_id(name)
      `);

    if (error) {
      return NextResponse.json({ error: 'Database query error', details: error.message }, { status: 500 });
    }

    const rows: ProposalRow[] = (projects || []).map((project: any) => ({
      id: project.id,
      project_name: project.project_name,
      builder_id: project.builder_id,
      builder_name: project.builders?.name || 'N/A',
      estimator_id: project.estimator_id,
      estimator_name: project.estimators?.name || 'N/A',
      status_id: project.status_id,
      status_label: project.statuses?.label || 'N/A',
      location_id: project.location_id,
      location_name: project.locations?.name || 'N/A',
      due_date: project.due_date,
      submission_date: project.submission_date,
      follow_up_date: project.follow_up_date,
      contract_value: project.contract_value,
      priority_id: project.priority_id,
      priority_name: project.priorities?.name || 'Not Set',
      contacts: null,
      notes: null,
      lost_reason: project.lost_reason || null,
    }));

    const enrichedRows = await appendContactsAndNotes(supabase, rows, selectedColumns);
    const filteredRows = filterRows(enrichedRows, config);
    const sortedRows = sortRows(filteredRows, config.sortField, config.sortDirection);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'dashboard-nextjs';
    workbook.created = new Date();

    if (config.reportType === 'detailed_summary') {
      addSummarySheet(workbook, sortedRows, '1 - Summary');
      addDetailedSheet(workbook, sortedRows, selectedColumns, '2 - Detailed');
    } else if (config.reportType === 'detailed') {
      addDetailedSheet(workbook, sortedRows, selectedColumns, 'Detailed Report');
    } else if (config.reportType === 'summary') {
      addSummarySheet(workbook, sortedRows, 'Summary Report');
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = getFileName(config);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating proposal report:', error);
    return NextResponse.json({ error: 'Failed to generate proposal report' }, { status: 500 });
  }
}
