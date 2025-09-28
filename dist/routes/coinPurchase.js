"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const coinPurchaseController_1 = require("../controllers/coinPurchaseController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const createCoinPurchaseValidation = [
    (0, express_validator_1.body)('amount').isInt({ min: 10000 }).withMessage('Minimum amount is 10,000 VND'),
    (0, express_validator_1.body)('paymentMethod').isIn(['bank_transfer', 'momo', 'zalopay', 'vnpay']).withMessage('Invalid payment method'),
    (0, express_validator_1.body)('bankAccount').optional().isString().trim(),
    (0, express_validator_1.body)('transactionId').optional().isString().trim(),
    (0, express_validator_1.body)('proofOfPayment').optional().isString().trim()
];
const adminActionValidation = [
    (0, express_validator_1.body)('adminNotes').optional().isString().trim()
];
// User routes
router.post('/', auth_1.authenticate, createCoinPurchaseValidation, coinPurchaseController_1.createCoinPurchase);
router.get('/my-purchases', auth_1.authenticate, coinPurchaseController_1.getUserCoinPurchases);
router.get('/:id', auth_1.authenticate, coinPurchaseController_1.getCoinPurchaseById);
// Admin routes
router.get('/admin/pending', auth_1.authenticate, (0, auth_1.authorize)('admin'), coinPurchaseController_1.getPendingCoinPurchases);
router.get('/admin/all', auth_1.authenticate, (0, auth_1.authorize)('admin'), coinPurchaseController_1.getAllCoinPurchases);
router.put('/admin/:id/approve', auth_1.authenticate, (0, auth_1.authorize)('admin'), adminActionValidation, coinPurchaseController_1.approveCoinPurchase);
router.put('/admin/:id/reject', auth_1.authenticate, (0, auth_1.authorize)('admin'), adminActionValidation, coinPurchaseController_1.rejectCoinPurchase);
exports.default = router;
//# sourceMappingURL=coinPurchase.js.map