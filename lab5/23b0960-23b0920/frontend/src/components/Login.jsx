import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({onLogin}) {
    const navigate = useNavigate();
    // TODO: Use useState to manage:
    // 1. Signup/Login toggle
    // 2. Form data (username, password, email)
    // 3. Error messages
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', email: '' });
    const [error, setError] = useState('');

    // TODO: Implement handleSubmit function
    // - Prevent default form submission
    // - Choose endpoint based on login/signup
    // - Call POST /login or POST /signup API
    // - Handle success:
    //   - Call onLogin with user data
    // - Handle error responses
    const handleSubmit = async (e) => {
        // Implement logic here
        e.preventDefault();
        setError("");
        
        let url = "http://localhost:4000/login";
        if(isSignup){
            url = "http://localhost:4000/signup"
        }

        let body = {
            username: formData.username.trim(),
            password: formData.password
        };

        if(isSignup){
            body = {
                username: formData.username,
                email: formData.email,
                password: formData.password
            };
        }

        try{
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                if (isSignup) {
                    // after signup → go to login page instead
                    setIsSignup(false);
                    setFormData({ username: '', password: '', email: '' });
                    alert("Signup successful. Please login.");
                } else {
                    // login flow
                    onLogin(data);
                    navigate("/");
                }
            }
            else{
                setError(data.message || "Authentication failed");
            }
        }
        catch (err){
            setError("Server error");
        }
    };

    {/*
        TODO: Implement JSX for Login / Signup page
        - Username input
        - Password input
        - Email input (only for signup)
        - Error message display
        - Submit button
        - Toggle between Login and Signup
    */}
    return (
        <div className="login-wrapper">
            <div className="login-card">
            <h2>{isSignup ? "Sign Up" : "Login"}</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                    }
                    required
                />

                {isSignup && (
                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                    required
                />
                )}

                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                    }
                required
                />

                <button type="submit">
                    {isSignup ? "Sign Up" : "Login"}
                </button>
            </form>

            <p className="toggle-text">
                {isSignup
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
                <span
                onClick={() => {
                    setIsSignup(!isSignup);
                    setError("");
                }}
                >
                {isSignup ? "Login" : "Sign Up"}
                </span>
            </p>
            </div>
        </div>
        );

}

export default Login;
