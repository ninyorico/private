const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Use Routes
app.use('/', authRoutes);
app.use('/', memberRoutes);
app.use('/', financialRoutes);

const PORT = 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});