import express from 'express';
import { authenticate, authorize,   } from '../middleware/auth';
import { getMyCoinTransactions, adminListCoinTransactions } from '../controllers/coinTransactionController';

const router = express.Router();

router.get('/me', authenticate, getMyCoinTransactions);
router.get('/admin', authenticate, authorize('admin'), adminListCoinTransactions);

export default router;


