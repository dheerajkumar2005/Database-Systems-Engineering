import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "./CreateGroup.css";


function CreateGroup() {

    // TODO: Use useState to manage:
    // 1. Group name
    // 2. Friend list
    // 3. Selected friends
    const [name, setName] = useState('');
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);

    const navigate = useNavigate();

    // TODO: Fetch the friend list  of the logged-in user
    // - Call GET /friends API
    // - Include credentials
    // - Store the response in friends state
    // - Handle error cases

    const fetchFriends = async () => {
        try {
            const res = await fetch(
                "http://localhost:4000/friends",
                { credentials: "include" }
            );

            if (!res.ok) {
                throw new Error("Failed to fetch friends");
            }

            const data = await res.json();
            setFriends(data);

        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        // Implement logic here
        fetchFriends();
    }, []);

    // TODO: Implement handleCreateGroup function
    // - Prevent default form submission
    // - Validate group name
    // - Call POST /groups API with:
    //   { name, member_ids }
    // - Navigate to /groups on success
    const handleCreateGroup = async (e) => {
        // Implement logic here
        e.preventDefault();

        if (!name.trim()) {
            alert("Please enter a group name");
            return;
        }

        try {
            const res = await fetch(
                "http://localhost:4000/groups",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name,
                        members: selectedFriends
                    })
                }
            );

            if (res.ok) {
                navigate("/groups");
            } else {
                alert("Failed to create group");
            }

        } catch (err) {
            console.log(err);
        }
    };

    // TODO: Implement toggleFriend function
    // - Add/remove friend ID from selectedFriends array
    const toggleFriend = (id) => {
        // Implement logic here
        if (selectedFriends.includes(id)) {
            setSelectedFriends(selectedFriends.filter(f => f !== id));
        } else {
            setSelectedFriends([...selectedFriends, id]);
        }
    };

    return (
        <div className="create-group-page">
            <h2>Create Group</h2>

            <div className="create-group-card">
            <form className="create-group-form" onSubmit={handleCreateGroup}>
                
                {/* Group Name */}
                <input type="text" placeholder="Enter group name" value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                {/* Friend Selection */}
                <div className="friend-selection">
                <h3>Select Friends</h3>

                {friends.length > 0 ? (
                    <div className="friend-checkbox-list">
                    {friends.map((friend) => (
                        <label key={friend.user_id} className="friend-checkbox">
                        <input
                            type="checkbox"
                            checked={selectedFriends.includes(friend.user_id)}
                            onChange={() => toggleFriend(friend.user_id)}
                        />
                        {friend.username}
                        </label>
                    ))}
                    </div>
                ) : (
                    <div className="empty-friends">
                    <p>No friends yet.</p>
                    <Link to="/friends">Add Friends</Link>
                    </div>
                )}
                </div>

                {/* Buttons */}
                <div className="button-group">
                <button type="submit" className="primary-btn">
                    Create Group
                </button>
                <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => navigate("/groups")}
                >
                    Cancel
                </button>
                </div>

            </form>
            </div>
        </div>
    );
}

export default CreateGroup;

 <>
            {/* 
              TODO: Implement JSX for Create Group page
              - Input field for group name
              - Checkbox list of friends
              - "Create Group" and "Cancel" buttons
              - Link to add friends if friend list is empty
            */}
        </>