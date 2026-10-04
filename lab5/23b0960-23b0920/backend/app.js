  const express = require("express");
  const session = require("express-session");
  const cors = require("cors");
  const bcrypt = require("bcrypt");
  const { Pool } = require("pg");

  const app = express();
  const port = 4000;

  app.use(express.json());
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );  

  app.use(
    session({
      secret: "temporary_secret",
      resave: false,
      saveUninitialized: true,
    })
  );

  let pool = null;
  let dbConfig = null;

  if (process.env.PGHOST && process.env.PGPORT && process.env.PGDATABASE && process.env.PGUSER && process.env.PGPASSWORD) {
      dbConfig = {
          host: process.env.PGHOST,
          port: parseInt(process.env.PGPORT),
          database: process.env.PGDATABASE,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD
      };
      pool = new Pool(dbConfig);
      console.log("Database configured via environment variables.");
  }

  /* ---------------- AUTH MIDDLEWARE ---------------- */
  async function checkAuth(req, res, next) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }

  /* ---------------- AUTH ROUTES ---------------- */
  app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body; 

    try {
      const existing = await pool.query(
        "SELECT * FROM Users WHERE username = $1",[username]
      );
      if (existing.rows.length) {
        return res.status(409).json({ message: "User exists" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const result = await pool.query(
        "INSERT INTO Users(username, email, password_hash) VALUES($1, $2, $3) RETURNING user_id, username, email", [username, email, hashed]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
      const result = await pool.query(
        "SELECT * FROM Users WHERE username = $1",[username]
      );
      const user = result.rows[0];
      if (!user) return res.status(400).json({ message: "Invalid credentials : UserName not found" });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match)
        return res.status(400).json({ message: "Invalid credentials : Incorrect Password " });

      req.session.userId = user.user_id;
      res.json({ id: user.user_id, username: user.username });
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/isLoggedIn", async (req,res) => {
    if (!req.session.userId) return res.json({ loggedIn: false });

    try {
      const result = await pool.query(
        "select user_id,username from Users where user_id = $1",[req.session.userId]
      );
      const user = result.rows[0];
      res.json({ loggedIn: true, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/users/search", checkAuth, async (req, res) => {
    const query = req.query.q || "";
    try {
      const result = await pool.query(
        "SELECT user_id, username, email FROM Users WHERE username ILIKE $1 AND user_id != $2",[`%${query}%`, req.session.userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/friends/add", checkAuth, async (req, res) => {
    const { friendId } = req.body;
    
    try {
      await pool.query(
        "INSERT INTO Friend(user_id, friend_id) VALUES($1, $2)",
        [req.session.userId, friendId]
      );
      await pool.query(
        "INSERT INTO Friend(user_id, friend_id) VALUES($1, $2)",
        [friendId, req.session.userId]
      );

      res.json({ message: "Friend added" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/friends", checkAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT u.user_id, u.username, u.email FROM Friend f
        JOIN Users u ON u.user_id = f.friend_id
        WHERE f.user_id = $1`,
        [req.session.userId]
      );
      res.json(result.rows);
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/groups", checkAuth, async (req, res) => {
    const { name, members } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO Groups(name, created_by) VALUES($1, $2) RETURNING group_id, name",
        [name, req.session.userId]
      );
      const group = result.rows[0];

      const allMembers = [...members, req.session.userId];
      for (let memberId of allMembers) {
        await pool.query(
          "INSERT INTO GroupMember(group_id, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING",
          [group.group_id, memberId]
        );
      }

      group.members = allMembers;
      res.status(201).json(group);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/groups", checkAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT g.group_id, g.name FROM Groups g
        JOIN GroupMember gm ON g.group_id = gm.group_id
        WHERE gm.user_id = $1`,
        [req.session.userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/groups/:id", checkAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT g.group_id, g.name, u.user_id, u.username
        FROM Groups g
        JOIN GroupMember gm ON g.group_id = gm.group_id
        JOIN Users u ON u.user_id = gm.user_id
        WHERE g.group_id = $1;`,[req.params.id]
      );
      const rows = result.rows;
      const group = {
        group_id: rows[0].group_id,
        name: rows[0].name,
        members: rows.map(r => ({
                  user_id: r.user_id,
                  name: r.username
                }))
      };

      res.json(group);
    }
      catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/expenses", checkAuth, async (req, res) => {
    const { groupId, amount, description, splitWith, paidBy } = req.body;

    if (!paidBy || !splitWith || splitWith.length === 0) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /* ensure payer belongs to group */
      const check = await client.query(
        `SELECT * FROM GroupMember WHERE group_id=$1 AND user_id=$2`,
        [groupId, paidBy]
      );

      if (!check.rows.length)
        throw new Error("Invalid payer");

      /* insert expense */
      const expenseRes = await client.query(
        `INSERT INTO Expense(group_id, paid_by, amount, description)
        VALUES($1,$2,$3,$4)
        RETURNING expense_id`,
        [groupId, paidBy, amount, description]
      );

      const expenseId = expenseRes.rows[0].expense_id;

      /* calculate share */
      const share = amount / splitWith.length;

      for (let uid of splitWith) {

        /* insert split */
        await client.query(
          `INSERT INTO ExpenseSplit(expense_id,user_id,share_amount)
          VALUES($1,$2,$3)`,
          [expenseId, uid, share]
        );

        if (uid == paidBy) continue;

        /* payer gets money */
        await client.query(`
          INSERT INTO Balance(user_id, other_user_id, amount)
          VALUES($1,$2,$3)
          ON CONFLICT (user_id, other_user_id)
          DO UPDATE SET amount = Balance.amount + EXCLUDED.amount
        `,[paidBy, uid, share]);

        /* user owes */
        await client.query(`
          INSERT INTO Balance(user_id, other_user_id, amount)
          VALUES($1,$2,$3)
          ON CONFLICT (user_id, other_user_id)
          DO UPDATE SET amount = Balance.amount + EXCLUDED.amount
        `,[uid, paidBy, -share]);
      }

      await client.query("COMMIT");
      res.status(201).json({ message:"Expense added" });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ message:"Server error" });
    } finally {
      client.release();
    }
  });


  app.get("/groups/:id/expenses", checkAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT e.*, u.username AS paid_by_name
        FROM Expense e
        JOIN Users u ON e.paid_by = u.user_id
        WHERE e.group_id = $1
        ORDER BY e.expense_id DESC`,
        [req.params.id]
      );

      // console.log(result.rows);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/balances", checkAuth, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT 
            b.amount,
            u.username AS other_username,
            b.other_user_id
        FROM Balance b
        JOIN Users u ON u.user_id = b.other_user_id
        WHERE b.user_id = $1
        ORDER BY u.username`,
        [req.session.userId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/settle", checkAuth, async (req, res) => {
    const { to_user, amount } = req.body;
    const fromUser = req.session.userId;

    if (!to_user || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      /* record settlement */
      await client.query(
        `INSERT INTO Settlement(from_user, to_user, amount)
        VALUES($1,$2,$3)`,
        [fromUser, to_user, amount]
      );

      /* receiver balance increases */
      await client.query(`
        INSERT INTO Balance(user_id, other_user_id, amount)
        VALUES($1,$2,$3)
        ON CONFLICT (user_id, other_user_id)
        DO UPDATE SET amount = Balance.amount + EXCLUDED.amount
      `,[to_user, fromUser, -amount]);

      /* sender balance decreases */
      await client.query(`
        INSERT INTO Balance(user_id, other_user_id, amount)
        VALUES($1,$2,$3)
        ON CONFLICT (user_id, other_user_id)
        DO UPDATE SET amount = Balance.amount + EXCLUDED.amount
      `,[fromUser, to_user, amount]);

      await client.query("COMMIT");
      res.json({ message:"Settlement recorded" });

    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ message:"Server error" });
    } finally {
      client.release();
    }
  });


  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
