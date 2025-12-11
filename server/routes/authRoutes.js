const express = require('express');
const router = express.Router(); // <--- Capital 'R' is required here
const authController = require('../controllers/authController');

router.post('/login', authController.login);

module.exports = router;