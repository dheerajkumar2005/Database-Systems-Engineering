import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function CreateGroup() {

    // 1. Group name
    // 2. Friend list
    // 3. Selected friends
    const [name, setName] = useState('');
    const [friends, setFriends] = useState([]);
    const [selectedFriends, setSelectedFriends] = useState([]);

    const navigate = useNavigate();

    // Fetch friend list
    useEffect(() => {
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

        fetchFriends();
    }, []);

    // Toggle friend selection
    const toggleFriend = (id) => {
        if (selectedFriends.includes(id)) {
            setSelectedFriends(selectedFriends.filter(f => f !== id));
        } else {
            setSelectedFriends([...selectedFriends, id]);
        }
    };

    // Create group
    const handleCreateGroup = async (e) => {
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
                        member_ids: selectedFriends
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

    return (
        <div>
            <h2>Create Group</h2>

            <form onSubmit={handleCreateGroup}>
                {/* Group Name Input */}
                <div>
                    <input
                        type="text"
                        placeholder="Group Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Friend Selection */}
                <h3>Select Friends</h3>

                {friends.length > 0 ? (
                    friends.map(friend => (
                        <div key={friend.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedFriends.includes(friend.id)}
                                    onChange={() => toggleFriend(friend.id)}
                                />
                                {friend.username}
                            </label>
                        </div>
                    ))
                ) : (
                    <div>
                        <p>No friends yet.</p>
                        <Link to="/friends">Add Friends</Link>
                    </div>
                )}

                {/* Buttons */}
                <div style={{ marginTop: "10px" }}>
                    <button type="submit">Create Group</button>
                    <button
                        type="button"
                        onClick={() => navigate("/groups")}
                        style={{ marginLeft: "10px" }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateGroup;
