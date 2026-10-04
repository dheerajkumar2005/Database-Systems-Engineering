import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import "./GroupDetails.css";


function GroupDetails({user}) {
    // TODO: Extract group ID from route params
    const {id} = useParams();

    // TODO: Use useState to manage:
    // 1. Group details
    // 2. Group members
    // 3. Expense list
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);

    // TODO: Add Expense form state
    // - Description
    // - Amount
    // - Paid-by user ID
    // - Users to split with
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [splitWith, setSplitWith] = useState([]);

    // TODO: Settle Up form state
    // - User to settle with
    // - Settlement amount
    const [settleTo, setSettleTo] = useState('');
    const [settleAmount, setSettleAmount] = useState('');

    // TODO: Implement fetchData function
    // - Fetch group details using GET /groups/:id
    // - Fetch expenses using GET /groups/:id/expenses
    // - Update group, members, and expenses state
    // - Set default paidBy to current user if applicable
    const fetchData = async () => {
        // Implement logic here
        try {
            const groupRes = await fetch(
                `http://localhost:4000/groups/${id}`,
                { credentials: "include" }
            );
            const groupData = await groupRes.json();
            setGroup(groupData);
            // setMembers(groupData.members || []);
            setMembers(Array.isArray(groupData.members) ? groupData.members : []);

            

            const expensesRes = await fetch(
                `http://localhost:4000/groups/${id}/expenses`,
                { credentials: "include" }
            );
            const expensesData = await expensesRes.json();
            setExpenses(expensesData);

            // Default paidBy to current user
            if (user && user.user_id) {
                setPaidBy(user.user_id);
            }

        } catch (err) {
            console.log(err);
        }
    };

    // TODO: Fetch group data on component mount or when id changes
    useEffect(() => {
        // Call fetchData here
        fetchData();
    }, [id]);

    // TODO: Set default paidBy when user info is available
    useEffect(() => {
        // Set paidBy to user.user_id if not already set
        if (user && user.user_id && !paidBy) {
            setPaidBy(user.user_id);
        }
    }, [user]);

    // TODO: Implement handleAddExpense function
    // - Validate form inputs
    // - Calculate split amounts
    // - Call POST /expenses API
    // - Reset form and refresh data on success
    const handleAddExpense = async (e) => {
        // Implement logic here
        e.preventDefault();

        if (!description || !amount || !paidBy || splitWith.length === 0) {
            alert("Please fill all fields");
            return;
        }

        try {
            const res = await fetch("http://localhost:4000/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    groupId: id,
                    description,
                    amount: parseFloat(amount),
                    paidBy,
                    splitWith
                })
            });

            if (res.ok) {
                setDescription('');
                setAmount('');
                setSplitWith([]);
                fetchData();
            }

        } catch (err) {
            console.log(err);
        }
    };

    // TODO: Implement handleSettleUp function
    // - Validate settlement inputs
    // - Call POST /settle API
    // - Show success or error messages
    const handleSettleUp = async (e) => {
        // Implement logic here
        e.preventDefault();

        if (!settleTo || !settleAmount) {
            alert("Please fill settlement fields");
            return;
        }

        try {
            const res = await fetch("http://localhost:4000/settle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    to_user: Number(settleTo),
                    amount: parseFloat(settleAmount)
                })
            });

            if (res.ok) {
                setSettleAmount('');
                setSettleTo('');
                fetchData();
                // alert("Settlement successful");
            }

        } catch (err) {
            console.log(err);
        }
    };

    // TODO: Implement toggleSplitMember function
    // - Add/remove user ID from splitWith list
    // const toggleSplitMember = (uid) => {
    //     // Implement logic here
    //     if (splitWith.includes(uid)) {
    //         setSplitWith(splitWith.filter(id => id !== uid));
    //     } else {
    //         setSplitWith([...splitWith, uid]);
    //     }
    // };

    const toggleSplitMember = (uid) => {
        setSplitWith(prev =>
            prev.includes(uid)
                ? prev.filter(id => id !== uid)
                : [...prev, uid]
        );
    };


    if (!group) return <div className="loading-text">Loading group...</div>;

    return (
        <div className="group-details">
            <h2>{group.name}</h2>

            {/* EXPENSE HISTORY */}
            <div className="group-card">
            <h3>Expenses</h3>

            {expenses.length > 0 ? (
                <ul className="expense-list">
                {expenses.map((e) => (
                    <li key={e.expense_id} className="expense-item">
                    <span>
                        <strong>{e.description}</strong>
                    </span>
                    <span>
                        ${e.amount} (Paid by {e.paid_by_name})
                    </span>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="empty-text">No expenses yet</p>
            )}
            </div>

            {/* ADD EXPENSE */}
            <div className="group-card">
            <h3>Add Expense</h3>

            <form className="group-form" onSubmit={handleAddExpense}>
                <input placeholder="Description" value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <input placeholder="Amount" type="number" value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                />

                <select value={paidBy} 
                    onChange={(e) => setPaidBy(Number(e.target.value))}
                >
                    
                <option value="">Select payer</option>
                {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                        {m.name}
                    </option>
                ))}
                </select>

                <div className="split-section">
                <p>Split With:</p>
                <div className="split-members">
                    {members.map((m) => (
                    <label key={m.user_id}>
                        <input
                        type="checkbox"
                        checked={splitWith.includes(m.user_id)}
                        onChange={() => toggleSplitMember(m.user_id)}
                        />
                        {m.name}
                    </label>
                    ))}
                </div>
                </div>

                <button type="submit">Add Expense</button>
            </form>
            </div>

            {/* SETTLE UP */}
            <div className="group-card">
            <h3>Settle Up</h3>

            <form className="group-form" onSubmit={handleSettleUp}>
                {settleTo && (  <p>
                Paying to{" "}
                <strong>
                    {members.find(m => m.user_id === Number(settleTo))?.name || "—"}
                </strong>
                </p>)}
                <select
                value={settleTo}
                onChange={(e) => setSettleTo(Number(e.target.value))}
                >
                <option value="">Select member</option>
                {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                    {m.name}
                    </option>
                ))}
                </select>

                <input
                type="number"
                placeholder="Amount"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                />

                <button type="submit">Settle</button>
            </form>
            </div>
        </div>
    );

}
            {/*
              TODO: Implement JSX for Group Details page
              - Add Expense form
              - Paid-by dropdown
              - Split-with checkboxes
              - Group name and expense history
              - Loading state when group data is not available
            */}

export default GroupDetails;
