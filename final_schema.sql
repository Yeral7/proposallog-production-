PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE builders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);
INSERT INTO "builders" (id, name) VALUES (1, ' Metcon');
INSERT INTO "builders" (id, name) VALUES (3, 'Armada Hoffler');
INSERT INTO "builders" (id, name) VALUES (4, 'Avalon Bay Communities');
INSERT INTO "builders" (id, name) VALUES (5, 'BCC');
INSERT INTO "builders" (id, name) VALUES (6, 'Bainbridge Companies');
INSERT INTO "builders" (id, name) VALUES (7, 'Barringer');
INSERT INTO "builders" (id, name) VALUES (8, 'Benco Construction');
INSERT INTO "builders" (id, name) VALUES (9, 'Blackburn Group');
INSERT INTO "builders" (id, name) VALUES (10, 'Brasfield and Gorrie');
INSERT INTO "builders" (id, name) VALUES (11, 'C Herman');
INSERT INTO "builders" (id, name) VALUES (12, 'C.E. Gleeson Constructors');
INSERT INTO "builders" (id, name) VALUES (13, 'CCA International');
INSERT INTO "builders" (id, name) VALUES (14, 'Carolina Multifamily Cons. (CMC)');
INSERT INTO "builders" (id, name) VALUES (15, 'Carter Construction ');
INSERT INTO "builders" (id, name) VALUES (16, 'China Construction');
INSERT INTO "builders" (id, name) VALUES (18, 'Choate Construction');
INSERT INTO "builders" (id, name) VALUES (19, 'Clancey & Theys');
INSERT INTO "builders" (id, name) VALUES (21, 'Clifton Construction');
INSERT INTO "builders" (id, name) VALUES (22, 'Concorde Construction');
INSERT INTO "builders" (id, name) VALUES (23, 'Crescent Communities');
INSERT INTO "builders" (id, name) VALUES (24, 'Cypress Builders');
INSERT INTO "builders" (id, name) VALUES (26, 'D.R. Horton, INC');
INSERT INTO "builders" (id, name) VALUES (29, 'Edifice ');
INSERT INTO "builders" (id, name) VALUES (30, 'Elford');
INSERT INTO "builders" (id, name) VALUES (31, 'Embrey');
INSERT INTO "builders" (id, name) VALUES (32, 'Encore Construction');
INSERT INTO "builders" (id, name) VALUES (33, 'FL Blum');
INSERT INTO "builders" (id, name) VALUES (34, 'Gais Construction');
INSERT INTO "builders" (id, name) VALUES (36, 'Griffin ');
INSERT INTO "builders" (id, name) VALUES (38, 'Harkins ');
INSERT INTO "builders" (id, name) VALUES (39, 'Harmon Construction');
INSERT INTO "builders" (id, name) VALUES (40, 'Hendrick Construction');
INSERT INTO "builders" (id, name) VALUES (42, 'KMW Builders ');
INSERT INTO "builders" (id, name) VALUES (43, 'Keach Construction');
INSERT INTO "builders" (id, name) VALUES (45, 'Keary Construction ');
INSERT INTO "builders" (id, name) VALUES (46, 'Knight & Davis Construction Group');
INSERT INTO "builders" (id, name) VALUES (48, 'Landmark Properties');
INSERT INTO "builders" (id, name) VALUES (50, 'Liles Construction');
INSERT INTO "builders" (id, name) VALUES (51, 'Linden Construction');
INSERT INTO "builders" (id, name) VALUES (52, 'MB Khan ');
INSERT INTO "builders" (id, name) VALUES (53, 'MWBE ');
INSERT INTO "builders" (id, name) VALUES (54, 'March West');
INSERT INTO "builders" (id, name) VALUES (56, 'Marsh Bell ');
INSERT INTO "builders" (id, name) VALUES (61, 'Morgan-keller');
INSERT INTO "builders" (id, name) VALUES (62, 'Northview Partners');
INSERT INTO "builders" (id, name) VALUES (63, 'PARC Construction');
INSERT INTO "builders" (id, name) VALUES (64, 'Parker General Contractirs');
INSERT INTO "builders" (id, name) VALUES (65, 'Parker General Contractor');
INSERT INTO "builders" (id, name) VALUES (66, 'Samet Corp');
INSERT INTO "builders" (id, name) VALUES (67, 'Samet Corporation ');
INSERT INTO "builders" (id, name) VALUES (68, 'Southern Builders');
INSERT INTO "builders" (id, name) VALUES (69, 'Southway Builders');
INSERT INTO "builders" (id, name) VALUES (70, 'Speedwell Constrcution ');
INSERT INTO "builders" (id, name) VALUES (71, 'Sterling Constrcuction');
INSERT INTO "builders" (id, name) VALUES (72, 'Sterling Construction ');
INSERT INTO "builders" (id, name) VALUES (73, 'Swinerton');
INSERT INTO "builders" (id, name) VALUES (74, 'The Concorde');
INSERT INTO "builders" (id, name) VALUES (75, 'The Whiting-turner ');
INSERT INTO "builders" (id, name) VALUES (76, 'Thrive construction');
INSERT INTO "builders" (id, name) VALUES (77, 'Triangle');
INSERT INTO "builders" (id, name) VALUES (78, 'WM Jordan');
INSERT INTO "builders" (id, name) VALUES (79, 'Wallick Construction ');
INSERT INTO "builders" (id, name) VALUES (86, 'Weavercooke');
INSERT INTO "builders" (id, name) VALUES (87, 'Whiting Turner');
INSERT INTO "builders" (id, name) VALUES (88, 'Wies Builders');
INSERT INTO "builders" (id, name) VALUES (89, 'Wood Partners');
INSERT INTO "builders" (id, name) VALUES (91, 'Mauricios Construction');
INSERT INTO "builders" (id, name) VALUES (93, 'Fairfield Development L.P.');
INSERT INTO "builders" (id, name) VALUES (94, 'Element');
CREATE TABLE estimators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);
INSERT INTO "estimators" (id, name) VALUES (6, 'Kevin');
INSERT INTO "estimators" (id, name) VALUES (14, 'Not set');
INSERT INTO "estimators" (id, name) VALUES (15, 'Gerardo');
INSERT INTO "estimators" (id, name) VALUES (16, 'Chris');
INSERT INTO "estimators" (id, name) VALUES (17, 'EJ');
INSERT INTO "estimators" (id, name) VALUES (18, 'Alain');
CREATE TABLE statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT
);
INSERT INTO "statuses" (id, label) VALUES (13, 'Not Assigned');
INSERT INTO "statuses" (id, label) VALUES (14, 'Assigned');
INSERT INTO "statuses" (id, label) VALUES (15, 'In Progress');
INSERT INTO "statuses" (id, label) VALUES (16, 'On Hold');
INSERT INTO "statuses" (id, label) VALUES (17, 'Completed');
INSERT INTO "statuses" (id, label) VALUES (18, 'Reassigned');
INSERT INTO "statuses" (id, label) VALUES (19, 'Cancelled');
INSERT INTO "statuses" (id, label) VALUES (20, 'Maurico has to talk');
INSERT INTO "statuses" (id, label) VALUES (21, 'Awarded');
INSERT INTO "statuses" (id, label) VALUES (22, 'Sent');
INSERT INTO "statuses" (id, label) VALUES (23, 'Waiting for review');
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);
INSERT INTO "locations" (id, name) VALUES (1, 'Charlotte');
INSERT INTO "locations" (id, name) VALUES (2, 'Asheville');
INSERT INTO "locations" (id, name) VALUES (3, 'Hickory');
INSERT INTO "locations" (id, name) VALUES (4, 'Greensboro');
INSERT INTO "locations" (id, name) VALUES (5, 'Raleigh');
INSERT INTO "locations" (id, name) VALUES (6, 'Durham');
INSERT INTO "locations" (id, name) VALUES (7, 'Winston Salem');
INSERT INTO "locations" (id, name) VALUES (8, 'Hillsborough');
INSERT INTO "locations" (id, name) VALUES (9, 'Jamestown');
INSERT INTO "locations" (id, name) VALUES (10, 'Morrisville');
INSERT INTO "locations" (id, name) VALUES (11, 'Columbia S.C.');
INSERT INTO "locations" (id, name) VALUES (12, 'Huntersville');
INSERT INTO "locations" (id, name) VALUES (13, 'Mooresville');
INSERT INTO "locations" (id, name) VALUES (14, 'Cornelius');
INSERT INTO "locations" (id, name) VALUES (15, 'Arden');
INSERT INTO "locations" (id, name) VALUES (16, 'Summersville SC');
CREATE TABLE supervisors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );
INSERT INTO "supervisors" (id, name) VALUES (6, 'Alain Perez');
INSERT INTO "supervisors" (id, name) VALUES (7, 'Gerardo Castillo');
CREATE TABLE project_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
INSERT INTO "project_notes" (id, project_id, content, author, timestamp) VALUES (14, 7, 'Fiber Cement', 'Current User', '2025-06-24 15:35:14');
INSERT INTO "project_notes" (id, project_id, content, author, timestamp) VALUES (16, 7, 'Change orders', 'Current User', '2025-06-24 19:10:26');
INSERT INTO "project_notes" (id, project_id, content, author, timestamp) VALUES (17, 9, 'Test 1', 'Current User', '2025-06-25 13:45:54');
INSERT INTO "project_notes" (id, project_id, content, author, timestamp) VALUES (23, 12, 'Please see the revised proposal for the EasyTrim substitute for the 2ft stucco portions all around. I separated the furring from the total at the bottom of the proposal for CCA’s review.', 'Admin', '2025-06-27 19:47:27');
INSERT INTO "project_notes" (id, project_id, content, author, timestamp) VALUES (29, 41, 'From: Norberto Garcia <ngarcia@thesterlinggrp.com> 
Sent: Thursday, June 26, 2025 10:06 AM
To: Norberto Garcia <ngarcia@thesterlinggrp.com>
Subject: [EXTERNAL]Buy Out Schedule - Argento at Cane Bay

CAUTION: This email originated from outside of the organization. Do not click links or open attachments unless you recognize the sender and know the content is safe.

Good Morning All, 

Thank you for your continued patience throughout the extended bidding process. Below is the buyout schedule for Argento at Cane Bay, along with the assigned team members responsible for each scope.

If you have any questions, please don’t hesitate to reach out. The assigned team member will be reaching out during the scheduled buyout phase per the below. 

Additionally, if you are anticipating any pricing increases that may impact your bid prior to buyout, please notify our team as soon as possible so we can address it accordingly.

Phase One: July/August 2025 

Sr. PM Chad McGinty (cmcginty@thesterlinggrp.', 'Admin', '2025-06-30 15:49:02');
INSERT INTO "project_notes" (id, project_id, content, author, timestamp) VALUES (30, 41, 'Phase One: July/August 2025 

Sr. PM Chad McGinty (cmcginty@thesterlinggrp.com)
•	01 General Requirements 
•	Material Testing 
•	Surveying 
•	Concrete 
•	Rough Carpentry Materials
•	Trusses
•	Structural Hardware 
•	Earthwork/Utilities
•	Exterior Improvements

Precon Manager - Hannah Thomas (hthomas@thesterlinggrp.com)
•	MEPs

Phase Two: August/September 2025

Sr. PM Chad McGinty (cmcginty@thesterlinggrp.com)
•	Masonry 
•	Metals 
•	Rough Carpentry Subcontractor 
•	Insulation 
•	Roofing 
•	Siding 
•	Joint Sealants
•	Overhead Doors
•	Flooring 
•	Paint/Drywall/Wallcovering
', 'Admin', '2025-06-30 15:50:50');
INSERT INTO "project_notes" (id, project_id, content, author, timestamp) VALUES (31, 45, ' All composite siding and trim priced as fiber cement.
 All fascia considered with only vinyl soffit contemplated.
 Garage door trim contemplated as fiber cement.
 Roof well wall contemplated as fiber cement panel.
 Composite trim at beam priced as fiber cement.
 Columns contemplated as wrapped in fiber cement.
  3 buildings Type 56.
  2 buildings Type 63.
  3 garages included.
  2 storage buildings included.
  1 multi-use building included.

  Aluminum fascia not included in scope.
 No fiber cement ceiling contemplated at balcony areas.
 No siding contemplated at corridor areas.
 Clubhouse not included in the proposal due to lack of available drawings.
', 'Admin', '2025-07-02 12:55:03');
CREATE TABLE schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO "schema_migrations" (version, applied_at) VALUES ('v1.0.0_remove_divisions', '2025-06-27 19:37:53');
INSERT INTO "schema_migrations" (version, applied_at) VALUES ('v1.0.1_allow_null_due_date', '2025-06-27 19:40:09');
INSERT INTO "schema_migrations" (version, applied_at) VALUES ('v1.0.2_allow_null_contact_title', '2025-06-27 19:40:09');
INSERT INTO "schema_migrations" (version, applied_at) VALUES ('v1.0.3_create_drawings_table', '2025-06-27 20:01:06');
INSERT INTO "schema_migrations" (version, applied_at) VALUES ('v1.0.4_recreate_drawings_table', '2025-06-27 20:11:04');
CREATE TABLE "users" (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
INSERT INTO "users" (id, name, email, password_hash) VALUES (1, 'Gerardo', 'gerardo@example.com', 'insecure_password_1');
INSERT INTO "users" (id, name, email, password_hash) VALUES (2, 'John Doe', 'john.doe@example.com', 'insecure_password_2');
CREATE TABLE "projects" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    builder_id INTEGER,
    estimator_id INTEGER,
    supervisor_id INTEGER,
    status_id INTEGER,
    location_id INTEGER,
    due_date TEXT, -- Allow NULL
    contract_value REAL,
    reference_project_id INTEGER, priority TEXT CHECK(priority IN ('Overdue', 'High', 'Medium', 'Low')),
    FOREIGN KEY (builder_id) REFERENCES builders(id),
    FOREIGN KEY (estimator_id) REFERENCES estimators(id),
    FOREIGN KEY (supervisor_id) REFERENCES supervisors(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (10, 'Patterson MF', 8, 14, NULL, 13, NULL, '2025-06-12', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (11, 'The Grounds Multifamily', 10, 6, NULL, 22, 7, '2025-01-10', 951263.59, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (12, 'The Overlook ', 16, 6, NULL, 20, NULL, '2025-04-18', 29174.17, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (13, 'Oaks at Whitaker', 18, 14, NULL, 13, 5, '2025-06-30', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (14, 'Downtown Pineville Apartments', 22, 6, NULL, 22, 1, '2025-01-16', 848154.87, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (15, 'The Forge Village', 23, 6, NULL, 22, NULL, '2025-05-30', 185066.77, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (16, 'The Garden Shed', 23, 6, NULL, 22, NULL, '2025-05-30', 22659.78, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (17, 'The Pavillion', 23, 6, NULL, 22, NULL, '2025-05-30', 13163.33, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (18, 'The Forge', 23, 6, NULL, 22, NULL, '2025-02-05', 242834.85, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (19, 'Collins Ridge ', 26, 6, NULL, 22, 8, '2025-05-30', 3055439.48, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (20, 'Alta Watkins ', 89, 15, NULL, 22, 13, '2025-07-03', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (21, 'Altera Durham Summit', 89, 14, NULL, 22, 6, '2025-06-10', 1003542.49, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (22, 'Jamestown - Apartments', 26, 14, NULL, 15, 9, '2025-06-20', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (23, 'Altera Bethpage Phase II ', 89, 15, NULL, 22, NULL, '2025-06-04', 1081372.31, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (24, 'Hopson Road', 29, 6, NULL, 22, 10, '2024-06-20', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (26, 'Spacecraft Bladerunner', 30, 14, NULL, 22, NULL, '', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (27, '2019 Bull Street', 30, 6, NULL, 22, 11, '2025-03-11', 489172.55, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (28, 'Twin Lakes WFH', 31, 14, NULL, 22, NULL, '', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (29, '5200 Hillsborough Street', 93, 14, NULL, 13, 5, '', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (30, 'Parkview Apartments', 36, 6, NULL, 22, 2, '2025-06-11', 1052679.2, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (31, 'Declan at Huntersville', 38, 6, NULL, 22, 12, '2025-06-03', 1874694, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (32, 'Talbert Road', 38, 6, NULL, 22, 13, '2025-03-10', 1719711.83, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (33, 'Mills Market', 38, 6, NULL, 22, 14, '2025-07-11', 581836.44, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (34, 'Glenwoood Place Bldg F', 38, 6, NULL, 22, 5, '2025-01-27', 105168.23, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (35, 'Long Shoals', 38, 6, NULL, 22, 15, '2025-04-25', 1427093.37, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (36, 'Declan at Huntersville - GMP', 38, 6, NULL, 22, 1, '2025-06-05', 1873433.21, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (37, 'The Quarter', 38, 6, NULL, 22, 1, '2025-06-06', 1496937.39, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (38, '5500 Multifamily', 38, 14, NULL, 22, NULL, '', NULL, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (39, 'Livano North Hills GMP', 45, 6, NULL, 22, 5, '2025-05-19', 1482897.83, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (40, 'Argento Glenwood', 72, 6, NULL, 22, NULL, '2025-06-17', 2300904.44, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (41, 'Argento at Cane Bay', 72, 6, NULL, 22, 16, '2025-01-23', 2421199.93, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (42, 'Tribute Rising Phase 1', 73, 6, NULL, 22, 6, '2025-06-06', 316433.85, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (43, 'Enclave Piney Mountain - Phase II', 86, 6, NULL, 22, 2, '2025-01-23', 499836.62, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (44, 'Willowbrook at Wateree', 86, 6, NULL, 22, 11, '2025-03-31', 592009.05, NULL, NULL);
INSERT INTO "projects" (id, project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value, reference_project_id, priority) VALUES (45, 'Birch Hill Phase 2 ', 94, 15, 6, 15, 4, '', NULL, NULL, NULL);
CREATE TABLE "project_contacts" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "project_id" INTEGER NOT NULL,
  "title" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE
);
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (1, 7, 'Estimator', 'Jessie ', NULL, '803.517.0858', '2025-06-24 13:04:34', '2025-06-24 14:44:33');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (2, 7, 'Support ', 'Support CT', 'WebSite-CB@casanovabrick.com', '7043709356', '2025-06-24 13:45:07', '2025-06-24 15:29:43');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (4, 11, NULL, 'Steve Johnson', 'sjohnson@brasfieldgorrie.com', NULL, '2025-06-27 19:40:58', '2025-06-27 19:40:58');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (5, 20, NULL, 'Ben Carter', 'ben.carter@woodpartners.com', NULL, '2025-06-27 19:42:37', '2025-06-27 20:14:11');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (6, 12, NULL, 'Di Fu', 'fu_di@ccase.us', NULL, '2025-06-27 19:55:32', '2025-06-27 19:55:42');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (8, 21, NULL, 'Robert Webster		', 'mailto:robert.webster@woodpartners.com', NULL, '2025-06-27 20:15:23', '2025-06-27 20:15:23');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (9, 23, NULL, 'Tanner  Stallings		', 'mailto:tanner.stallings@woodpartners.com', '706.464.7419 ', '2025-06-27 20:16:14', '2025-06-27 20:16:23');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (10, 13, NULL, 'Dean Swift', 'dswift@choateco.com', '9195081989', '2025-06-27 20:16:16', '2025-06-27 20:17:19');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (11, 13, NULL, 'Claire Copeland', 'ccopeland@choateco.com', NULL, '2025-06-27 20:16:39', '2025-06-27 20:16:39');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (12, 44, NULL, 'Breanna Hipper', 'bhippert@weavercooke.com', ' 336.378.7900', '2025-06-27 20:17:43', '2025-06-27 20:17:43');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (13, 43, NULL, 'Brit Cohan	', 'bcohan@weavercooke.com', '336-404-4128', '2025-06-27 20:19:07', '2025-06-27 20:19:07');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (14, 14, NULL, 'Jessie McCready', 'JMcCready@concordeconst.com', '8035170858', '2025-06-27 20:20:22', '2025-06-27 20:20:42');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (15, 42, NULL, 'Ruth Alcotas Morey		', 'ralcotas@swinerton.com', '919.418.9625', '2025-06-27 20:20:51', '2025-06-27 20:20:51');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (16, 15, NULL, 'Lily Lenarduzzi', 'LLENARDUZZI@CrescentCommunities.com', '3306124439', '2025-06-27 20:24:19', '2025-06-27 20:24:19');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (17, 41, NULL, 'Norberto Garcia		', 'ngarcia@thesterlinggrp.com', '574.575.0362 ', '2025-06-27 20:25:18', '2025-06-27 20:25:18');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (18, 40, NULL, 'Norberto Garcia		', 'ngarcia@thesterlinggrp.com', '574.575.0362 ', '2025-06-27 20:25:55', '2025-06-27 20:25:55');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (19, 16, NULL, 'Lily Lenarduzzi', 'LLENARDUZZI@CrescentCommunities.com', '3306124439', '2025-06-27 20:27:23', '2025-06-27 20:27:23');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (20, 17, NULL, 'Lily Lenarduzzi', 'LLENARDUZZI@CrescentCommunities.com', '3306124439', '2025-06-27 20:28:25', '2025-06-27 20:28:25');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (21, 18, NULL, 'Lily Lenarduzzi', 'LLENARDUZZI@CrescentCommunities.com', '3306124439', '2025-06-27 20:29:17', '2025-06-27 20:29:17');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (22, 39, NULL, 'JUSTIN ROATH  		', 'justin@keareyconstruction.com', '704.450.2003', '2025-06-27 20:30:08', '2025-06-27 20:30:08');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (23, 19, NULL, 'Jason Scurti', 'jmscurti@drhorton.com', '9253346269', '2025-06-27 20:31:27', '2025-06-27 20:31:27');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (24, 37, NULL, 'Eric Nance		', 'mailto:enance@harkinsbuilders.com', '704.291.1555 ', '2025-06-27 20:31:32', '2025-06-27 20:31:32');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (25, 36, NULL, 'Ryan Baldwin		', 'rbaldwin@harkinsbuilders.com', '315.854.0339 ', '2025-06-27 20:34:34', '2025-06-27 20:34:34');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (26, 31, NULL, 'Ryan Baldwin		', 'rbaldwin@harkinsbuilders.com', '315.854.0339 ', '2025-06-27 20:34:47', '2025-06-27 20:34:47');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (27, 22, NULL, 'Jason Scurti', 'jmscurti@drhorton.com', '9253346269', '2025-06-27 20:38:58', '2025-06-27 20:38:58');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (28, 24, NULL, 'Cody Treece', 'ctreece@edificeinc.com', '7043320900', '2025-06-27 20:42:09', '2025-06-27 20:42:09');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (29, 35, NULL, 'Charlie Melton		', 'Charlie Melton <cmelton@harkinsbuilders.com>', '704-300-7121', '2025-06-27 20:47:02', '2025-06-27 20:47:02');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (30, 27, NULL, 'Katie Glenn', 'kglenn@elford.com', '7046074627', '2025-06-27 20:50:51', '2025-06-27 20:50:51');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (31, 34, NULL, 'Eric Nance		', 'enance@harkinsbuilders.com', '704-291-1555', '2025-06-27 20:52:34', '2025-06-27 20:52:34');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (32, 33, NULL, 'Eric Nance		', 'enance@harkinsbuilders.com', '704-291-1555', '2025-06-27 20:55:22', '2025-06-27 20:55:22');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (33, 32, NULL, 'Jake Kalamets		', 'jkalamets@harkinsbuilders.com', '240.784.0661 ', '2025-06-27 20:57:31', '2025-06-27 20:57:31');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (34, 30, NULL, 'Andrew Fallacara		', 'andrew@gracewnc.com', '828.254.8897', '2025-06-27 20:58:35', '2025-06-27 20:58:35');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (35, 30, NULL, 'Ross Cook		', 'ross@gracewnc.com', '828.552.0656', '2025-06-27 20:58:57', '2025-06-27 20:58:57');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (36, 28, NULL, 'Yunnan Chagollan', 'yunnan.chagollan@embrey.com', '2108045256', '2025-06-27 20:59:32', '2025-06-27 20:59:32');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (37, 29, NULL, 'Brandon Bamonte', 'bbamonte@ffres.com', '9196224196', '2025-06-27 21:00:37', '2025-06-27 21:00:37');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (38, 29, NULL, 'Mohamed Sillah', 'tlouis@ffres.com', '2406044812', '2025-06-27 21:01:41', '2025-06-27 21:01:41');
INSERT INTO "project_contacts" (id, project_id, title, name, email, phone, created_at, updated_at) VALUES (39, 45, 'Assistant Project Manager ', 'Scout Franklin ', 'mailto:sfranklin@element-nc.com', '970) 729-2367 ', '2025-06-30 15:39:16', '2025-06-30 15:39:16');
CREATE TABLE "project_drawings" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "project_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  "updated_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE
);
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (2, 11, 'GMP', 'https://app.buildingconnected.com/_/join-rfp?bgid=67ab5e68026c2a00849d5ac6&code=c15b0af5-a7f2-4225-ac47-0e80d484db4f&inviterId=5a8ca8b909f5c6000fce095d&inviteeId=653ac274b174a8003178d7dc&share=1', '2025-06-27 20:14:06', '2025-06-27 20:14:06');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (3, 12, 'Stucco Substitute', 'https://casanovasiding.sharepoint.com/sites/PreConstruction/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FPreConstruction%2FShared%20Documents%2F10%5FQuote%202023%2FCHINA%20CONSTRUCTION%2FOverlook%20at%20Osprey%2FImportant%20Emails%2FRE%20EXTERNALRE%20The%20Overlook%20%2D%20Stucco%20Substitute%2Emsg&parent=%2Fsites%2FPreConstruction%2FShared%20Documents%2F10%5FQuote%202023%2FCHINA%20CONSTRUCTION%2FOverlook%20at%20Osprey%2FImportant%20Emails&p=true&ga=1', '2025-06-27 20:15:33', '2025-06-27 20:15:33');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (4, 21, 'GMP', 'https://app.buildingconnected.com/_/join-rfp?bgid=67b26b6162f70b0054b22f75&code=c47b9520-2ea1-4cf1-aefd-5934ac9c5b89&inviterId=5b8434f6d9a8b4000fb4b75b&inviteeId=6842ffc2e4868301f1b9aee3&share=0						', '2025-06-27 20:15:43', '2025-06-27 20:15:43');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (5, 23, 'GMP', 'https://linkprotect.cudasvc.com/url?a=https%3a%2f%2fwoodpartners-my.sharepoint.com%2f%3af%3a%2fp%2ftanner_stallings%2fEuwbN0YtAmBPsnq8VV0HpsABruTthbYWJ_xnoj8iqNRNbg%3fe%3dwopy5c&c=E,1,QwVNQJYqZpYQzzI0Ak0RCeGpDZpe7C9RXYeC3Lp-83kD0ODdM-sVShC9EufgzizSAzjndv3dKzy41y9mWRNufWZ1wo8OpuBrBcxSX1yihcI,&typo=1						', '2025-06-27 20:16:51', '2025-06-27 20:16:51');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (6, 44, 'DD', 'https://weavercooke.pipelinesuite.com/', '2025-06-27 20:18:32', '2025-06-27 20:18:32');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (7, 13, 'Permit Drawings', 'https://app.buildingconnected.com/public/55117e4ee508a40800227563/projects/67e15efdaac872004b640db2', '2025-06-27 20:19:23', '2025-06-27 20:19:23');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (8, 43, 'Phase', 'https://weavercooke.pipelinesuite.com/ehPipelineSubs/dspProject/projectID/292135/confirmResponse/', '2025-06-27 20:19:41', '2025-06-27 20:19:41');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (9, 42, 'DD', 'https://app.buildingconnected.com/_/join-rfp?bgid=68029bed17b19d00417313e1&code=a83a90fb-033d-445f-ab45-497348fbb178&inviterId=622fa3d32051c400ab816a67&inviteeId=653ac274b174a8003178d7dc&share=0						', '2025-06-27 20:21:05', '2025-06-27 20:21:05');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (10, 14, 'D1', 'https://concordeconst.sharepoint.com/Active%20Projects/Forms/AllItems.aspx?id=%2FActive%20Projects%2F24%2D011P%20Downtown%20Pineville%20MF%2F15%20Precon%2F22%20Precon%2F2%2E%20Plans%2F7%2E%20SD%20Drawings%20rcvd%2003jan25%2F0%2E%20Bid%20Documents&p=true&ga=1', '2025-06-27 20:23:22', '2025-06-27 20:23:22');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (11, 15, 'GMP', 'https://www.dropbox.com/scl/fo/wabpf035k4zmqoaudzjf8/ABMiC-s9g1ka60CmroNnl80?rlkey=vm1xjrz786o94xeeoa2zbpkm9&e=1&dl=0', '2025-06-27 20:26:54', '2025-06-27 20:26:54');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (12, 16, 'GMP', 'https://www.dropbox.com/scl/fo/wabpf035k4zmqoaudzjf8/ABMiC-s9g1ka60CmroNnl80?rlkey=vm1xjrz786o94xeeoa2zbpkm9&e=1&dl=0', '2025-06-27 20:27:52', '2025-06-27 20:27:52');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (13, 17, 'GMP', 'https://www.dropbox.com/scl/fo/wabpf035k4zmqoaudzjf8/ABMiC-s9g1ka60CmroNnl80?rlkey=vm1xjrz786o94xeeoa2zbpkm9&e=1&dl=0', '2025-06-27 20:28:51', '2025-06-27 20:28:51');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (14, 18, 'GMP', 'https://www.dropbox.com/scl/fo/wabpf035k4zmqoaudzjf8/ABMiC-s9g1ka60CmroNnl80?rlkey=vm1xjrz786o94xeeoa2zbpkm9&e=1&dl=0', '2025-06-27 20:30:19', '2025-06-27 20:30:19');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (15, 39, 'GMP', 'https://app.buildingconnected.com/_/join-rfp?bgid=68025102dc54af004e6a6f30&code=b756e665-d70c-49d1-b7a9-92fc8ed42017&inviterId=60468e8237062400b3ed5c26&inviteeId=653ac274b174a8003178d7dc&share=1', '2025-06-27 20:30:28', '2025-06-27 20:30:28');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (16, 37, 'DD', 'https://linkprotect.cudasvc.com/url?a=https%3a%2f%2fapp.buildingconnected.com%2fgoto%2f682211fdbe4b3f003a152897196c51647ebjmr&c=E,1,cf4U_bdO6NSAy60ro9b9vp-k6jC1IFti1C0NAFSCbANbY4-ids61f70HB79XqTyu-dmPJhV5TlxVmaunBz3Xe76SH2yOSm8jTOJpd4qGhA,,&typo=1						', '2025-06-27 20:32:06', '2025-06-27 20:32:06');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (17, 36, 'GMP ', 'https://app.buildingconnected.com/_/join-rfp?bgid=6836ff8af593d10049033d1a&code=4bff8572-fe64-4606-9f3b-7700eb85bba2&inviterId=6523ef510c3ad4003756f807&inviteeId=6792511799c877004a0c4634&share=1', '2025-06-27 20:34:04', '2025-06-27 20:34:04');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (18, 31, 'GMP', 'https://app.buildingconnected.com/_/join-rfp?bgid=6836ff8af593d10049033d1a&code=4bff8572-fe64-4606-9f3b-7700eb85bba2&inviterId=6523ef510c3ad4003756f807&inviteeId=6792511799c877004a0c4634&share=1', '2025-06-27 20:34:11', '2025-06-27 20:34:11');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (19, 19, 'D1', 'https://linkprotect.cudasvc.com/url?a=https%3a%2f%2fclick.procore.com%2ff%2fa%2ffpdir-Oyvh76wIPg91pyrQ~~%2fAAQRxRA~%2fJhdKk2cko56WKUnlVM8HM3h3Ra9YoVg_DuJZwTUVwAPdDRHPZOutfB2qkn8u105DceBFovi0NgPyEsEOFV8ofdksuZGPnM1PcV0Yeztd1ubrglAdDzy9JKRepaZsU0GVuB2Qa2k89-hAFeIoctG9mivw71B4Z1Faa4n1xuBsbR5QIxisbwXpakZ9meXEgiLTQfx9hphTRLbForrCakp0mOgbMnNx3CLVZrAUMnpLLv9AFyoFGkKxeE63BVxcF5_3&c=E,1,XXlZm7_1MADfBJ_JdWed3VAw6RXS6jdhG8Ci0gjC4caIBRCW2mjJlNXHvTW6dRzzbd8Xji67q_5xvV-neR50UV-jnBFMlgG87XGARS-vRfq6G931bTJGgz6m&typo=1', '2025-06-27 20:34:21', '2025-06-27 20:34:21');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (20, 22, 'Release 1', 'https://us02.procore.com/webclients/host/companies/562949953449075/tools/ct/bid-board/562949955088901/project/details', '2025-06-27 20:40:25', '2025-06-27 20:40:25');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (21, 24, 'D1', 'https://app.buildingconnected.com/_/join-rfp?bgid=66586b6b2878f5003b382707&code=f062dd49-1ad6-44ee-b8ae-ef874e1147cb&inviterId=5cacb87cc3758200312d18ce&inviteeId=54da9aaa1794ef0600419254&share=0', '2025-06-27 20:49:31', '2025-06-27 20:49:31');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (22, 35, 'GMP', 'https://harkinsbuilders-my.sharepoint.com/personal/cmelton_harkinsbuilders_com/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fcmelton%5Fharkinsbuilders%5Fcom%2FDocuments%2FDownloads%2FLong%20Shoals%20Combined%20Set%2Epdf&parent=%2Fpersonal%2Fcmelton%5Fharkinsbuilders%5Fcom%2FDocuments%2FDownloads&ga=1											', '2025-06-27 20:50:50', '2025-06-27 20:50:50');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (23, 27, 'D1', 'https://linkprotect.cudasvc.com/url?a=https%3a%2f%2fapp.buildingconnected.com%2fgoto%2f67abaa610f756900379429dc194f6918e98istb&c=E,1,laMqUpr8ZYIcEdTfBtsWY9-0gCyyMjLVKmHBceszMZYjbbntjnk0yGpLj6yn7-82S8QwgAavC8pNSUq9fYObRg6fuSBZOodNtdz7enTXC3c,&typo=1', '2025-06-27 20:52:01', '2025-06-27 20:52:01');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (24, 34, 'RFP', 'https://app.buildingconnected.com/_/join-rfp?bgid=677bd607827c28111e558d30&code=91a9596f-626e-456c-8fee-8a024c0f2e7e&inviterId=65d358d6e30462003b7c528b&inviteeId=653ac274b174a8003178d7dc&share=0', '2025-06-27 20:54:38', '2025-06-27 20:54:38');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (25, 33, 'RFP', 'https://app.buildingconnected.com/_/join-rfp?bgid=68531b357a331e00413b61fb&code=9abd9c01-bfd2-494c-b9d7-ece9ddd7231d&inviterId=5c914461a446c000164aab96&inviteeId=653ac274b174a8003178d7dc&share=0', '2025-06-27 20:55:32', '2025-06-27 20:55:32');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (26, 32, 'CD', 'https://app.buildingconnected.com/_/join-rfp?bgid=67a35f58b2a957007b2c7d35&code=94761c29-fe6b-4fb3-93b6-1949fe2f47e7&inviterId=64ac2bee0741d7004b89f00e&inviteeId=62fe87f31a723f006b462268&share=1', '2025-06-27 20:57:42', '2025-06-27 20:57:42');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (27, 30, 'DD', 'https://www.dropbox.com/scl/fo/tcb2c5sln6902zaur0bto/ADCXHlKulynpRlHwWjIAlME?rlkey=okpd4281fuqanmyleu3nt7cls&st=asgesebn&dl=0						 						', '2025-06-27 20:59:11', '2025-06-27 20:59:11');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (28, 29, 'D1', 'https://linkprotect.cudasvc.com/url?a=https%3a%2f%2fclick.procore.com%2ff%2fa%2fF9UYSEUTvdNxidLHz-dhNw~~%2fAAQRxRA~%2fY4PYVm9UALwUUv_DQnHWlJum-lNObHDtuBw-JZibSMHBIZb_JCWE24FoLNsfwAfMaWNNE0A2ESmriv3MGz4edx3GtWZSDyeX3p2ikcfHG2aKWsbNAxZq4b-ivPbOWsma4cjQRLc7OKdoU1dI3mt7tUML5NUu4n5qduJ2nSQ2112doaeUptyGeJpY28Y57e0mcu9ksLe2ziGOb2sbVdD16PqsbRb7h32tGVO9I6w8rObmKfjDK_Levd6MS_iOKnV6&c=E,1,o-y502gIuTP4Tx3gpHkX79ylR2UigRL_UpUixFMO5pWF1n0VyHOzLjciXkSB0Y51fQldnyRwHgiMz8_D11oM499DMMWfqF8EfUpG62JQNRJZ0BBXlAI8zcCVJw,,&typo=1', '2025-06-27 21:02:13', '2025-06-27 21:02:13');
INSERT INTO "project_drawings" (id, project_id, title, url, created_at, updated_at) VALUES (29, 45, 'Permit Set ', 'https://www.dropbox.com/scl/fo/24fkdu3hpx93791lx3hde/AMbZoc01lVPTYfAZMHwCZc8?rlkey=jv37uo4epwiw3d0c50d3cp4fm&dl=0', '2025-07-02 12:56:41', '2025-07-02 12:56:41');
COMMIT;
PRAGMA foreign_keys=ON;
