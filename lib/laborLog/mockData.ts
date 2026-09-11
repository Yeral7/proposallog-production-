/**
 * @branch feature/schedulesprototype
 * Labor Log v1 — mock seed data (no DB).
 * All names sourced from 001_Casanova.xlsx — no invented data.
 *
 * Override layers (if present in localStorage) take precedence:
 *   - labor-log:users-override
 *   - labor-log:subjects-override
 */

import { LaborUser, Subject } from './types';
import { loadSubjectsOverride, loadUsersOverride } from './store';

// ── Subjects (the rows that appear in the weekly grid) ──────────────────────

const SEED_SUBJECTS: Subject[] = [
  // Rafa — Internal Team
  { id: 's_rafa_cecilia',  name: 'Cecilia Rodriguez Chininin', section: 'rafa', kind: 'internal', role: 'Supervisor-IN',                linkedUserId: 'u_cecilia' },
  { id: 's_rafa_ricardo',  name: 'Jose Ricardo Torres',        section: 'rafa', kind: 'internal', role: 'Assistant Project Manager',    linkedUserId: 'u_ricardo' },
  { id: 's_rafa_william',  name: 'William Marin',              section: 'rafa', kind: 'internal', role: 'Supervisor-IN',                linkedUserId: 'u_william' },
  { id: 's_rafa_bryan',    name: 'Bryan Villafana',            section: 'rafa', kind: 'internal', role: 'Supervisor-IN' },

  // Rafa — Subcontractors
  { id: 's_rafa_jimenez',  name: 'Jimenez Exterior, LLC',      section: 'rafa', kind: 'sub' },
  { id: 's_rafa_luna',     name: 'Luna Siding, LLC',           section: 'rafa', kind: 'sub' },
  { id: 's_rafa_siding',   name: 'Siding Solutions, LLC',      section: 'rafa', kind: 'sub' },
  { id: 's_rafa_cuevas',   name: 'CUEVAS CONSTRUCTION',        section: 'rafa', kind: 'sub' },
  { id: 's_rafa_halta',    name: 'Halta Construction',         section: 'rafa', kind: 'sub' },

  // Mambo — Internal
  { id: 's_mambo_edgar',   name: 'Edgar Arguello',             section: 'mambo', kind: 'internal', role: 'Supervisor-IN', linkedUserId: 'u_mambo' },

  // Mambo — Subcontractors
  { id: 's_mambo_jp',      name: 'J&P NEW CONSTRUCTION - JOSE HOUSEWRAP', section: 'mambo', kind: 'sub' },
  { id: 's_mambo_martiser',name: 'Martiser Construction',                  section: 'mambo', kind: 'sub' },
  { id: 's_mambo_elan',    name: 'ELAN Construction',                      section: 'mambo', kind: 'sub' },
  { id: 's_mambo_garcia',  name: 'Garcia Siding',                          section: 'mambo', kind: 'sub' },
  { id: 's_mambo_jaime',   name: 'BUILDING PLUS, CORP.-JAIME TREJO',       section: 'mambo', kind: 'sub' },
  { id: 's_mambo_cuevas',  name: 'CUEVAS CONSTRUCTION',                    section: 'mambo', kind: 'sub' },
  { id: 's_mambo_mango',   name: 'Mango Home & Farm Improvements LLC',     section: 'mambo', kind: 'sub' },

  // Juan — Internal (office team, no subs)
  { id: 's_juan_mauricio', name: 'Mauricio Valencia',          section: 'juan', kind: 'internal', role: 'Office', linkedUserId: 'u_mauricio' },
  { id: 's_juan_kevin',    name: 'Kevin Tapia',                section: 'juan', kind: 'internal', role: 'Remote' },
  { id: 's_juan_gerardo',  name: 'Gerardo Sandoval',           section: 'juan', kind: 'internal', role: 'Office' },
  { id: 's_juan_alain',    name: 'Alain Perez',                section: 'juan', kind: 'internal', role: 'Office' },
  { id: 's_juan_carlos',   name: 'Carlos E. Doig',             section: 'juan', kind: 'internal', role: 'Office' },
  { id: 's_juan_yaniris',  name: 'Yaniris Cardenas Montalban', section: 'juan', kind: 'internal', role: 'Office' },
  { id: 's_juan_santiago', name: 'Santiago Quinn',             section: 'juan', kind: 'internal', role: 'Remote' },
  { id: 's_juan_rodrigo',  name: 'Rodrigo Delgado',            section: 'juan', kind: 'internal', role: 'Office' },
  { id: 's_juan_chloe',    name: 'Chloe Myer',                 section: 'juan', kind: 'internal', role: 'Office', linkedUserId: 'u_chloe' },
  { id: 's_juan_maritza',  name: 'Maritza Marin',              section: 'juan', kind: 'internal', role: 'Office' },
  { id: 's_juan_allisson', name: 'Allisson Velez',             section: 'juan', kind: 'internal', role: 'Office', linkedUserId: 'u_allisson' },
];

// ── Users (login accounts with permission tags) ─────────────────────────────

const SEED_USERS: LaborUser[] = [
  // Project Managers — admin of their own section
  {
    id: 'u_rafa', name: 'Rafael Marin', email: 'rafa@casanova.local', role: 'manager',
    permissions: ['labor:admin:rafa', 'labor:edit:rafa', 'labor:view:rafa'],
  },
  {
    id: 'u_mambo', name: 'Edgar "Mambo" Arguello', email: 'mambo@casanova.local', role: 'manager',
    permissions: ['labor:admin:mambo', 'labor:edit:mambo', 'labor:view:mambo'],
  },
  {
    id: 'u_juan', name: 'Juan Carlos', email: 'juan@casanova.local', role: 'manager',
    permissions: ['labor:admin:juan', 'labor:edit:juan', 'labor:view:juan'],
  },

  // Field Managers — Rafa's team
  {
    id: 'u_ricardo', name: 'Jose Ricardo Torres', email: 'ricardo@casanova.local', role: 'viewer',
    permissions: ['labor:edit:rafa', 'labor:view:rafa'],
  },
  {
    id: 'u_cecilia', name: 'Cecilia Rodriguez', email: 'cecilia@casanova.local', role: 'viewer',
    permissions: ['labor:edit:rafa', 'labor:view:rafa'],
  },
  {
    id: 'u_william', name: 'William "Wilber" Marin', email: 'wilber@casanova.local', role: 'viewer',
    permissions: ['labor:edit:rafa', 'labor:view:rafa'],
  },

  // Juan's team members (per diagram: Chloe + Mauricio also have Juan-section edit)
  {
    id: 'u_mauricio', name: 'Mauricio Valencia', email: 'mauricio@casanova.local', role: 'viewer',
    permissions: ['labor:edit:juan', 'labor:view:juan'],
  },
  {
    id: 'u_chloe', name: 'Chloe Myer', email: 'chloe@casanova.local', role: 'viewer',
    permissions: ['labor:edit:juan', 'labor:view:juan'],
  },

  // Allisson — payables / finance. Sees and edits everything in labor-log AND
  // has explicit estimation:access so she can return to the normal platform.
  {
    id: 'u_allisson', name: 'Allisson Velez', email: 'allisson@casanova.local', role: 'admin',
    permissions: ['labor:view:all', 'labor:edit:all', 'labor:admin:global', 'estimation:access'],
  },

  // Estimation-only admin — no labor-log access. Demonstrates separation.
  // Explicit estimation:access tag so the model is consistent.
  {
    id: 'u_estimation_admin', name: 'Estimation Admin', email: 'estimation@casanova.local', role: 'admin',
    permissions: ['estimation:access'],
  },
];

// ── Project / location vocabulary (cell autocomplete) ───────────────────────

export const PROJECT_ITEMS: string[] = [
  // Statuses (no project)
  'OFF', 'PTO', 'Holiday Paid', 'Sick-Paid', 'Sick Day-Not Paid', 'Vacation',
  'Half Day', 'Rain', 'Snow', 'Safety', 'Bereavement Day', 'Paid Bereavement Day',
  'No Show', 'Remote', 'Office', 'Shop', 'Service', 'Mechanic', 'Inventory',
  'Logistics', 'Delivery', 'Estimating', 'Supervisor-IN', 'Supervisor-OUT',
  'Assistant Project Manager',
  // Job sites
  'Altera Bethpage', 'The Forge', 'OPRC country club', 'Metrolina dermatology',
  '3811 bonwood cir', '379 Ridgewood ave.', 'The Garden Shed', 'The Overlook at Osprey',
  'Centro Montford', 'Copper ridge cabanas', 'Cypress - 17615 Springwinds Dr.',
  'Edward Park', 'HATHAWAY AT LAKE NORMAN', 'Kairoi Monroe', 'Lakeshore Villas',
  'Novel River District', 'Overlook 157', 'Oxbow', 'Regents at lexington',
  'Southside Phase 3', 'Southside Phase 4', 'Taryn Apt', 'Vida 2',
  'Valvoline albermarle', 'Valvoline clyton', 'West Haywood St.',
  'Windsor Run 2.4/2.5', 'Alta 10th', 'Atando', 'Arden at Summit Pines',
  'Broward north tryon storage', 'E. 36 ST CONCORD CONS.', '300 RIVER MILL APT.',
];

// ── Accessors that respect localStorage overrides ───────────────────────────

export function getAllUsers(): LaborUser[] {
  return loadUsersOverride() ?? SEED_USERS;
}

export function getAllSubjects(): Subject[] {
  return loadSubjectsOverride() ?? SEED_SUBJECTS;
}

export function getUserById(id: string): LaborUser | undefined {
  return getAllUsers().find((u) => u.id === id);
}

export function getSubjectsForSection(
  section: 'rafa' | 'mambo' | 'juan',
  kind?: 'internal' | 'sub',
) {
  return getAllSubjects().filter(
    (s) => s.section === section && (!kind || s.kind === kind),
  );
}

export { SEED_USERS, SEED_SUBJECTS };
