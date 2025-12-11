const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cluster_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to MySQL Database');
    }
});

module.exports = db;