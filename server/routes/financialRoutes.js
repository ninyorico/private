const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/assign-loan', verifyToken, financialController.assignLoan);
router.post('/assign-record', verifyToken, financialController.assignRecord);
router.put('/mark-paid/:id', verifyToken, financialController.markPaid);
router.put('/reset-status/:id', verifyToken, financialController.resetStatus);
router.delete('/delete-record/:id', verifyToken, financialController.deleteRecord);
router.put('/cash-out', verifyToken, financialController.cashOut);
router.get('/member-details/:id', verifyToken, financialController.getMemberDetails);
router.get('/my-records/:id', verifyToken, financialController.getMyRecords);
router.put('/mark-notification-read/:id', verifyToken, financialController.markNotificationRead);

module.exports = router;