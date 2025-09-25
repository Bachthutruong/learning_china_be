import { Request, Response } from 'express';
import User from '../models/User';
import Report from '../models/Report';
import Payment from '../models/Payment';

export const checkIn = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const today = new Date();
    const lastCheckIn = new Date(user.lastCheckIn);
    
    // Check if already checked in today
    if (lastCheckIn.toDateString() === today.toDateString()) {
      return res.status(400).json({ message: 'Already checked in today' });
    }
    
    // Calculate streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastCheckIn.toDateString() === yesterday.toDateString()) {
      user.streak += 1;
    } else {
      user.streak = 1;
    }
    
    // Calculate rewards based on streak
    const baseReward = 10;
    const streakBonus = Math.min(user.streak * 2, 50);
    const totalExperience = baseReward + streakBonus;
    const totalCoins = Math.floor(totalExperience / 2);
    
    // Special streak milestones
    let milestoneBonus = 0;
    if (user.streak === 7) {
      milestoneBonus = 50; // 1 week streak
    } else if (user.streak === 30) {
      milestoneBonus = 200; // 1 month streak
    } else if (user.streak === 100) {
      milestoneBonus = 500; // 100 day streak
    }
    
    const finalExperience = totalExperience + milestoneBonus;
    const finalCoins = totalCoins + Math.floor(milestoneBonus / 2);
    
    user.experience += finalExperience;
    user.coins += finalCoins;
    user.lastCheckIn = today;
    
    // Check for level up
    const levels = [0, 100, 300, 600, 1000, 1500, 2100];
    if (user.experience >= levels[user.level] && user.level < 6) {
      user.level += 1;
    }
    
    await user.save();

    res.json({
      message: 'Check-in successful',
      rewards: {
        experience: finalExperience,
        coins: finalCoins,
        streak: user.streak,
        milestoneBonus: milestoneBonus > 0 ? milestoneBonus : undefined
      },
      user: {
        level: user.level,
        experience: user.experience,
        coins: user.coins,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserStats = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's reports
    const reports = await Report.find({ userId: req.user._id });
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const approvedReports = reports.filter(r => r.status === 'approved').length;
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        experience: user.experience,
        coins: user.coins,
        streak: user.streak,
        lastCheckIn: user.lastCheckIn
      },
      stats: {
        totalReports: reports.length,
        pendingReports,
        approvedReports
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const purchaseCoins = async (req: any, res: Response) => {
  try {
    const { amount, paymentMethod, currency = 'VND' } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate amount
    if (amount < 10000) { // Minimum 10,000 VND
      return res.status(400).json({ message: 'Minimum purchase amount is 10,000 VND' });
    }
    
    // Calculate coins based on amount (1 coin = 1000 VND)
    const coins = Math.floor(amount / 1000);
    
    // Create payment record
    const payment = new Payment({
      userId: user._id,
      amount,
      currency,
      coins,
      paymentMethod,
      paymentStatus: 'pending'
    });
    
    await payment.save();
    
    // For demo purposes, we'll simulate successful payment
    // In production, integrate with actual payment gateway
    payment.paymentStatus = 'completed';
    payment.transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await payment.save();
    
    // Add coins to user
    user.coins += coins;
    await user.save();

    res.json({
      message: 'Coins purchased successfully',
      payment: {
        id: payment._id,
        amount,
        coins,
        transactionId: payment.transactionId
      },
      user: {
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Purchase coins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPaymentHistory = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    
    const payments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Payment.countDocuments({ userId: user._id });

    res.json({
      payments,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    
    const users = await User.find()
      .select('name level experience coins')
      .sort({ experience: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await User.countDocuments();

    res.json({
      leaderboard: users,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
