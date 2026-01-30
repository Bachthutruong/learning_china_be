import { Request, Response } from 'express';
import CoinTransaction from '../models/CoinTransaction';
import User from '../models/User';

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
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      search, 
      startDate, 
      endDate 
    } = req.query as any;
    
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const query: any = {};
    if (userId) query.userId = userId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search by user name or email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      
      if (query.userId) {
        // If both userId and search are provided, intersect them
        if (!userIds.map((id: any) => id.toString()).includes(query.userId.toString())) {
          return res.json({
            transactions: [],
            total: 0,
            totalPages: 0,
            currentPage: pageNum
          });
        }
      } else {
        query.userId = { $in: userIds };
      }
    }

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
      currentPage: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('adminListCoinTransactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


