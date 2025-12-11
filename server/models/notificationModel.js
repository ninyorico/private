const db = require('../config/db');

const Notification = {
    create: (userId, message, callback) => {
        db.query("INSERT INTO notifications (user_id, message) VALUES (?, ?)", [userId, message], callback);
    },
    getByUser: (userId, callback) => {
        db.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [userId], callback);
    },
    markRead: (id, callback) => {
        db.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [id], callback);
    }
};

module.exports = Notification;