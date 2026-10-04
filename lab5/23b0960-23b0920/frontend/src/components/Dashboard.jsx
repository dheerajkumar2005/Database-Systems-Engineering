import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import "./Dashboard.css";

function Dashboard() {

    const [balances, setBalances] = useState([]);
    const [friends, setFriends] = useState([]);

    const [settleTo, setSettleTo] = useState('');
    const [settleAmount, setSettleAmount] = useState('');

    const [message, setMessage] = useState("");

    // Fetch balances + friends
    const fetchData = async () => {
        try {
            const balancesRes = await fetch("http://localhost:4000/balances", {
                credentials: "include"
            });

            if (!balancesRes.ok) throw new Error("Failed to fetch balances");
            const balancesData = await balancesRes.json();
            setBalances(balancesData);


            const friendsRes = await fetch("http://localhost:4000/friends", {
                credentials: "include"
            });

            if (!friendsRes.ok) throw new Error("Failed to fetch friends");
            const friendsData = await friendsRes.json();
            setFriends(friendsData);

        } catch (err) {
            console.error(err);
            setMessage("Error loading dashboard data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle settle form
    const handleSettleUp = async (e) => {
        e.preventDefault();
        setMessage("");

        const to_user = Number(settleTo);
        const amount = parseFloat(settleAmount);

        // Validation
        if (!to_user) {
            setMessage("Please select a friend");
            return;
        }

        if (!amount || amount <= 0) {
            setMessage("Enter a valid amount");
            return;
        }

        try {
            const res = await fetch("http://localhost:4000/settle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ to_user, amount })
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Settlement failed");
                return;
            }

            setMessage("Settlement successful");

            setSettleTo('');
            setSettleAmount('');

            fetchData();

        } catch (err) {
            console.error(err);
            setMessage("Server error while settling");
        }
    };

    return (
        <div className="dashboard">
            <h2>Dashboard</h2>

            {/* BALANCES */}
            <div className="dashboard-card">
                <h3>Your Balances</h3>

                {balances.length > 0 ? (
                    <ul className="balance-list">
                        {balances.filter(b => Number(b.amount) !== 0)
                            .map((b, idx) => (
                            <li key={idx} className="balance-item">
                                <span>{b.other_username}</span>
                                <span className={b.amount >= 0 ? "positive" : "negative"}>
                                {Number(b.amount) > 0
                                    ? `owes you ₹${Number(b.amount).toFixed(2)}`
                                    : `you owe ₹${Math.abs(Number(b.amount)).toFixed(2)}`
                                }
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-text">No balances pending</p>
                )}
            </div>

            {/* SETTLE */}
            <div className="dashboard-card">
                <h3>Settle Up</h3>

                {settleTo && (
                    <p className="paying-text">
                        Paying to <strong>
                            {friends.find(f => f.user_id == settleTo)?.username}
                        </strong>
                    </p>
                )}

                <form className="settle-form" onSubmit={handleSettleUp}>

                    <select
                        value={settleTo}
                        onChange={(e) => setSettleTo(e.target.value)}
                        required
                    >
                        <option value="">Select friend</option>
                        {friends.map((f) => (
                            <option key={f.user_id} value={f.user_id}>
                                {f.username}
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                        required
                    />

                    <button type="submit">Settle</button>
                </form>

                {message && <p className="status-message">{message}</p>}

                <div className="quick-links">
                    <Link to="/groups">View Groups</Link>
                    <Link to="/friends">View Friends</Link>
                </div>
            </div>

        </div>
    );
}

export default Dashboard;
