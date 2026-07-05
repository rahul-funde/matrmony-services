const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {createOrder, submitOfflineQRPayment, getPendingOfflinePayments, approveOfflinePayment, rejectOfflinePayment} = require('../controllers/payment.controller');
const verifyToken = require('../middlewares/jwtMiddleware');
const { requireAdmin } = require('../middlewares/auth');

// POST /api/payment/create-order
router.post('/create-order', verifyToken, createOrder);


// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.resolve('./public/payments')); // public/uploads folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only JPG, PNG, WEBP, or PDF receipts are allowed'));
        }
        cb(null, true);
    }
});

// POST /api/payment/offline-qr
router.post('/offlineQRPayment', verifyToken, upload.single('receipt'), submitOfflineQRPayment);
router.post('/getPendingOfflinePayments', verifyToken, requireAdmin, getPendingOfflinePayments);
router.post("/approveOfflinePayment/:paymentId", verifyToken, requireAdmin, approveOfflinePayment);
router.post('/rejectOfflinePayment/:paymentId', verifyToken, requireAdmin, rejectOfflinePayment);


module.exports = router;

