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
const paymentConfigValidation = [
  body('qrCodeImage').isString().trim().notEmpty().withMessage('QR code image is required'),
  body('exchangeRate').isFloat({ min: 0.01 }).withMessage('Exchange rate must be at least 0.01'),
  body('bankAccount').isString().trim().notEmpty().withMessage('Bank account is required'),
  body('bankName').isString().trim().notEmpty().withMessage('Bank name is required'),
  body('accountHolder').isString().trim().notEmpty().withMessage('Account holder is required')
];

// Public route to get active config
router.get('/', getPaymentConfig);

// Admin routes
router.post('/admin', authenticate, authorize('admin'), paymentConfigValidation, createOrUpdatePaymentConfig);
router.get('/admin/all', authenticate, authorize('admin'), getAllPaymentConfigs);

export default router;
