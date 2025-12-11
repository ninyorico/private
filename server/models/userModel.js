const db = require('../config/db');

const User = {
    findByPhone: (phone, callback) => {
        db.query("SELECT * FROM users WHERE phone_number = ?", [phone], callback);
    },
    findById: (id, callback) => {
        db.query("SELECT full_name, phone_number, role, birthdate, spouse_name, profile_picture FROM users WHERE id = ?", [id], callback);
    },
    create: (data, callback) => {
        const sql = "INSERT INTO users (full_name, phone_number, password, role, birthdate, spouse_name, profile_picture) VALUES (?, ?, ?, 'member', ?, ?, ?)";
        db.query(sql, [data.full_name, data.phone_number, data.password, data.birthdate, data.spouse_name, data.image], callback);
    },
    getAllMembers: (callback) => {
        // Includes subquery for Late Count and JOIN for Loan Details
        const sql = `
            SELECT u.id, u.full_name, u.phone_number, u.profile_picture, 
                   l.total_amount, l.current_balance, l.loan_name,
                   (SELECT COUNT(*) FROM financial_records fr WHERE fr.user_id = u.id AND fr.status = 'late') as late_count
            FROM users u 
            LEFT JOIN loans l ON u.id = l.user_id AND l.status = 'active' 
            WHERE u.role = 'member'
        `;
        db.query(sql, callback);
    },
    delete: (id, callback) => {
        db.query("DELETE FROM users WHERE id = ?", [id], callback);
    },
    updatePassword: (id, hash, callback) => {
        db.query("UPDATE users SET password = ? WHERE id = ?", [hash, id], callback);
    },
    updatePhone: (id, phone, callback) => {
        db.query("UPDATE users SET phone_number = ? WHERE id = ?", [phone, id], callback);
    },
    updateDetails: (id, data, callback) => {
        const sql = "UPDATE users SET full_name = ?, phone_number = ?, birthdate = ?, spouse_name = ? WHERE id = ?";
        db.query(sql, [data.full_name, data.phone_number, data.birthdate, data.spouse_name, id], callback);
    }
};

module.exports = User;