"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const paymentConfigController_1 = require("../controllers/paymentConfigController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const paymentConfigValidation = [
    (0, express_validator_1.body)('qrCodeImage').isString().trim().notEmpty().withMessage('QR code image is required'),
    (0, express_validator_1.body)('exchangeRate').isFloat({ min: 0.01 }).withMessage('Exchange rate must be at least 0.01'),
    (0, express_validator_1.body)('bankAccount').isString().trim().notEmpty().withMessage('Bank account is required'),
    (0, express_validator_1.body)('bankName').isString().trim().notEmpty().withMessage('Bank name is required'),
    (0, express_validator_1.body)('accountHolder').isString().trim().notEmpty().withMessage('Account holder is required')
];
// Public route to get active config
router.get('/', paymentConfigController_1.getPaymentConfig);
// Admin routes
router.post('/admin', auth_1.authenticate, (0, auth_1.authorize)('admin'), paymentConfigValidation, paymentConfigController_1.createOrUpdatePaymentConfig);
router.get('/admin/all', auth_1.authenticate, (0, auth_1.authorize)('admin'), paymentConfigController_1.getAllPaymentConfigs);
exports.default = router;
