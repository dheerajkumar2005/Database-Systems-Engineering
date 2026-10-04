const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');
// const { get } = require('express/lib/response');
require('dotenv').config();

// Global variable to store database credentials
let dbConfig = null;
let pool = null;

const app = express();
const port = 3000;

// Check for environment variables
if (process.env.DB_HOST && process.env.DB_PORT && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD) {
    dbConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    };
    pool = new Pool(dbConfig);
    console.log("Database configured via environment variables.");
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // For CSS/Images if needed
app.set('view engine', 'ejs');

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));




function isAuthenticated(req, res, next) {
    // TODO: Implement authentication check
    if(!req.session.user){
        res.redirect('/login');
        return;
    }
    next();
}

function isInstructor(req, res, next) {
    // TODO: Implement check for instructor role
    if(req.session.user.role !== 'instructor'){
        res.redirect('/login');
        return;
    }
    next();
}

// Function to get or initialize the pool
function getPool() {
    if (!pool && dbConfig) {
        pool = new Pool(dbConfig);
    }
    return pool;
}

// Route to serve the credentials form
// Route to serve the credentials form - DEPRECATED
// app.get('/', (req, res) => {
//     if (dbConfig) {
//         res.redirect('/login');
//     } else {
//         res.render('credentials');
//     }
// });

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Route to handle credentials submission - DEPRECATED
// app.post('/set-credentials', (req, res) => {
//     ...
// });


app.get('/login', (req, res) => {
    const error = req.query.error;
    if(req.session.user){
        if(req.session.user.role === 'student'){
            return res.redirect('/student/dashboard');
        }
        else if(req.session.user.role === 'instructor'){
            return res.redirect('/instructor/dashboard');
        }
    }
    res.render('login', { error_msg: error });
});

// TODO: Implement user login logic
// 1. Check credentials in Users table  
// 2. Set session user
// 3. Redirect to appropriate dashboard based on role

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const client = await getPool().connect();
    try{
        const Query = 'SELECT * FROM Users WHERE username = $1 AND password = $2';
        const Result = await client.query(Query, [username, password]);
        if(Result.rows.length === 0){
            return res.redirect('/login?error=Incorrect username or password');
        }
        const login_user = Result.rows[0];
        req.session.user = {
            user_id : login_user.user_id,
            role : login_user.role,
            full_name : login_user.full_name
        }
        if(login_user.role === 'student'){
            return res.redirect('/student/dashboard');
        }
        else if(login_user.role === 'instructor'){
            return res.redirect('/instructor/dashboard');
        }
        else{
            return res.redirect('/login?error=Unknown role');
        }
    }
    catch(err){
        console.error(err);
        return res.redirect('/login?error=Authentication failed');
    }
    finally{
        client.release();
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(function(err) {
        if (err) {
            console.error(err); 
        }
        return res.redirect('/');
    });
});

// TODO: Render student dashboard
// 1. Fetch registered courses for the student
// 2. Fetch all available courses (exclude registered ones)
// 3. Calculate total credits

app.get('/student/dashboard', isAuthenticated, async (req, res) => {
    const client = await getPool().connect();
    try{
        const error = req.query.error;
        const success = req.query.success;
        const student_id = req.session.user.user_id;
        const registered_courses_query = 'SELECT c.* FROM courses c JOIN registrations r ON c.course_id = r.course_id WHERE r.student_id = $1';
        const registered_courses_data = await client.query(registered_courses_query, [student_id]);

        const available_courses_query = 'SELECT * FROM courses WHERE course_id NOT IN (SELECT course_id FROM registrations WHERE student_id = $1)';
        const available_courses_data = await client.query(available_courses_query, [student_id]);

        const total_credits = registered_courses_data.rows.reduce((sum, course) => sum + course.credits, 0);
        
        res.render('student_dashboard', { 
            full_name: req.session.user.full_name,
            registered_courses: registered_courses_data.rows,
            available_courses: available_courses_data.rows,
            total_credits: total_credits,
            error_msg: error,
            success_msg: success
            
        });
    }
    catch(err){
        console.error(err);
        return res.redirect('/student/dashboard?error=Failed to load dashboard');
    }
    finally{
        client.release();
    }
});

// TODO: Implement registration logic
// 1. Check if course exists
// 2. Check for Slot Clash (Cannot register for same slot twice)
// 3. Check Credit Limit (Max 24 credits)
// 4. Check Course Capacity (Optional)
// 5. Insert into Registrations table
app.post('/student/register', isAuthenticated, async (req, res) => {
    const course_id = req.body.course_id;
    const student_id = req.session.user.user_id;
    const client = await getPool().connect();
    try{
        // course exists check
        const course_exists_query = "SELECT * FROM courses WHERE course_id = $1";
        const course_exists_result = await client.query(course_exists_query,[course_id]);
        if(course_exists_result.rows.length === 0){
            // console.log(course_id)
            return res.redirect('/student/dashboard?error=Course does not exist');   
        }
        const course = course_exists_result.rows[0];
        const registered_courses_query = 'SELECT c.* FROM courses c JOIN registrations r ON c.course_id = r.course_id WHERE r.student_id = $1';
        const registered_courses_data = await client.query(registered_courses_query, [student_id]);

        const total_credits = registered_courses_data.rows.reduce((sum, course) => sum + course.credits, 0);

        // duplicate course check
        if(registered_courses_data.rows.some(c => c.course_id == course_id)){
            return res.redirect('/student/dashboard?error=Already registered for this course');
        }
        // slot clash check
        if(registered_courses_data.rows.some(c => c.slot === course.slot)){
            return res.redirect('/student/dashboard?error=Slot clash detected');
        }
        // credit limit check
        if(total_credits + course.credits > 24){
            return res.redirect('/student/dashboard?error=Credit limit exceeded');
        }
        // course capacity check
        const capacity_check_query = 'SELECT COUNT(*) FROM registrations WHERE course_id = $1';
        const capacity_check_result = await client.query(capacity_check_query, [course_id]);
        const enrolled_count = parseInt(capacity_check_result.rows[0].count);
        if(enrolled_count >= course.capacity){
            return res.redirect('/student/dashboard?error=Course capacity reached');
        }
        // insert into registrations
        const insert_query = 'INSERT INTO registrations (student_id, course_id) VALUES ($1,$2)';
        await client.query(insert_query, [student_id, course_id]);
        return res.redirect(`/student/dashboard?success=added course ${course.course_id} successfully`);
    }
    catch(err){
        console.error(err);
        return res.redirect('/student/dashboard?error=Registration failed');
    }
    finally{
        client.release();
    }
});

// TODO: Implement drop logic
// 1. Delete from Registrations table
app.post('/student/drop', isAuthenticated, async (req, res) => {
    const course_id = req.body.course_id;
    const student_id = req.session.user.user_id;
    const client = await getPool().connect();
    try{
        const delete_query = 'DELETE FROM registrations WHERE student_id = $1 AND course_id = $2';
        const result = await client.query(delete_query, [student_id, course_id]);
        if(result.rowCount === 0){
            return res.redirect('/student/dashboard?error=This course is not registered to drop');
        }
        return res.redirect(`/student/dashboard?success=dropped course ${course_id} successfully`);
    }
    catch(err){
        console.error(err);
        return res.redirect('/student/dashboard?error=Failed to drop course');
    }
    finally{
        client.release();
    }
});


// TODO: Render instructor dashboard
// 1. Fetch courses taught by this instructor
app.get('/instructor/dashboard', isAuthenticated, isInstructor, async (req, res) => {
    const instructor_id = req.session.user.user_id;
    const client = await getPool().connect();
    const error = req.query.error;
    try{
        const courses_taught_query = 'SELECT * FROM courses WHERE instructor_id = $1';
        const courses_taught_data = await client.query(courses_taught_query, [instructor_id]);
        res.render('instructor_dashboard', {
            full_name: req.session.user.full_name,
            courses_taught: courses_taught_data.rows,
            error_msg: error
        });
    }
    catch(err){
        console.error(err);
        return res.redirect('/instructor/dashboard?error=Failed to load dashboard');
    }
    finally{
        client.release();
    }
});

// TODO: Show students enrolled in a specific course
// 1. Verify instructor owns the course
// 2. Fetch enrolled students
app.get('/instructor/course/:id', isAuthenticated, isInstructor, async (req, res) => {
    const course_id = req.params.id;
    const error = req.query.error;
    const success = req.query.success;
    const instructor_id = req.session.user.user_id;
    const client = await getPool().connect();
    try{
        // ownership check
        const course_query = 'SELECT * FROM courses WHERE course_id = $1 AND instructor_id = $2';
        const course_result = await client.query(course_query, [course_id, instructor_id]);
        if(course_result.rows.length === 0){
            return res.redirect('/instructor/dashboard?error=You do not teach this course');
        }
        // fetch enrolled students
        const fetch_students_query = 'SELECT u.user_id, u.username, u.full_name FROM users u JOIN registrations r ON u.user_id = r.student_id WHERE r.course_id = $1';
        const students_result = await client.query(fetch_students_query, [course_id]);
        res.render('instructor_course', {
            full_name: req.session.user.full_name,
            course: course_result.rows[0],
            enrolled_students: students_result.rows,
            error_msg: error,
            success_msg: success
        });
    }
    catch(err){
        console.error(err);
        return res.redirect('/instructor/dashboard?error=Failed to load course details');
    }
    finally{
        client.release();
    }
});


// TODO: Implement manual student addition
// 1. Check if student exists
// 2. Check if already enrolled
// 3. Check Credit Limit (If exceeded, allow but show WARNING)
// 4. Insert into Registrations
app.post('/instructor/add-student', isAuthenticated, isInstructor, async (req, res) => {
    const { course_id, student_username } = req.body;
    const client = await getPool().connect();
    try{
        // student exists check
        const student_query = 'SELECT * FROM users WHERE username = $1 AND role = $2';
        const student_result = await client.query(student_query, [student_username, 'student']);
        if(student_result.rows.length === 0){
            return res.redirect(`/instructor/course/${course_id}?error=Student does not exist`);
        }
        const student = student_result.rows[0];
        const student_id = student.user_id;

        // already enrolled check
        const enrolled_check_query = 'SELECT * FROM registrations WHERE student_id = $1 AND course_id = $2';
        const enrolled_check_result = await client.query(enrolled_check_query, [student_id, course_id]);
        if(enrolled_check_result.rows.length != 0){
            return res.redirect(`/instructor/course/${course_id}?error=Student already enrolled in this course`);
        }
        // credit limit check
        const registered_courses_query = 'SELECT c.* FROM courses c JOIN registrations r ON c.course_id = r.course_id WHERE r.student_id = $1';
        const registered_courses_data = await client.query(registered_courses_query, [student_id]);

        const total_credits = registered_courses_data.rows.reduce((sum, course) => sum + course.credits, 0);
        const course_query = 'SELECT * FROM courses WHERE course_id = $1';
        const course_result = await client.query(course_query, [course_id]);
        const course = course_result.rows[0];

        let warning_msg = '';
        if(total_credits + course.credits > 24){
            warning_msg = 'Warning: Credit limit exceeded for the student. Added anyway.';
        }
        
        // insert into registrations
        const insert_query = 'INSERT INTO registrations (student_id, course_id) VALUES ($1,$2)';
        await client.query(insert_query, [student_id, course_id]);
        return res.redirect(`/instructor/course/${course_id}?success=Student added successfully. ${warning_msg}`);
    }
    catch(err){
        console.error(err);
        return res.redirect(`/instructor/course/${course_id}?error=Failed to add student`);
    }
    finally{
        client.release();
    }
});

// TODO: Implement student removal
// 1. Delete from Registrations
app.post('/instructor/remove-student', isAuthenticated, isInstructor, async (req, res) => {
    const { course_id, student_id } = req.body;
    const client = await getPool().connect();
    try{
        const delete_query = 'DELETE FROM registrations WHERE student_id = $1 AND course_id = $2';
        const result = await client.query(delete_query, [student_id, course_id]);
        if(result.rowCount === 0){
            return res.redirect(`/instructor/course/${course_id}?error=This student is not enrolled in the course`);
        }
        return res.redirect(`/instructor/course/${course_id}?success=Student removed successfully`);
    }
    catch(err){
        console.error(err);
        return res.redirect(`/instructor/course/${course_id}?error=Failed to remove student`);
    }
    finally{
        client.release();
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


