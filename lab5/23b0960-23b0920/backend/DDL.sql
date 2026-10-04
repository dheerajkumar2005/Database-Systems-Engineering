DROP TABLE IF EXISTS Settlement CASCADE;
DROP TABLE IF EXISTS Balance CASCADE;
DROP TABLE IF EXISTS ExpenseSplit CASCADE;
DROP TABLE IF EXISTS Expense CASCADE;
DROP TABLE IF EXISTS GroupMember CASCADE;
DROP TABLE IF EXISTS Groups CASCADE;
DROP TABLE IF EXISTS Friend CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- 1. Users
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100)
);

-- 2. Friends
CREATE TABLE Friend (
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (friend_id) REFERENCES Users(user_id)
);

-- 3. Groups
CREATE TABLE Groups (
    group_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

CREATE TABLE GroupMember (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES Groups(group_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- 4. Expenses
CREATE TABLE Expense (
    expense_id SERIAL PRIMARY KEY,
    group_id INT NOT NULL, -- Expenses belong to a group
    paid_by INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES Groups(group_id),
    FOREIGN KEY (paid_by) REFERENCES Users(user_id)
);

-- 5. Expense Split
CREATE TABLE ExpenseSplit (
    expense_id INT NOT NULL,
    user_id INT NOT NULL,
    share_amount DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (expense_id, user_id),
    FOREIGN KEY (expense_id) REFERENCES Expense(expense_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- 6. Balance (Aggregated debt)
-- user_id owes other_user_id amount.
-- Balance(user_id, other_user_id, amount).
-- Interpretation: "amount" is the net value "user_id" has relative to "other_user_id".
-- +ve: other_user owes user.
-- -ve: user owes other_user.
CREATE TABLE Balance (
    user_id INT NOT NULL,
    other_user_id INT NOT NULL,
    amount DECIMAL(10, 2) DEFAULT 0,
    PRIMARY KEY (user_id, other_user_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (other_user_id) REFERENCES Users(user_id)
);

-- 7. Settlement
CREATE TABLE Settlement (
    settlement_id SERIAL PRIMARY KEY,
    from_user INT NOT NULL, -- Payer
    to_user INT NOT NULL,   -- Receiver
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user) REFERENCES Users(user_id),
    FOREIGN KEY (to_user) REFERENCES Users(user_id)
);