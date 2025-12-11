const bcrypt = require('bcrypt');
const User = require('../models/userModel');

exports.addMember = async (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    
    const hash = await bcrypt.hash(req.body.password.toString(), 10);
    const data = {
        full_name: req.body.full_name,
        phone_number: req.body.phone_number,
        password: hash,
        birthdate: req.body.birthdate,
        spouse_name: req.body.spouse_name,
        image: req.file ? req.file.filename : null
    };

    User.create(data, (err) => {
        if (err) return res.json({ Error: "Error inserting data" });
        return res.json({ Status: "Success" });
    });
};

exports.getProfile = (req, res) => {
    if (req.user.id != req.params.id && req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    
    User.findById(req.params.id, (err, result) => {
        if (err) return res.json({ Error: "Error fetching profile" });
        const user = result[0];
        if (user && user.role === 'leader') {
            delete user.profile_picture; delete user.birthdate; delete user.spouse_name;
        }
        return res.json({ Result: user });
    });
};

exports.getAllMembers = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    User.getAllMembers((err, result) => {
        if (err) return res.json({ Error: "Get users error" });
        return res.json({ Result: result });
    });
};

exports.deleteMember = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    User.delete(req.params.id, (err) => {
        if (err) return res.json({ Error: "Error deleting member" });
        return res.json({ Status: "Success" });
    });
};

exports.updateAdminPassword = async (req, res) => {
    const hash = await bcrypt.hash(req.body.new_password.toString(), 10);
    User.updatePassword(req.user.id, hash, (err) => {
        if (err) return res.json({ Error: "Error updating password" });
        return res.json({ Status: "Success" });
    });
};

exports.updateAdminPhone = (req, res) => {
    User.updatePhone(req.user.id, req.body.new_phone, (err) => {
        if (err) return res.json({ Error: "Error updating phone" });
        return res.json({ Status: "Success" });
    });
};

exports.updateMemberDetails = (req, res) => {
    if (req.user.role !== 'leader') return res.json({ Error: "Access Denied" });
    User.updateDetails(req.params.id, req.body, (err) => {
        if (err) return res.json({ Error: "Error updating member" });
        return res.json({ Status: "Success" });
    });
};