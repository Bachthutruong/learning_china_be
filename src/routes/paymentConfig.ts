import express from 'express';
import { body } from 'express-validator';
import { 
  getPaymentConfig,
  createOrUpdatePaymentConfig,
  getAllPaymentConfigs
} from '../controllers/paymentConfigController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const accountValidation = (prefix: string) => [
  body(`${prefix}.qrCodeImage`).isString().trim().notEmpty().withMessage(`${prefix} QR is required`),
  body(`${prefix}.exchangeRate`).isFloat({ min: 0.01 }).withMessage(`${prefix} exchangeRate >= 0.01`),
  body(`${prefix}.bankAccount`).isString().trim().notEmpty().withMessage(`${prefix} bankAccount required`),
  body(`${prefix}.bankName`).isString().trim().notEmpty().withMessage(`${prefix} bankName required`),
  body(`${prefix}.accountHolder`).isString().trim().notEmpty().withMessage(`${prefix} accountHolder required`),
];

const paymentConfigValidation = [
  ...accountValidation('tw'),
  ...accountValidation('vn'),
];

// Public route to get active config
router.get('/', getPaymentConfig);

// Admin routes
router.post('/admin', authenticate, authorize('admin'), paymentConfigValidation, createOrUpdatePaymentConfig);
router.get('/admin/all', authenticate, authorize('admin'), getAllPaymentConfigs);

export default router;
