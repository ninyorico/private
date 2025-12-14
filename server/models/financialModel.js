const db = require('../config/db');

const Financial = {
    // --- LOANS ---
    findActiveLoan: (userId, callback) => {
        db.query("SELECT * FROM loans WHERE user_id = ? AND status = 'active'", [userId], callback);
    },
    
    // UPDATED: Now saves Weeks, Day, and Weekly Amount
    createLoan: (data, callback) => {
        const sql = "INSERT INTO loans (user_id, total_amount, current_balance, status, loan_name, weeks_to_pay, payment_day, weekly_amount) VALUES (?, ?, ?, 'active', ?, ?, ?, ?)";
        db.query(sql, [
            data.user_id, 
            data.amount, 
            data.amount, 
            data.loan_name,
            data.weeks_to_pay, 
            data.payment_day, 
            data.weekly_amount
        ], callback);
    },

    updateLoanBalance: (loanId, amount, operation, callback) => {
        // operation: '-' for payment, '+' for undo/cancel
        const sql = `UPDATE loans SET current_balance = current_balance ${operation} ? WHERE id = ?`;
        db.query(sql, [amount, loanId], callback);
    },

    closeLoan: (loanId, callback) => {
        db.query("UPDATE loans SET status = 'completed' WHERE id = ? AND current_balance <= 0", [loanId], callback);
    },

    reactivateLoan: (loanId, callback) => {
        db.query("UPDATE loans SET status = IF(current_balance > 0, 'active', 'completed') WHERE id = ?", [loanId], callback);
    },

    // NEW: Delete Loan Function
    deleteLoan: (loanId, callback) => {
        // 1. Delete associated records first (Safety)
        const sqlRecords = "DELETE FROM financial_records WHERE loan_id = ?";
        db.query(sqlRecords, [loanId], (err, res) => {
            if (err) return callback(err, null);

            // 2. Delete the loan
            const sqlLoan = "DELETE FROM loans WHERE id = ?";
            db.query(sqlLoan, [loanId], callback);
        });
    },

    // --- RECORDS ---
    createRecord: (data, callback) => {
        const sql = "INSERT INTO financial_records (user_id, type, amount, due_date, status, loan_id) VALUES (?, ?, ?, ?, 'pending', ?)";
        db.query(sql, [data.user_id, data.type, data.amount, data.due_date, data.loan_id], callback);
    },

    getRecordsByUser: (userId, callback) => {
        const sql = `SELECT fr.*, l.loan_name 
                     FROM financial_records fr 
                     LEFT JOIN loans l ON fr.loan_id = l.id 
                     WHERE fr.user_id = ? ORDER BY fr.due_date DESC`;
        db.query(sql, [userId], callback);
    },

    findById: (id, callback) => {
        db.query("SELECT * FROM financial_records WHERE id = ?", [id], callback);
    },

    updateStatus: (id, status, callback) => {
        db.query("UPDATE financial_records SET status = ?, date_recorded = NOW() WHERE id = ?", [status, id], callback);
    },

    deleteRecord: (id, callback) => {
        db.query("DELETE FROM financial_records WHERE id = ?", [id], callback);
    },

    cashOut: (userId, type, callback) => {
        const sql = "UPDATE financial_records SET status = 'cashed_out' WHERE user_id = ? AND type = ? AND (status = 'paid' OR status = 'late')";
        db.query(sql, [userId, type], callback);
    },
    
    // --- TOTALS ---
    getTotals: (userId, callback) => {
        const queries = {
            savings: "SELECT SUM(amount) as total FROM financial_records WHERE user_id = ? AND type = 'savings' AND (status = 'paid' OR status = 'late')",
            insurance: "SELECT SUM(amount) as total FROM financial_records WHERE user_id = ? AND type = 'insurance' AND (status = 'paid' OR status = 'late')"
        };
        db.query(queries.savings, [userId], (err, savingsRes) => {
            if(err) return callback(err);
            db.query(queries.insurance, [userId], (err, insRes) => {
                if(err) return callback(err);
                callback(null, { savings: savingsRes[0].total || 0, insurance: insRes[0].total || 0 });
            });
        });
    }
};

module.exports = Financial;