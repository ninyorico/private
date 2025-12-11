const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.login = (req, res) => {
    User.findByPhone(req.body.phone_number, async (err, result) => {
        if (err) return res.json({ Error: "Server error" });
        if (result.length > 0) {
            const match = await bcrypt.compare(req.body.password, result[0].password);
            if (match) {
                const token = jwt.sign({ id: result[0].id, role: result[0].role }, "your_jwt_secret", { expiresIn: "1d" });
                return res.json({ Status: "Success", token, role: result[0].role, userId: result[0].id });
            } else {
                return res.json({ Error: "Password incorrect" });
            }
        } else {
            return res.json({ Error: "No record existed" });
        }
    });
};