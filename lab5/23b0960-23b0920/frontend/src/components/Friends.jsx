import React, { useEffect, useState } from 'react';
import "./Friends.css";

function Friends() {
    // TODO: Use useState to manage:
    // 1. Friend list
    // 2. Search query
    // 3. Search results
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // TODO: Implement fetchFriends function
    // - Call GET /friends API
    // - Include credentials
    // - Update friends state
    const fetchFriends = async () => {
        // Implement logic here
        try {
            const res = await fetch("http://localhost:4000/friends", { credentials: "include" });
            const data = await res.json();
            setFriends(data);
        } catch (err) {
            console.log(err);
        }
    };

    // TODO: Fetch friend list on component mount
    useEffect(() => {
        // Call fetchFriends here
        fetchFriends();
    }, []);

    // TODO: Implement handleSearch function
    // - Prevent default form submission
    // - Call GET /users/search?q=<query>
    // - Update searchResults state
    const handleSearch = async (e) => {
        // Implement logic here
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:4000/users/search?q=${searchQuery}`, { credentials: "include" });
            const data = await res.json();
            console.log("Data received from backend:");
            setSearchResults(data);
        } catch (err) {
            console.log(err);
        }
    };

    // TODO: Implement addFriend function
    // - Call POST /friends/add API with friend_id
    // - Clear search input and results on success
    // - Refresh friend list
    const addFriend = async (friendId) => {
        // Implement logic here
        try {
            await fetch("http://localhost:4000/friends/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ friendId })
            });
                setSearchQuery('');
                setSearchResults([]);
                fetchFriends();
        } catch (err) {
            console.log(err);
        }
    };

    // TODO: (Optional) Implement settle-up logic per friend
    // - This can redirect to dashboard or open a modal
    const handleSettle = async (friendId, amount, currency) => {
        // Optional implementation
    };

    return (
        <div className="friends-page">
            <h2>Friends</h2>

            {/* MY FRIENDS */}
            <div className="friends-card">
            <h3>My Friends</h3>

            {friends.length > 0 ? (
                <ul className="friend-list">
                {friends.map((f) => (
                    <li key={f.id} className="friend-item">
                    <span>{f.username}</span>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="empty-text">You have no friends yet</p>
            )}
            </div>

            {/* SEARCH USERS */}
            <div className="friends-card">
            <h3>Search Users</h3>

            <form className="search-form" onSubmit={handleSearch}>
                <input placeholder="Search by username" value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)
                }/>
                {/* wtf is e ? */}
                <button type="submit"> Search </button>
            </form>

            {searchResults.length > 0 && (
                <ul className="friend-list">
                {searchResults.map((u) => (
                    <li key={u.user_id} className="friend-item">
                    <span>{u.username}</span>
                    <button className="add-btn" onClick={() => addFriend(u.user_id)}> Add Friend </button>
                    </li>
                ))}
                </ul>
            )}
            {/* Issue is here (above) */}
            </div>
        </div>
        );

}

export default Friends;

 <>
            {/*
              TODO: Implement JSX for Friends page
              - Section to display current friends
              - Section to search users by username
              - Add Friend button for search results
              - Show empty-state message when no friends exist
            */}
        </>