const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Import multer for images
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve images statically so the frontend can display them
app.use('/images', express.static('public/images'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cluster_db'
});

// --- IMAGE UPLOAD CONFIGURATION ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images') // Ensure you create this folder!
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware to verify Token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({Error: "A token is required"});
    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({Error: "Invalid Token"});
    }
};

// --- ROUTES ---

// 1. LOGIN
app.post('/login', (req, res) => {
    const { phone_number, password } = req.body;
    const sql = "SELECT * FROM users WHERE phone_number = ?";
    db.query(sql, [phone_number], async (err, result) => {
        if (err) return res.json({ Error: "Error inside server" });
        if (result.length > 0) {
            const user = result[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const token = jwt.sign({id: user.id, role: user.role}, "your_jwt_secret", {expiresIn: "1d"});
                return res.json({Status: "Success", token, role: user.role, userId: user.id});
            } else {
                return res.json({Error: "Password incorrect"});
            }
        } else {
            return res.json({Error: "No record existed"});
        }
    });
});

// 2. ADD MEMBER (With Image, Birthdate, Spouse)
app.post('/add-member', verifyToken, upload.single('image'), async (req, res) => {
    if(req.user.role !== 'leader') return res.json({Error: "Access Denied"});

    const { full_name, phone_number, password, birthdate, spouse_name } = req.body;
    const image = req.file ? req.file.filename : null; // Get filename
    const hash = await bcrypt.hash(password.toString(), 10);

    const sql = "INSERT INTO users (full_name, phone_number, password, role, birthdate, spouse_name, profile_picture) VALUES (?, ?, ?, 'member', ?, ?, ?)";
    db.query(sql, [full_name, phone_number, hash, birthdate, spouse_name, image], (err, result) => {
        if(err) return res.json({Error: "Error inserting data"});
        return res.json({Status: "Success"});
    });
});

// 3. GET USER PROFILE (For Dashboard)
app.get('/profile/:id', verifyToken, (req, res) => {
    const id = req.params.id;
    // Security: Only allow if it's their own ID or the requestor is a leader
    if(req.user.id != id && req.user.role !== 'leader') return res.json({Error: "Access Denied"});

    const sql = "SELECT full_name, phone_number, role, birthdate, spouse_name, profile_picture FROM users WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Error fetching profile"});
        return res.json({Result: result[0]});
    });
});

// 4. GET OWN RECORDS (Existing)
app.get('/my-records/:id', verifyToken, (req, res) => {
    const id = req.params.id;
    if(req.user.id != id && req.user.role !== 'leader') return res.json({Error: "Access Denied"});
    const sql = "SELECT * FROM financial_records WHERE user_id = ?";
    db.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Error fetching records"});
        return res.json({Result: result});
    });
});

// 5. GET MEMBERS (Leader Only)
app.get('/members', verifyToken, (req, res) => {
    if(req.user.role !== 'leader') return res.json({Error: "Access Denied"});
    const sql = "SELECT id, full_name, phone_number, profile_picture FROM users WHERE role = 'member'";
    db.query(sql, (err, result) => {
        if(err) return res.json({Error: "Get users error"});
        return res.json({Result: result});
    });
});

// ... existing code ...

// 6. ASSIGN FINANCIAL RECORD (Loan, Savings, Insurance)
app.post('/assign-record', verifyToken, (req, res) => {
    if(req.user.role !== 'leader') return res.json({Error: "Access Denied"});

    const { user_id, type, amount, due_date } = req.body;
    const sql = "INSERT INTO financial_records (user_id, type, amount, due_date, status) VALUES (?, ?, ?, ?, 'pending')";
    
    db.query(sql, [user_id, type, amount, due_date], (err, result) => {
        if(err) return res.json({Error: "Error assigning record"});
        return res.json({Status: "Success"});
    });
});

// 7. CASH OUT SAVINGS/INSURANCE (Update status to 'cashed_out')
app.put('/cash-out/:id', verifyToken, (req, res) => {
    if(req.user.role !== 'leader') return res.json({Error: "Access Denied"});
    
    const id = req.params.id;
    // Only allow cashing out if it's already 'paid' or just standard 'pending' -> 'cashed_out' depending on logic
    // Usually you cash out money you have already saved (status='paid'). 
    // For this system, we will just mark the record as 'cashed_out'.
    const sql = "UPDATE financial_records SET status = 'cashed_out' WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Error cashing out"});
        return res.json({Status: "Success"});
    });
});

// 8. DELETE MEMBER (Leader Only)
app.delete('/delete-member/:id', verifyToken, (req, res) => {
    if(req.user.role !== 'leader') return res.json({Error: "Access Denied"});
    
    const id = req.params.id;
    const sql = "DELETE FROM users WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Error deleting member"});
        return res.json({Status: "Success"});
    });
});

// 9. UPDATE RECORD STATUS (Mark as Paid - Helper for Leader)
app.put('/mark-paid/:id', verifyToken, (req, res) => {
    if(req.user.role !== 'leader') return res.json({Error: "Access Denied"});
    const id = req.params.id;
    const sql = "UPDATE financial_records SET status = 'paid' WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if(err) return res.json({Error: "Error updating status"});
        return res.json({Status: "Success"});
    });
});

app.listen(8081, () => {
    console.log("Server running on port 8081");
});