import { Request, Response } from 'express';
import CoinTransaction from '../models/CoinTransaction';

// Get current user's coin transactions
export const getMyCoinTransactions = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);

    const [items, total] = await Promise.all([
      CoinTransaction.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum),
      CoinTransaction.countDocuments({ userId: req.user._id })
    ]);

    res.json({
      transactions: items,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    console.error('getMyCoinTransactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: list coin transactions, optional by userId
export const adminListCoinTransactions = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, userId } = req.query as any;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const query: any = {};
    if (userId) query.userId = userId;

    const [items, total] = await Promise.all([
      CoinTransaction.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum),
      CoinTransaction.countDocuments(query)
    ]);

    res.json({
      transactions: items,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    console.error('adminListCoinTransactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


