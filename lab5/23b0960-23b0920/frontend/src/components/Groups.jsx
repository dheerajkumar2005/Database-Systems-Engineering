import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./Groups.css";


function Groups() {

    // TODO: Use useState to manage group list
    const [groups, setGroups] = useState([]);
    const navigate = useNavigate();

    // TODO: Implement fetchData function
    // - Call GET /groups API
    // - Include credentials
    // - Update groups state
    // - Handle error cases
    const fetchData = async () => {
        // Implement logic here
        try{
            const res = await fetch("http://localhost:4000/groups", { credentials: "include" });
            const data = await res.json();
            setGroups(data);
        }catch(err){
            console.log("Fetching failed!",err);
        }
    };

    // TODO: Fetch group list on component mount
    useEffect(() => {
        // Call fetchData here
        fetchData();
    }, []);

    {/*
        TODO: Implement JSX for Groups page
        - Display list of groups
        - Show "Create New Group" button
        - Navigate to /groups/create on button click
        - Show empty-state message when no groups exist
    */}
    return (
        <div className="groups-page">
            <div className="groups-header">
            <h2>Groups</h2>
            <button
                className="create-group-btn"
                onClick={() => navigate("/groups/create")}
            >
                + Create New Group
            </button>
            </div>

            {groups.length > 0 ? (
            <div className="groups-grid">
                {groups.map((g) => (
                <Link
                    to={`/group/${g.group_id}`}
                    key={g.group_id}
                    className="group-card"
                >
                    <h4>{g.name}</h4>
                </Link>
                ))}
            </div>
            ) : (
            <div className="empty-state">
                <p>No groups have been formed yet.</p>
            </div>
            )}
        </div>
    );

}

export default Groups;
