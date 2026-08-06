const express = require("express");
const path = require("path");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// =====================================
// PORT - RENDER + LOCALHOST
// =====================================

const PORT = process.env.PORT || 3000;

// =====================================
// MIDDLEWARE
// =====================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all website files
app.use(express.static(__dirname));

// =====================================
// MYSQL DATABASE
// =====================================

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smart_agro",
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {

    if (err) {
        console.log("❌ MySQL Connection Failed");
        console.log(err.message);
    } else {
        console.log("✅ MySQL Connected");
    }

});

// =====================================
// HOME
// =====================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

// =====================================
// REGISTER
// =====================================

app.post("/register", (req, res) => {

    const {
        fullname,
        email,
        password
    } = req.body;

    if (!fullname || !email || !password) {

        return res.json({
            success: false,
            message: "Please fill all fields"
        });

    }

    const sql =
        "INSERT INTO users(fullname,email,password) VALUES(?,?,?)";

    db.query(
        sql,
        [fullname, email, password],
        (err) => {

            if (err) {

                console.log(err);

                return res.json({
                    success: false,
                    message: "Email already registered"
                });

            }

            res.json({
                success: true,
                message: "Registration successful"
            });

        }
    );

});

// =====================================
// LOGIN
// =====================================

app.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    if (!email || !password) {

        return res.json({
            success: false,
            message: "Please enter email and password"
        });

    }

    const sql =
        "SELECT * FROM users WHERE email=? AND password=?";

    db.query(
        sql,
        [email, password],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.json({
                    success: false,
                    message: "Database error"
                });

            }

            if (result.length > 0) {

                res.json({

                    success: true,

                    message: "Login successful",

                    fullname: result[0].fullname,

                    email: result[0].email,

                    mobile: result[0].mobile || ""

                });

            } else {

                res.json({

                    success: false,

                    message: "Invalid email or password"

                });

            }

        }
    );

});

// =====================================
// PRODUCTS API
// =====================================

app.get("/products", (req, res) => {

    db.query(
        "SELECT * FROM products",
        (err, result) => {

            if (err) {

                console.log(err);

                return res.json([]);

            }

            res.json(result);

        }
    );

});

// =====================================
// ADMIN LOGIN
// =====================================

app.post("/admin-login", (req, res) => {

    const {
        username,
        password
    } = req.body;

    const sql =
        "SELECT * FROM admins WHERE username=? AND password=?";

    db.query(
        sql,
        [username, password],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.json({

                    success: false,

                    message: "Database error"

                });

            }

            if (result.length > 0) {

                res.json({

                    success: true,

                    message: "Admin Login Successful"

                });

            } else {

                res.json({

                    success: false,

                    message: "Invalid Admin Username or Password"

                });

            }

        }
    );

});

// =====================================
// ORDER API
// =====================================

app.post("/order", (req, res) => {

    const {
        name,
        phone,
        address,
        product,
        quantity,
        total_price,
        email
    } = req.body;

    if (!name || !phone || !address || !product) {

        return res.json({

            success: false,

            message: "Please fill order details"

        });

    }

    const sql = `

        INSERT INTO orders
        (customer_name,mobile,address,products,total_price,quantity,status)

        VALUES(?,?,?,?,?,?,?)

    `;

    db.query(

        sql,

        [
            name,
            phone,
            address,
            product,
            total_price || 0,
            quantity || 1,
            "Pending"
        ],

        (err) => {

            if (err) {

                console.log(err);

                return res.json({

                    success: false,

                    message: "Order failed"

                });

            }

            res.json({

                success: true,

                message: "Order placed successfully 🎉"

            });

        }

    );

});

// =====================================
// GET ALL ORDERS - ADMIN
// =====================================

app.get("/orders", (req, res) => {

    db.query(

        "SELECT * FROM orders ORDER BY id DESC",

        (err, result) => {

            if (err) {

                console.log(err);

                return res.json([]);

            }

            res.json(result);

        }

    );

});

// =====================================
// ADD PRODUCT - ADMIN
// =====================================

app.post("/add-product", (req, res) => {

    const {
        name,
        description,
        price,
        category,
        image
    } = req.body;

    if (!name || !price || !category) {

        return res.json({

            success: false,

            message: "Please fill product details"

        });

    }

    const sql =
        "INSERT INTO products(name,description,price,category,image) VALUES(?,?,?,?,?)";

    db.query(

        sql,

        [
            name,
            description || "",
            price,
            category,
            image || ""
        ],

        (err) => {

            if (err) {

                console.log(err);

                return res.json({

                    success: false,

                    message: "Product add failed"

                });

            }

            res.json({

                success: true,

                message: "Product Added Successfully"

            });

        }

    );

});

// =====================================
// DELETE PRODUCT - ADMIN
// =====================================

app.delete("/delete-product/:id", (req, res) => {

    const id = req.params.id;

    const sql =
        "DELETE FROM products WHERE id=?";

    db.query(

        sql,

        [id],

        (err) => {

            if (err) {

                console.log(err);

                return res.json({

                    success: false,

                    message: "Delete failed"

                });

            }

            res.json({

                success: true,

                message: "Product Deleted Successfully"

            });

        }

    );

});

// =====================================
// CUSTOMER MY ORDERS
// =====================================

app.get("/my-orders/:email", (req, res) => {

    const email = req.params.email;

    const sql =
        "SELECT * FROM orders WHERE email=? ORDER BY id DESC";

    db.query(

        sql,

        [email],

        (err, result) => {

            if (err) {

                console.log(err);

                return res.json([]);

            }

            res.json(result);

        }

    );

});

// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {

    res.status(404).send("Smart Agro - Page Not Found");

});

// =====================================
// SERVER START
// =====================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🚀 Smart Agro Server Running on port ${PORT}`
        );

    }
);
