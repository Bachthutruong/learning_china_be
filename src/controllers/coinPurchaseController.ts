import { Request, Response } from 'express';
import CoinPurchase from '../models/CoinPurchase';
import User from '../models/User';
import { validationResult } from 'express-validator';

// User creates a coin purchase request
export const createCoinPurchase = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod, bankAccount, transactionId, proofOfPayment } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate amount (minimum 10,000 VND)
    if (amount < 10000) {
      return res.status(400).json({ message: 'Minimum purchase amount is 10,000 VND' });
    }
    
    // Calculate coins (1 coin = 1000 VND)
    const coins = Math.floor(amount / 1000);
    
    // Create coin purchase request
    const coinPurchase = new CoinPurchase({
      userId: user._id,
      amount,
      coins,
      paymentMethod,
      bankAccount,
      transactionId,
      proofOfPayment,
      status: 'pending'
    });
    
    await coinPurchase.save();
    
    res.status(201).json({
      message: 'Coin purchase request submitted successfully. Please wait for admin approval.',
      purchase: {
        id: coinPurchase._id,
        amount,
        coins,
        status: coinPurchase.status,
        createdAt: coinPurchase.createdAt
      }
    });
  } catch (error) {
    console.error('Create coin purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User gets their purchase history
export const getUserCoinPurchases = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let query: any = { userId: user._id };
    if (status) {
      query.status = status;
    }
    
    const purchases = await CoinPurchase.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CoinPurchase.countDocuments(query);
    
    res.json({
      purchases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get user coin purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User gets specific purchase details
export const getCoinPurchaseById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const purchase = await CoinPurchase.findOne({ _id: id, userId: user._id });
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    res.json(purchase);
  } catch (error) {
    console.error('Get coin purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin gets all pending purchases
export const getPendingCoinPurchases = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const purchases = await CoinPurchase.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CoinPurchase.countDocuments({ status: 'pending' });
    
    res.json({
      purchases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get pending coin purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin approves a coin purchase
export const approveCoinPurchase = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const purchase = await CoinPurchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    if (purchase.status !== 'pending') {
      return res.status(400).json({ message: 'Purchase is not pending' });
    }
    
    // Update purchase status
    purchase.status = 'approved';
    purchase.adminNotes = adminNotes;
    await purchase.save();
    
    // Add coins to user
    const user = await User.findById(purchase.userId);
    if (user) {
      user.coins += purchase.coins;
      await user.save();
    }
    
    res.json({
      message: 'Coin purchase approved successfully',
      purchase: {
        id: purchase._id,
        coins: purchase.coins,
        user: {
          id: user?._id,
          name: user?.name,
          coins: user?.coins
        }
      }
    });
  } catch (error) {
    console.error('Approve coin purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin rejects a coin purchase
export const rejectCoinPurchase = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const purchase = await CoinPurchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    if (purchase.status !== 'pending') {
      return res.status(400).json({ message: 'Purchase is not pending' });
    }
    
    // Update purchase status
    purchase.status = 'rejected';
    purchase.adminNotes = adminNotes;
    await purchase.save();
    
    res.json({
      message: 'Coin purchase rejected',
      purchase: {
        id: purchase._id,
        status: purchase.status,
        adminNotes: purchase.adminNotes
      }
    });
  } catch (error) {
    console.error('Reject coin purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin gets all coin purchases
export const getAllCoinPurchases = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    
    let query: any = {};
    if (status) {
      query.status = status;
    }
    if (userId) {
      query.userId = userId;
    }
    
    const purchases = await CoinPurchase.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CoinPurchase.countDocuments(query);
    
    res.json({
      purchases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all coin purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
