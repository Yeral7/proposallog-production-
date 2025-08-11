-- SQLite creates the database as a file, so CREATE DATABASE and USE are not needed.
-- Data types have been adjusted for SQLite compatibility.

DROP TABLE IF EXISTS project_divisions;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS builders;
DROP TABLE IF EXISTS estimators;
DROP TABLE IF EXISTS supervisors;
DROP TABLE IF EXISTS statuses;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS divisions;
DROP TABLE IF EXISTS users;

CREATE TABLE divisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- In a real app, this should be a securely hashed password
    division_id INTEGER,
    FOREIGN KEY (division_id) REFERENCES divisions(id)
);

CREATE TABLE builders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

CREATE TABLE estimators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

CREATE TABLE supervisors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

CREATE TABLE statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT
);

CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT,
    builder_id INTEGER,
    estimator_id INTEGER,
    supervisor_id INTEGER, -- Can be NULL
    status_id INTEGER,
    location_id INTEGER, -- Can be NULL
    due_date TEXT, -- Can be NULL
    contract_value REAL, -- Can be NULL
    reference_project_id INTEGER, -- Can be NULL
    FOREIGN KEY (builder_id) REFERENCES builders(id),
    FOREIGN KEY (estimator_id) REFERENCES estimators(id),
    FOREIGN KEY (supervisor_id) REFERENCES supervisors(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (reference_project_id) REFERENCES projects(id)
);

CREATE TABLE project_divisions (
    project_id INTEGER,
    division_id INTEGER,
    PRIMARY KEY (project_id, division_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
);

-- Seed Data
INSERT INTO divisions (name) VALUES ('Siding'), ('Masonry');

-- Note: Storing plain text passwords is a security risk. This is for demonstration only.
INSERT INTO users (name, email, password_hash, division_id) VALUES 
('Gerardo', 'gerardo@example.com', 'insecure_password_1', 1),
('John Doe', 'john.doe@example.com', 'insecure_password_2', 2);

INSERT INTO builders (id, name) VALUES (1, ' Metcon');
INSERT INTO builders (id, name) VALUES (2, '2025 Projects');
INSERT INTO builders (id, name) VALUES (3, 'Armada Hoffler');
INSERT INTO builders (id, name) VALUES (4, 'Avalon Bay Communities');
INSERT INTO builders (id, name) VALUES (5, 'BCC');
INSERT INTO builders (id, name) VALUES (6, 'Bainbridge Companies');
INSERT INTO builders (id, name) VALUES (7, 'Barringer');
INSERT INTO builders (id, name) VALUES (8, 'Benco Construction');
INSERT INTO builders (id, name) VALUES (9, 'Blackburn Group');
INSERT INTO builders (id, name) VALUES (10, 'Brasfield and Gorrie');
INSERT INTO builders (id, name) VALUES (11, 'C Herman');
INSERT INTO builders (id, name) VALUES (12, 'C.E. Gleeson Constructors');
INSERT INTO builders (id, name) VALUES (13, 'CCA International');
INSERT INTO builders (id, name) VALUES (14, 'Carolina Multifamily Cons. (CMC)');
INSERT INTO builders (id, name) VALUES (15, 'Carter Construction ');
INSERT INTO builders (id, name) VALUES (16, 'China Construction');
INSERT INTO builders (id, name) VALUES (17, 'Choate');
INSERT INTO builders (id, name) VALUES (18, 'Choate Construction');
INSERT INTO builders (id, name) VALUES (19, 'Clancey & Theys');
INSERT INTO builders (id, name) VALUES (20, 'Clancy & Theys ');
INSERT INTO builders (id, name) VALUES (21, 'Clifton Construction');
INSERT INTO builders (id, name) VALUES (22, 'Concorde Construction');
INSERT INTO builders (id, name) VALUES (23, 'Crescent Communities');
INSERT INTO builders (id, name) VALUES (24, 'Cypress Builders');
INSERT INTO builders (id, name) VALUES (25, 'D R Horton');
INSERT INTO builders (id, name) VALUES (26, 'D.R. Horton, INC');
INSERT INTO builders (id, name) VALUES (27, 'DR Horton');
INSERT INTO builders (id, name) VALUES (28, 'Edifice');
INSERT INTO builders (id, name) VALUES (29, 'Edifice ');
INSERT INTO builders (id, name) VALUES (30, 'Elford');
INSERT INTO builders (id, name) VALUES (31, 'Embrey');
INSERT INTO builders (id, name) VALUES (32, 'Encore Construction');
INSERT INTO builders (id, name) VALUES (33, 'FL Blum');
INSERT INTO builders (id, name) VALUES (34, 'Frampton');
INSERT INTO builders (id, name) VALUES (35, 'Gais Construction');
INSERT INTO builders (id, name) VALUES (36, 'Griffin');
INSERT INTO builders (id, name) VALUES (37, 'Griffin ');
INSERT INTO builders (id, name) VALUES (38, 'Harkins');
INSERT INTO builders (id, name) VALUES (39, 'Harkins ');
INSERT INTO builders (id, name) VALUES (40, 'Harmon Construction');
INSERT INTO builders (id, name) VALUES (41, 'Hendrick Construction');
INSERT INTO builders (id, name) VALUES (42, 'HH Hunt');
INSERT INTO builders (id, name) VALUES (43, 'JM Cope');
INSERT INTO builders (id, name) VALUES (44, 'John S Clark');
INSERT INTO builders (id, name) VALUES (45, 'Jordan');
INSERT INTO builders (id, name) VALUES (46, 'Katerra');
INSERT INTO builders (id, name) VALUES (47, 'Kotter');
INSERT INTO builders (id, name) VALUES (48, 'Landmark Construction');
INSERT INTO builders (id, name) VALUES (49, 'Landmark Properties');
INSERT INTO builders (id, name) VALUES (50, 'Liden Construction ');
INSERT INTO builders (id, name) VALUES (51, 'Liles Construction');
INSERT INTO builders (id, name) VALUES (52, 'Linden Construction');
INSERT INTO builders (id, name) VALUES (53, 'MB Khan ');
INSERT INTO builders (id, name) VALUES (54, 'March West');
INSERT INTO builders (id, name) VALUES (55, 'Messer');
INSERT INTO builders (id, name) VALUES (56, 'Morgan Keller');
INSERT INTO builders (id, name) VALUES (57, 'Morgan-Keller');
INSERT INTO builders (id, name) VALUES (58, 'Multifamily');
INSERT INTO builders (id, name) VALUES (59, 'Myco');
INSERT INTO builders (id, name) VALUES (60, 'Myco ');
INSERT INTO builders (id, name) VALUES (61, 'MYCO');
INSERT INTO builders (id, name) VALUES (62, 'Northwood Ravin');
INSERT INTO builders (id, name) VALUES (63, 'NWR');
INSERT INTO builders (id, name) VALUES (64, 'PCS');
INSERT INTO builders (id, name) VALUES (65, 'Parkway');
INSERT INTO builders (id, name) VALUES (66, 'Samet');
INSERT INTO builders (id, name) VALUES (67, 'Samet Corp');
INSERT INTO builders (id, name) VALUES (68, 'Samet Corporation');
INSERT INTO builders (id, name) VALUES (69, 'Southway Builders');
INSERT INTO builders (id, name) VALUES (70, 'Speedwell Constrcution ');
INSERT INTO builders (id, name) VALUES (71, 'Sterling Constrcuction');
INSERT INTO builders (id, name) VALUES (72, 'Sterling Construction ');
INSERT INTO builders (id, name) VALUES (73, 'Swinerton');
INSERT INTO builders (id, name) VALUES (74, 'The Concorde');
INSERT INTO builders (id, name) VALUES (75, 'The Whiting-turner ');
INSERT INTO builders (id, name) VALUES (76, 'Thrive construction');
INSERT INTO builders (id, name) VALUES (77, 'Triangle');
INSERT INTO builders (id, name) VALUES (78, 'WM Jordan');
INSERT INTO builders (id, name) VALUES (79, 'Wallick Construction ');
INSERT INTO builders (id, name) VALUES (80, 'Weaver Cook ');
INSERT INTO builders (id, name) VALUES (81, 'Weaver Cooke');
INSERT INTO builders (id, name) VALUES (82, 'Weaver Cooke ');
INSERT INTO builders (id, name) VALUES (83, 'WeaverCook');
INSERT INTO builders (id, name) VALUES (84, 'Weavercook');
INSERT INTO builders (id, name) VALUES (85, 'Weavercook ');
INSERT INTO builders (id, name) VALUES (86, 'Weavercooke');
INSERT INTO builders (id, name) VALUES (87, 'Whiting Turner');
INSERT INTO builders (id, name) VALUES (88, 'Wies Builders');
INSERT INTO builders (id, name) VALUES (89, 'Wood Partners');

INSERT INTO estimators (id, name) VALUES (1, ' ');
INSERT INTO estimators (id, name) VALUES (2, 'EJ');
INSERT INTO estimators (id, name) VALUES (3, 'Josue');
INSERT INTO estimators (id, name) VALUES (4, 'Josue ');
INSERT INTO estimators (id, name) VALUES (5, 'Josue/Kevin ');
INSERT INTO estimators (id, name) VALUES (6, 'Kevin');
INSERT INTO estimators (id, name) VALUES (7, 'Kevin ');
INSERT INTO estimators (id, name) VALUES (8, 'Maria');
INSERT INTO estimators (id, name) VALUES (9, 'Maria/Josue');
INSERT INTO estimators (id, name) VALUES (10, 'Willy');
INSERT INTO estimators (id, name) VALUES (11, 'kevin');
INSERT INTO estimators (id, name) VALUES (12, 'willy');

INSERT INTO supervisors (id, name) VALUES (1, 'Abel');
INSERT INTO supervisors (id, name) VALUES (2, 'Alvaro');
INSERT INTO supervisors (id, name) VALUES (3, 'Cristian');
INSERT INTO supervisors (id, name) VALUES (4, 'Evin');
INSERT INTO supervisors (id, name) VALUES (5, 'Fredy');
INSERT INTO supervisors (id, name) VALUES (6, 'Gerardo');
INSERT INTO supervisors (id, name) VALUES (7, 'Gerson');
INSERT INTO supervisors (id, name) VALUES (8, 'Glenda');
INSERT INTO supervisors (id, name) VALUES (9, 'Javier');
INSERT INTO supervisors (id, name) VALUES (10, 'Jose');
INSERT INTO supervisors (id, name) VALUES (11, 'Juan');
INSERT INTO supervisors (id, name) VALUES (12, 'Santos');

INSERT INTO statuses (id, label) VALUES (1, 'Completed');
INSERT INTO statuses (id, label) VALUES (2, 'Completed ');
INSERT INTO statuses (id, label) VALUES (3, 'Completed w/ budget #''s');
INSERT INTO statuses (id, label) VALUES (4, 'Pending');
INSERT INTO statuses (id, label) VALUES (5, 'Pending ');
INSERT INTO statuses (id, label) VALUES (6, 'Voided');
INSERT INTO statuses (id, label) VALUES (7, 'completed');
INSERT INTO statuses (id, label) VALUES (8, 'pending');
INSERT INTO statuses (id, label) VALUES (9, 'sent');
INSERT INTO statuses (id, label) VALUES (10, 'unknown');

INSERT INTO locations (id, name) VALUES (1, 'Charlotte');
INSERT INTO locations (id, name) VALUES (2, 'Asheville');
INSERT INTO locations (id, name) VALUES (3, 'Hickory');
INSERT INTO locations (id, name) VALUES (4, 'Greensboro');
INSERT INTO locations (id, name) VALUES (5, 'Raleigh');
INSERT INTO locations (id, name) VALUES (6, 'Durham');

INSERT INTO projects (
        project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value
    ) VALUES (
        'Altera Propserity ', 89, 3, 6, 1, NULL, '2024-01-05', 1213269.55
    );
INSERT INTO projects (
        project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value
    ) VALUES (
        'Altera Albermarle Rd', 89, 3, 6, 1, NULL, '2024-01-05', 1170476.03
    );
INSERT INTO projects (
        project_name, builder_id, estimator_id, supervisor_id, status_id, location_id, due_date, contract_value
    ) VALUES (
        'The Sycamore at Monroe', 52, 6, 1, 2, NULL, '2024-02-09', 1487102.55
    );

-- Adding project-division relationships
INSERT INTO project_divisions (project_id, division_id) VALUES (1, 1); -- Altera Prosperity with Siding division
INSERT INTO project_divisions (project_id, division_id) VALUES (2, 1); -- Altera Albermarle with Siding division
INSERT INTO project_divisions (project_id, division_id) VALUES (3, 2); -- The Sycamore with Masonry division
-- Example of a project with both divisions
INSERT INTO project_divisions (project_id, division_id) VALUES (1, 2); -- Altera Prosperity also with Masonry division