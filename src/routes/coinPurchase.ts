import express from 'express';
import { body } from 'express-validator';
import { 
  createCoinPurchase,
  getUserCoinPurchases,
  getCoinPurchaseById,
  getPendingCoinPurchases,
  approveCoinPurchase,
  rejectCoinPurchase,
  getAllCoinPurchases,
  getPaymentConfig,
  updateCoinPurchase
} from '../controllers/coinPurchaseController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const createCoinPurchaseValidation = [
  body('amount').isInt({ min: 1 }).withMessage('Minimum amount is 1 TWD'),
  body('bankAccount').optional().isString().trim(),
  body('transactionId').optional().isString().trim(),
  body('receiptImage').optional().isString().trim()
];

const adminActionValidation = [
  body('adminNotes').optional().isString().trim()
];

// User routes
router.post('/', authenticate, createCoinPurchaseValidation, createCoinPurchase);
router.get('/my-purchases', authenticate, getUserCoinPurchases);
router.get('/:id', authenticate, getCoinPurchaseById);
router.put('/:id', authenticate, updateCoinPurchase);
router.get('/config/payment', getPaymentConfig);

// Admin routes
router.get('/admin/pending', authenticate, authorize('admin'), getPendingCoinPurchases);
router.get('/admin/all', authenticate, authorize('admin'), getAllCoinPurchases);
router.put('/admin/:id/approve', authenticate, authorize('admin'), adminActionValidation, approveCoinPurchase);
router.put('/admin/:id/reject', authenticate, authorize('admin'), adminActionValidation, rejectCoinPurchase);

export default router;
