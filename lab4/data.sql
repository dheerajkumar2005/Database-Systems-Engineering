INSERT INTO Users (username, password, role, full_name) VALUES
('prof_einstein', 'password', 'instructor', 'Albert Einstein'),
('prof_turing', 'password', 'instructor', 'Alan Turing'),
('prof_curie', 'password', 'instructor', 'Marie Curie'),
('prof_feynman', 'password', 'instructor', 'Richard Feynman'),
('prof_lovelace', 'password', 'instructor', 'Ada Lovelace'),
('prof_newton', 'password', 'instructor', 'Isaac Newton'),
('prof_bohr', 'password', 'instructor', 'Niels Bohr'),
('prof_darwin', 'password', 'instructor', 'Charles Darwin'),
('prof_hawking', 'password', 'instructor', 'Stephen Hawking'),
('prof_tesla', 'password', 'instructor', 'Nikola Tesla'),
('prof_galileo', 'password', 'instructor', 'Galileo Galilei'),
('prof_hopper', 'password', 'instructor', 'Grace Hopper'),
('prof_knuth', 'password', 'instructor', 'Donald Knuth'),
('prof_shannon', 'password', 'instructor', 'Claude Shannon'),
('prof_neumann', 'password', 'instructor', 'John von Neumann'),
('prof_maxwell', 'password', 'instructor', 'James Clerk Maxwell'),
('prof_faraday', 'password', 'instructor', 'Michael Faraday'),
('prof_rutherford', 'password', 'instructor', 'Ernest Rutherford'),
('prof_planck', 'password', 'instructor', 'Max Planck'),
('prof_schrodinger', 'password', 'instructor', 'Erwin Schrodinger');


INSERT INTO Courses (course_id, course_name, credits, slot, instructor_id, capacity) VALUES
('PH101', 'General Relativity', 8, 'A', 1, 50),
('CS101', 'Introduction to Computing', 6, 'B', 2, 100),
('CH101', 'Radioactivity', 6, 'C', 3, 40),
('PH102', 'Quantum Electrodynamics', 8, 'D', 4, 50),
('CS102', 'History of Computing', 4, 'A', 5, 60), -- Clashes with PH101
('MA101', 'Calculus I', 6, 'E', 6, 80),
('PH103', 'Atomic Models', 6, 'F', 7, 50),
('BI101', 'Evolutionary Biology', 6, 'G', 8, 70),
('PH104', 'Black Holes', 6, 'H', 9, 100),
('EE101', 'AC Power Systems', 6, 'B', 10, 60), -- Clashes with CS101
('AS101', 'Observational Astronomy', 6, 'C', 11, 40), -- Clashes with CH101
('CS103', 'Compiler Design', 8, 'D', 12, 60), -- Clashes with PH102
('CS104', 'Art of Programming', 8, 'E', 13, 50), -- Clashes with MA101
('EE102', 'Information Theory', 6, 'F', 14, 50), -- Clashes with PH103
('CS105', 'Game Theory', 6, 'G', 15, 60), -- Clashes with BI101
('PH105', 'Electromagnetism', 6, 'H', 16, 70), -- Clashes with PH104
('EE103', 'Electromagnetic Fields', 6, 'A', 17, 50), -- Clashes with PH101, CS102
('PH106', 'Nuclear Physics', 6, 'B', 18, 40), -- Clashes with CS101, EE101
('PH107', 'Quantum Mechanics', 8, 'C', 19, 50), -- Clashes with CH101, AS101
('PH108', 'Wave Mechanics', 6, 'D', 20, 50), -- Clashes with PH102, CS103
('CS201', 'Advanced Algorithms', 6, 'E', 2, 60), -- Clashes with MA101, CS104
('CH201', 'Advanced Chemistry', 6, 'F', 3, 40), -- Clashes with PH103, EE102
('MA201', 'Differential Equations', 6, 'G', 6, 70), -- Clashes with BI101, CS105
('BI201', 'Genetics', 6, 'H', 8, 60), -- Clashes with PH104, PH105
('EE201', 'Digital Logic', 6, 'A', 14, 50), -- Clashes with PH101, CS102, EE103
('CS202', 'Operating Systems', 6, 'B', 12, 80), -- Clashes with CS101, EE101, PH106
('PH201', 'Thermodynamics', 4, 'C', 19, 50), -- Clashes with CH101, AS101, PH107
('MA202', 'Number Theory', 4, 'D', 13, 40), -- Clashes with PH102, CS103, PH108
('CS203', 'Artificial Intelligence', 8, 'E', 2, 100), -- Clashes with MA101, CS104, CS201
('EE202', 'Wireless Communication', 6, 'F', 10, 50); -- Clashes with PH103, EE102, CH201

-- Insert Sample Students 
INSERT INTO Users (username, password, role, full_name) VALUES
('student1', 'password', 'student', 'Student One'),
('student2', 'password', 'student', 'Student Two');
