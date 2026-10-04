DROP TABLE IF EXISTS Registrations CASCADE;
DROP TABLE IF EXISTS Courses CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL, 
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor')),
    full_name VARCHAR(100)
);

CREATE TABLE Courses (
    course_id VARCHAR(10) PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL,
    slot VARCHAR(5) NOT NULL,
    instructor_id INTEGER REFERENCES Users(user_id),
    capacity INTEGER DEFAULT 50
);

CREATE TABLE Registrations (
    registration_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES Users(user_id),
    course_id VARCHAR(10) REFERENCES Courses(course_id),
    status VARCHAR(20) DEFAULT 'enrolled',
    UNIQUE(student_id, course_id)
);
