import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';

// Import required components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import GroupDetails from './components/GroupDetails';
import Friends from './components/Friends';
import CreateGroup from './components/CreateGroup';

import './App.css';

function App() {
  const navigate = useNavigate();
  
  // TODO: Maintain user authentication state
  // user should store logged-in user details
  // loading should indicate whether auth status is being checked
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // TODO: Implement authentication status check
  // On component mount:
  // 1. Make an API call to check if the user is logged in
  // 2. If logged in, store user data in state
  // 3. Stop the loading state
  useEffect(() => {
    const checkLoginStatus = async () => {
      // Implement API call here
      try{
        const res = await fetch("http://localhost:4000/isLoggedIn",{credentials:"include"});
        const data = await res.json();
        if(data.loggedIn) setUser(data.user);
      }
      catch (err) {
        console.log("Auth failed " , err);
      }
      setLoading(false);
    };
    checkLoginStatus();
  }, []);

  // TODO: Handle successful login
  // This function should:
  // 1. Update user state
  // 2. Redirect to dashboard
  const handleLogin = (userData) => {
    // Implement login logic here
    setUser(userData);
    navigate("/");
  };

  // TODO: Handle logout functionality
  // This function should:
  // 1. Call logout API
  // 2. Clear user state
  // 3. Redirect to login page
  const handleLogout = async () => {
    // Implement logout logic here
    // ADARSH : -> add try and catch
      await fetch ("http://localhost:4000/logout",{
        method: "POST",
        credentials: "include"
      });

      setUser(null);
      navigate("/login");
  };

  // TODO: Show a loading indicator while authentication is being checked
  if (loading) {
    return <div>Loading .... Please wait</div>;
  }

  return (
    <div className="app">
      {/* TODO: Show navigation bar only when user is logged in */}
      {user && (
        <nav className="container">
          <div className="logo">
            <strong>Expense Splitter</strong> | {user.username} 
          </div>
          <div className="nav-links">
            {/* TODO: Add navigation links */}
            {/* Dashboard, Groups, Friends */}
            {/* Add logout button */}
            <Link to="/">Dashboard </Link>
            <Link to="/groups">Groups </Link>
            <Link to="/friends">Friends </Link>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </nav>
      )}


      <div className="container">
        {/* TODO: Configure application routes */}
        <Routes>
          {/* Login route (only accessible when logged out) */}
          <Route path="/login" element={
            (() => {
              if(user){
                return <Navigate to="/" />
              }
              else{
                return <Login onLogin={handleLogin} />
              }
            })()
          }/>

          {/* Protected routes (only accessible when logged in) */}
          <Route path="/" element={
            (() => {
              if(user){
                return <Dashboard />
              }
              else{
                return <Login onLogin={handleLogin} />
              }
            })()
          } />
          <Route path="/groups" element={
            (() => {
              if(user){
                return <Groups />
              }
              else{
                return <Login onLogin={handleLogin} />
              }
            })()
          } />
          <Route path="/groups/create" element={
            (() => {
              if(user){
                return <CreateGroup />
              }
              else{
                return <Login onLogin={handleLogin} />
              }
            })()
          } />
          <Route path="/group/:id" element={
            (() => {
              if(user){
                return <GroupDetails />
              }
              else{
                return <Login onLogin={handleLogin} />
              }
            })()
          } />
          <Route path="/friends" element={
            (() => {
              if(user){
                return <Friends />
              }
              else{
                return <Login onLogin={handleLogin} />
              }
            })()
          } />
        </Routes>
      </div>
    </div>
  );
}

export default App;
