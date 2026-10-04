const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
const port = 4000;

// PostgreSQL connection
// NOTE: use YOUR postgres username and password here
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// CORS: Give permission to localhost:3000 (ie our React app)
// to use this backend API
app.use(
  cors({
    origin: true, //change this to the actual origin of your frontend
    credentials: true,
  })
);

// Session information
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

/////////////////////////////////////////////////////////////
// Authentication APIs
// Signup, Login, IsLoggedIn and Logout

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await pool.query(
      "SELECT * FROM Users WHERE email = $1;",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Error: Email is already registered." });
    }

    await pool.query(
      "INSERT INTO Users (username, email, password_hash) VALUES ($1, $2, $3);",
      [username, email, hashedPassword]
    );

    const result = await pool.query(
      "SELECT user_id, username from Users WHERE email = $1;",
      [email]
    );

    req.session.userId = result.rows[0].user_id;
    req.session.username = result.rows[0].username;
    res.status(201).json({ message: "User Registered Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error signing up" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM Users WHERE email = $1;", [
      email,
    ]);
    const user = result.rows[0];

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      req.session.userId = user.user_id;
      req.session.username = user.username;
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in" });
  }
});

app.get("/isLoggedIn", async (req, res) => {
  console.log('isLoggedIn')
  if (req.session.userId) {
    res
      .status(200)
      .json({ message: "Logged in", username: req.session.username });
  } else {
    return res.status(401).json({ message: "Not logged in" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Failed to log out" });
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

////////////////////////////////////////////////////
// APIs for the products
app.get("/list-products", isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM Products ORDER BY product_id"
    );
    res.status(200).json({
      message: "Products fetched successfully!",
      products: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error listing products" });
  }
});


app.post("/add-to-cart", isAuthenticated, async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.session.userId;
  const client = await pool.connect();

  try {
    // We use a transaction to ensure that the check for stock and the actual update happen together.
    // If one fails, neither should happen. This prevents inconsistencies.
    await client.query("BEGIN");

    const productResult = await client.query(
      "SELECT * FROM Products WHERE product_id = $1",
      [product_id]
    );

    if (productResult.rowCount === 0) {
      await client.query("ROLLBACK"); // strict adherence involves rollback even on read-only errors if in transaction, though not strictly necessary for reads.
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = productResult.rows[0];

    // Check if there is enough stock
    if (product.stock_quantity >= quantity) {
      const existingItem = await client.query(
        "SELECT * FROM Cart WHERE user_id = $1 AND item_id = $2",
        [userId, product_id]
      );

      if (existingItem.rowCount > 0) {

        await client.query(
          "UPDATE Cart SET quantity = $3 WHERE user_id = $1 AND item_id = $2",
          [userId, product_id, quantity]
        );
      } else {
        await client.query(
          "INSERT INTO Cart (user_id, item_id, quantity) VALUES ($1, $2, $3)",
          [userId, product_id, quantity]
        );
      }

      // If everything went well, we "commit" the transaction to save changes permanently.
      await client.query("COMMIT");

      res.status(200).json({
        message: `Successfully updated cart for ${product.name}.`,
      });
    } else {
      // If there isn't enough stock, we "rollback" to undo any changes made in this transaction.
      await client.query("ROLLBACK");
      res
        .status(400)
        .json({ message: `Insufficient stock for ${product.name}.` });
    }
  } catch (err) {
    // If any error occurs (like database connection issues), we rollback.
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Error adding to cart" });
  } finally {
    client.release();
  }
});

app.get("/display-cart", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  try {
    const cartResult = await pool.query(
      `
        SELECT 
          Cart.item_id, 
          Products.product_id, 
          Products.name, 
          Cart.quantity, 
          Products.price, 
          Products.stock_quantity,
          (Cart.quantity * Products.price) AS total_price
        FROM Cart
        JOIN Products ON Cart.item_id = Products.product_id
        WHERE Cart.user_id = $1
        ORDER BY Products.product_id`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No items in cart.", cart: [], totalPrice: 0 });
    }

    const totalResult = await pool.query(
      `
        SELECT SUM(Cart.quantity * Products.price) AS total_price
        FROM Cart JOIN Products
        ON Cart.item_id = Products.product_id
        WHERE Cart.user_id = $1`,
      [userId]
    );

    res.status(200).json({
      message: "cart fetched successfully",
      cart: cartResult.rows,
      totalPrice: totalResult.rows[0].total_price,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching cart" });
  }
});

app.post("/remove-from-cart", isAuthenticated, async (req, res) => {
  const { product_id } = req.body;
  const userId = req.session.userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if the item exists in the cart for the logged-in user
    const cartItemResult = await client.query(
      "SELECT * FROM Cart WHERE user_id = $1 AND item_id = $2",
      [userId, product_id]
    );

    // If the item is not found in the cart
    if (cartItemResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Item not present in your cart.",
      });
    }

    // Remove the item from the cart
    await client.query("DELETE FROM Cart WHERE user_id = $1 AND item_id = $2", [
      userId,
      product_id,
    ]);

    await client.query("COMMIT");

    // Send a success message
    res.status(200).json({
      message: "Item removed from your cart successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({
      message: "Error removing item from cart",
    });
  } finally {
    client.release();
  }
});

app.post("/update-cart", isAuthenticated, async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.session.userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check product stock
    const productResult = await client.query(
      "SELECT stock_quantity FROM Products WHERE product_id = $1",
      [product_id]
    );

    if (productResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found" });
    }

    if (productResult.rows[0].stock_quantity < quantity) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Requested quantity exceeds available stock.",
      });
    }

    // Update cart quantity
    await client.query(
      "UPDATE Cart SET quantity = $1 WHERE user_id = $2 AND item_id = $3",
      [quantity, userId, product_id]
    );

    await client.query("COMMIT");

    res.json({ message: "Cart updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Error updating cart" });
  } finally {
    client.release();
  }
});

// APIs for placing order and getting confirmation
app.post("/place-order", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const orderDate = new Date();
  const address = req.body.address;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch the cart items
    const cartItems = await client.query(
      `
      SELECT 
        Cart.item_id, 
        Products.product_id, 
        Products.name, 
        Cart.quantity, 
        Products.price, 
        Products.stock_quantity
      FROM Cart
      JOIN Products ON Cart.item_id = Products.product_id
      WHERE Cart.user_id = $1`,
      [userId]
    );

    if (cartItems.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Check if all items have sufficient stock
    for (const item of cartItems.rows) {
      if (item.stock_quantity < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: `Insufficient stock for ${item.name}`,
        });
      }
    }

    // Calculate total amount
    const totalAmount = cartItems.rows.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );

    // Insert order
    const orderResult = await client.query(
      "INSERT INTO Orders (user_id, order_date, total_amount) VALUES ($1, $2, $3) RETURNING order_id",
      [userId, orderDate, totalAmount]
    );

    const orderId = orderResult.rows[0].order_id;

    // Insert order items and update stock
    for (const item of cartItems.rows) {
      // Insert order item
      await client.query(
        "INSERT INTO OrderItems (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Update product stock
      await client.query(
        "UPDATE Products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2",
        [item.quantity, item.product_id]
      );
    }

    // Clear the cart
    await client.query("DELETE FROM Cart WHERE user_id = $1", [userId]);

    // add the address to the order-address table
    await client.query(
      "INSERT INTO OrderAddress (order_id, street, city, state, pincode) VALUES ($1, $2, $3, $4, $5)",
      [orderId, address.street, address.city, address.state, address.pincode]
    );

    await client.query("COMMIT");

    res.status(200).json({
      message: "Order placed successfully",
      orderId: orderId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Error placing order" });
  } finally {
    client.release();
  }
});

// API for order confirmation
app.get("/order-confirmation", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const orderResult = await pool.query(
      "SELECT * FROM Orders WHERE user_id = $1 ORDER BY order_date DESC LIMIT 1",
      [userId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }

    const orderItemsResult = await pool.query(
      `SELECT OrderItems.*, Products.name
       FROM OrderItems
       JOIN Products ON OrderItems.product_id = Products.product_id
       WHERE OrderItems.order_id = $1
       ORDER BY Products.product_id`,
      [order.order_id]
    );

    res.status(200).json({
      message: "order fetched successfully",
      order,
      orderItems: orderItemsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching order details" });
  }
});

////////////////////////////////////////////////////
// Start the server
app.listen(port, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();

  console.log('Server running!');
  console.log(`- Local:            http://localhost:${port}`);

  Object.keys(networkInterfaces).forEach((ifname) => {
    networkInterfaces[ifname].forEach((iface) => {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family !== 'IPv4' || iface.internal) {
        return;
      }
      console.log(`- On Your Network:  http://${iface.address}:${port}`);
    });
  });
  console.log('\nUse the "On Your Network" address in your mobile config.ts\n');
});
