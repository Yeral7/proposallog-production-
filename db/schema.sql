-- SQLite creates the database as a file, so CREATE DATABASE and USE are not needed.
-- Data types have been adjusted for SQLite compatibility.

DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS builders;
DROP TABLE IF EXISTS estimators;
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
    status_id INTEGER,
    location_id INTEGER,
    division_id INTEGER,
    due_date TEXT,
    contract_value REAL,
    FOREIGN KEY (builder_id) REFERENCES builders(id),
    FOREIGN KEY (estimator_id) REFERENCES estimators(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (division_id) REFERENCES divisions(id)
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
INSERT INTO builders (id, name) VALUES (34, 'Gais Construction');
INSERT INTO builders (id, name) VALUES (35, 'Griffin');
INSERT INTO builders (id, name) VALUES (36, 'Griffin ');
INSERT INTO builders (id, name) VALUES (37, 'Harkins');
INSERT INTO builders (id, name) VALUES (38, 'Harkins ');
INSERT INTO builders (id, name) VALUES (39, 'Harmon Construction');
INSERT INTO builders (id, name) VALUES (40, 'Hendrick Construction');
INSERT INTO builders (id, name) VALUES (41, 'KMW Builders');
INSERT INTO builders (id, name) VALUES (42, 'KMW Builders ');
INSERT INTO builders (id, name) VALUES (43, 'Keach Construction');
INSERT INTO builders (id, name) VALUES (44, 'Keary Construction');
INSERT INTO builders (id, name) VALUES (45, 'Keary Construction ');
INSERT INTO builders (id, name) VALUES (46, 'Knight & Davis Construction Group');
INSERT INTO builders (id, name) VALUES (47, 'Landmark Construction');
INSERT INTO builders (id, name) VALUES (48, 'Landmark Properties');
INSERT INTO builders (id, name) VALUES (49, 'Liden Construction ');
INSERT INTO builders (id, name) VALUES (50, 'Liles Construction');
INSERT INTO builders (id, name) VALUES (51, 'Linden Construction');
INSERT INTO builders (id, name) VALUES (52, 'MB Khan ');
INSERT INTO builders (id, name) VALUES (53, 'MWBE ');
INSERT INTO builders (id, name) VALUES (54, 'March West');
INSERT INTO builders (id, name) VALUES (55, 'Marsh Bell');
INSERT INTO builders (id, name) VALUES (56, 'Marsh Bell ');
INSERT INTO builders (id, name) VALUES (57, 'Messer');
INSERT INTO builders (id, name) VALUES (58, 'Messer Construction');
INSERT INTO builders (id, name) VALUES (59, 'Morgan Keller');
INSERT INTO builders (id, name) VALUES (60, 'Morgan-Keller');
INSERT INTO builders (id, name) VALUES (61, 'Morgan-keller');
INSERT INTO builders (id, name) VALUES (62, 'Northview Partners');
INSERT INTO builders (id, name) VALUES (63, 'PARC Construction');
INSERT INTO builders (id, name) VALUES (64, 'Parker General Contractirs');
INSERT INTO builders (id, name) VALUES (65, 'Parker General Contractor');
INSERT INTO builders (id, name) VALUES (66, 'Samet Corp');
INSERT INTO builders (id, name) VALUES (67, 'Samet Corporation ');
INSERT INTO builders (id, name) VALUES (68, 'Southern Builders');
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
        project_name, builder_id, estimator_id, status_id, location_id, division_id, due_date, contract_value
    ) VALUES (
        'Altera Propserity ', 89, 3, 1, NULL, 1, '2024-01-05', 1213269.55
    );
INSERT INTO projects (
        project_name, builder_id, estimator_id, status_id, location_id, division_id, due_date, contract_value
    ) VALUES (
        'Altera Albermarle Rd', 89, 3, 1, NULL, 1, '2024-01-05', 1170476.03
    );
INSERT INTO projects (
        project_name, builder_id, estimator_id, status_id, location_id, division_id, due_date, contract_value
    ) VALUES (
        'The Sycamore at Monroe', 52, 6, 2, NULL, 2, '2024-02-09', 1487102.55
    );