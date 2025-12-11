const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/images'),
    filename: (req, file, cb) => cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

router.post('/add-member', verifyToken, upload.single('image'), memberController.addMember);
router.get('/profile/:id', verifyToken, memberController.getProfile);
router.get('/members', verifyToken, memberController.getAllMembers);
router.delete('/delete-member/:id', verifyToken, memberController.deleteMember);
router.put('/reset-admin-password', verifyToken, memberController.updateAdminPassword);
router.put('/update-admin-phone', verifyToken, memberController.updateAdminPhone);
router.put('/update-member/:id', verifyToken, memberController.updateMemberDetails);

module.exports = router;