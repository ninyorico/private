const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken'); // Required for middleware
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve images
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const financialRoutes = require('./routes/financialRoutes');

// Import Controller (Ensure this path is correct based on your folder structure)
const financialController = require('./controllers/financialController'); 

// Middleware: Verify User (Defined here to ensure the delete route works)
const verifyUser = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.json({ Error: "You are not authenticated" });
    
    // Verify using the secret key from your authController
    jwt.verify(token, "your_jwt_secret", (err, decoded) => {
        if (err) return res.json({ Error: "Token is not valid" });
        req.user = decoded;
        next();
    });
};

// Use Routes
app.use('/', authRoutes);
app.use('/', memberRoutes);
app.use('/', financialRoutes);

// NEW ROUTE: Delete Active Loan
app.delete('/delete-active-loan/:loanId', verifyUser, financialController.deleteActiveLoan);

const PORT = 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});