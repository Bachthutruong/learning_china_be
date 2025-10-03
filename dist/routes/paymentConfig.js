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
const accountValidation = (prefix) => [
    (0, express_validator_1.body)(`${prefix}.qrCodeImage`).isString().trim().notEmpty().withMessage(`${prefix} QR is required`),
    (0, express_validator_1.body)(`${prefix}.exchangeRate`).isFloat({ min: 0.01 }).withMessage(`${prefix} exchangeRate >= 0.01`),
    (0, express_validator_1.body)(`${prefix}.bankAccount`).isString().trim().notEmpty().withMessage(`${prefix} bankAccount required`),
    (0, express_validator_1.body)(`${prefix}.bankName`).isString().trim().notEmpty().withMessage(`${prefix} bankName required`),
    (0, express_validator_1.body)(`${prefix}.accountHolder`).isString().trim().notEmpty().withMessage(`${prefix} accountHolder required`),
];
const paymentConfigValidation = [
    ...accountValidation('tw'),
    ...accountValidation('vn'),
];
// Public route to get active config
router.get('/', paymentConfigController_1.getPaymentConfig);
// Admin routes
router.post('/admin', auth_1.authenticate, (0, auth_1.authorize)('admin'), paymentConfigValidation, paymentConfigController_1.createOrUpdatePaymentConfig);
router.get('/admin/all', auth_1.authenticate, (0, auth_1.authorize)('admin'), paymentConfigController_1.getAllPaymentConfigs);
exports.default = router;
