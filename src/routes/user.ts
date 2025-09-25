import express from 'express';
import { body } from 'express-validator';
import { 
  checkIn, 
  getUserStats, 
  purchaseCoins, 
  getPaymentHistory,
  getLeaderboard
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Validation rules
const purchaseValidation = [
  body('amount').isInt({ min: 1000 }),
  body('paymentMethod').trim().isLength({ min: 1 })
];

// Protected routes
router.post('/checkin', authenticate, checkIn);
router.get('/stats', authenticate, getUserStats);
router.post('/purchase', authenticate, purchaseValidation, purchaseCoins);
router.get('/payments', authenticate, getPaymentHistory);
router.get('/leaderboard', authenticate, getLeaderboard);

export default router;
