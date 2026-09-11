export const STATUS_TWINS: Record<string, string> = {
  Assigned: 'Estimator Assigned',
  Awarded: 'Awarded',
  Cancelled: 'Cancelled',
  'In Progress': 'Estimating',
  Lost: 'Lost',
  'New Lead': 'For Consideration',
  'On Hold': 'On Hold',
  Sent: 'Proposal Sent',
  'To Review': 'For Review',
  Unassigned: 'Req. Estimation',
};

export const NOTION_OWNED_FIELDS = ['follow_up_date'];

export const APP_FIELD_COLUMNS: Record<string, string> = {
  project_name: 'project_name', builder_name: 'builder_id', estimator_name: 'estimator_id',
  status_label: 'status_id', location_name: 'location_id', priority_name: 'priority_id',
  due_date: 'due_date', estimation_due_date: 'estimation_due_date', submission_date: 'submission_date',
  follow_up_date: 'follow_up_date', contract_value: 'contract_value', lost_reason: 'lost_reason',
};

export type Snapshot = Record<string, string | number | null>;
export type ProjectSource = Record<string, any> & { id: number; reference_project_id?: number | null };
export type NotionProperty = { id: string; name?: string; type: string; [key: string]: any };
export type Bindings = Record<string, NotionProperty>;

export const FIELD_ALIASES: Record<string, string[]> = {
  project_name: ['Project'],
  builder_name: ['OG GC / Client', 'GC / Client', 'GC/Client', 'Builder'],
  estimator_name: ['OG Estimator'],
  location_name: ['OG City, State', 'OG Location'],
  status_label: ['Status'],
  due_date: ['Due Date: Bid'],
  estimation_due_date: ['Due Date: Estimation'],
  submission_date: ['Date: Bid Submitted'],
  follow_up_date: ['Follow-up1'],
  contract_value: ['Contract Value'],
  priority_name: ['Priority'],
  lost_reason: ['OG Lost Reason'],
  contact_name: ['PoC: Name'],
  contact_title: ['PoC: Role'],
  contact_email: ['PoC: Email'],
  contact_phone: ['PoC: Phone'],
};

const TYPES: Record<string, string[]> = {
  project_name: ['title', 'rich_text'],
  builder_name: ['title', 'rich_text', 'select'],
  estimator_name: ['select', 'rich_text'],
  location_name: ['rich_text', 'select'],
  status_label: ['status', 'select'],
  due_date: ['date'],
  estimation_due_date: ['date'],
  submission_date: ['date'],
  follow_up_date: ['date'],
  contract_value: ['number'],
  priority_name: ['select'],
  lost_reason: ['rich_text'],
  contact_name: ['rich_text'],
  contact_title: ['rich_text'],
  contact_email: ['email'],
  contact_phone: ['phone_number', 'rich_text'],
};

export function notionStatusToApp(value: string): string | undefined {
  return Object.keys(STATUS_TWINS).find(key => STATUS_TWINS[key] === value);
}

export function groupProjects(projects: ProjectSource[]) {
  const byId = new Map<number, ProjectSource>();
  const duplicates = new Set<number>();
  for (const project of projects) {
    if (!Number.isSafeInteger(project.id) || project.id <= 0) throw new Error('Unsafe project ID');
    if (byId.has(project.id)) duplicates.add(project.id);
    byId.set(project.id, project);
  }
  const grouped = new Map<number, ProjectSource[]>();
  const issues: string[] = [];
  for (const project of projects) {
    let current = project;
    const visited = new Set<number>();
    while (current) {
      if (visited.has(current.id) || duplicates.has(current.id)) {
        issues.push(`Project ${project.id}: cyclic reference or duplicate ID; grouping requires review.`);
        break;
      }
      visited.add(current.id);
      if (current.reference_project_id == null) {
        const members = grouped.get(current.id) || [];
        members.push(project);
        grouped.set(current.id, members);
        break;
      }
      const parent = byId.get(current.reference_project_id);
      if (!parent) {
        issues.push(`Project ${project.id}: missing referenced project ${current.reference_project_id}.`);
        break;
      }
      current = parent;
    }
  }
  const groups = [...grouped.entries()].sort(([a], [b]) => a - b).map(([projectId, members]) => {
    members.sort((a, b) => a.id - b.id);
    return { projectId, memberIds: members.map(project => project.id), latest: members[members.length - 1] };
  });
  return { groups, issues };
}

export function latestContact(contacts: Record<string, any>[]) {
  return [...contacts].sort((a, b) => {
    const aTime = Date.parse(a.created_at || '') || 0;
    const bTime = Date.parse(b.created_at || '') || 0;
    return bTime - aTime || Number(b.id) - Number(a.id);
  })[0] || null;
}

export function projectSnapshot(project: ProjectSource, contact: Record<string, any> | null = null): Snapshot {
  const result: Snapshot = {};
  for (const field of Object.keys(FIELD_ALIASES)) {
    const raw = field.startsWith('contact_') ? contact?.[field.slice(8)] : project[field];
    result[field] = raw == null || raw === '' ? null : String(raw);
  }
  const amount = project.contract_value;
  result.contract_value = amount == null || amount === '' ? null : Number(amount);
  if (result.contract_value !== null && !Number.isFinite(result.contract_value)) throw new Error(`Project ${project.id}: invalid contract value.`);
  return result;
}

export function resolveBindings(schema: Record<string, NotionProperty>): Bindings {
  const bindings: Bindings = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const matches = Object.entries(schema).filter(([name]) => name.trim().toLowerCase() === alias.toLowerCase());
      if (matches.length !== 1) continue;
      const [name, property] = matches[0];
      if (TYPES[field].includes(property.type)) {
        bindings[field] = { ...property, name };
        break;
      }
    }
  }
  return bindings;
}

export function toNotionProperties(values: Snapshot, bindings: Bindings) {
  const properties: Record<string, any> = {};
  const issues: string[] = [];
  for (const [field, value] of Object.entries(values)) {
    const property = bindings[field];
    if (!property) continue;
    let mapped = value;
    if (field === 'status_label') {
      if (value == null || !Object.hasOwn(STATUS_TWINS, String(value))) {
        issues.push(`No approved status twin for ${String(value)}.`);
        continue;
      }
      mapped = STATUS_TWINS[String(value)];
    }
    const type = property.type;
    if (type === 'select' || type === 'status') {
      const options = property[type]?.options || [];
      if (type === 'select' && typeof mapped === 'string' && !options.some((option: any) => option.name === mapped)) {
        const matching = options.filter((option: any) => option.name.trim().toLowerCase() === String(mapped).trim().toLowerCase());
        if (matching.length === 1) mapped = matching[0].name;
      }
      if (mapped !== null && !options.some((option: any) => option.name === mapped)) {
        issues.push(`${property.name}: option ${String(mapped)} is not present; no option will be created.`);
        continue;
      }
      properties[property.id] = { [type]: mapped === null ? null : { name: mapped } };
    } else if (type === 'title' || type === 'rich_text') {
      const text = mapped === null ? '' : String(mapped);
      if ((type === 'title' && !text.trim()) || text.length > 2000) {
        issues.push(`${property.name}: empty title or text exceeds 2000 characters; manual review required.`);
        continue;
      }
      properties[property.id] = { [type]: text ? [{ type: 'text', text: { content: text } }] : [] };
    } else if (type === 'date') {
      if (mapped !== null && !validDate(String(mapped))) {
        issues.push(`${property.name}: expected a date without a time or range.`);
        continue;
      }
      properties[property.id] = { date: mapped === null ? null : { start: mapped } };
    } else {
      properties[property.id] = { [type]: mapped };
    }
  }
  return { properties, issues };
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function readNotionSnapshot(page: { properties: Record<string, any> }, bindings: Bindings) {
  const values: Snapshot = {};
  const issues: string[] = [];
  for (const [field, binding] of Object.entries(bindings)) {
    const property = Object.values(page.properties).find(property => property.id === binding.id);
    if (!property || property.type !== binding.type) {
      issues.push(`Missing or changed property: ${binding.name}.`);
      continue;
    }
    const raw = property[property.type];
    let value: string | number | null = null;
    if (property.type === 'rich_text' || property.type === 'title') {
      if ((raw || []).some((part: any) => part.type !== 'text' || part.href || part.text?.link || Object.entries(part.annotations || {}).some(([key, setting]) => key === 'color' ? setting !== 'default' : setting === true))) {
        issues.push(`${binding.name}: formatted text requires review before flattening.`);
        continue;
      }
      value = (raw || []).map((part: any) => part.plain_text ?? part.text?.content ?? '').join('') || null;
    } else if (property.type === 'select' || property.type === 'status') {
      value = raw?.name || null;
    } else if (property.type === 'date') {
      if (raw && (raw.end || raw.time_zone || !validDate(raw.start))) {
        issues.push(`${binding.name}: date ranges or times require review.`);
        continue;
      }
      value = raw?.start || null;
    } else {
      value = raw ?? null;
    }
    if (field === 'status_label') {
      const twin = value === null ? undefined : notionStatusToApp(String(value));
      if (!twin) {
        issues.push(`No approved app twin for Notion status ${String(value)}.`);
        continue;
      }
      value = twin;
    }
    values[field] = value;
  }
  return { values, issues };
}

export function compareSnapshots(local: Snapshot, remote: Snapshot, baseline: Snapshot | null) {
  const toNotion: Snapshot = {};
  const toSupabase: Snapshot = {};
  const conflicts: string[] = [];
  for (const field of Object.keys(remote)) {
    if (!Object.hasOwn(local, field) || local[field] === remote[field]) continue;
    if (NOTION_OWNED_FIELDS.includes(field)) {
      toSupabase[field] = remote[field];
      continue;
    }
    if (!baseline || !Object.hasOwn(baseline, field)) {
      conflicts.push(field);
      continue;
    }
    const appChanged = local[field] !== baseline[field];
    const notionChanged = remote[field] !== baseline[field];
    if (appChanged && !notionChanged) toNotion[field] = local[field];
    else if (!appChanged && notionChanged && !field.startsWith('contact_')) toSupabase[field] = remote[field];
    else conflicts.push(field);
  }
  return { toNotion, toSupabase, conflicts };
}
