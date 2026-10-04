DROP TABLE IF EXISTS Customers CASCADE;
DROP TABLE IF EXISTS Categories CASCADE;
DROP TABLE IF EXISTS Suppliers CASCADE;
DROP TABLE IF EXISTS Products CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS OrderItems CASCADE;
DROP TABLE IF EXISTS Shipping CASCADE;
DROP TABLE IF EXISTS Payments CASCADE;
DROP TABLE IF EXISTS Reviews CASCADE;

CREATE TABLE Customers (
customer_id INT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100) UNIQUE NOT NULL,
phone_number VARCHAR(10)
);

CREATE TABLE Categories (
category_id INT PRIMARY KEY,
name VARCHAR(50) NOT NULL,
description TEXT
);

CREATE TABLE Suppliers (
supplier_id INT PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(100),
phone_number VARCHAR(15),
address TEXT
);

CREATE TABLE Products (
product_id INT PRIMARY KEY,
supplier_id INT ,
category_id INT ,
name VARCHAR(100) NOT NULL,
price DECIMAL(10, 2) NOT NULL,
quantity INT NOT NULL,
foreign key (supplier_id) REFERENCES Suppliers(supplier_id),
foreign key (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE Orders (
order_id INT PRIMARY KEY,
customer_id INT ,
order_date DATE NOT NULL,
total_amount DECIMAL(10,2) NOT NULL,
foreign key (customer_id) REFERENCES Customers(customer_id)
);

CREATE TABLE OrderItems(
order_id INT,
product_id INT,
quantity INT NOT NULL,
price DECIMAL(10, 2) NOT NULL, -- Unit price per item
PRIMARY KEY (order_id, product_id),
foreign key (order_id) REFERENCES Orders(order_id),
foreign key (product_id) REFERENCES Products(product_id)


);

CREATE TABLE Payments (
payment_id INT PRIMARY KEY,
order_id INT,
payment_date DATE,
payment_method VARCHAR(20) CHECK (payment_method IN ('UPI', 'Net Banking', 'Debit Card', 'Credit Card', 'Cash on Delivery')),
foreign key (order_id) REFERENCES Orders(order_id)

);


CREATE TABLE Shipping (
shipping_id INT PRIMARY KEY,
order_id INT,
shipping_method VARCHAR(20) CHECK (shipping_method IN ('Standard', 'Express')),
shipping_address TEXT NOT NULL,
shipping_date DATE NOT NULL,
status VARCHAR(20) CHECK (status IN ('Ordered', 'Shipped', 'Dispatched', 'Received')),
delivery_date DATE,
foreign key (order_id) REFERENCES Orders(order_id)
);

CREATE TABLE Reviews (
review_id INT PRIMARY KEY,
product_id INT,
customer_id INT,
rating INT CHECK (rating BETWEEN 1 AND 5),
review_text TEXT,
review_date DATE NOT NULL,
foreign key(product_id) REFERENCES Products(product_id),
foreign key(customer_id) REFERENCES Customers(customer_id)
);
