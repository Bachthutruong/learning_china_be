import { Request, Response } from 'express';
import Report from '../models/Report';
import User from '../models/User';
import { validationResult } from 'express-validator';

export const createReport = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, targetId, category, description } = req.body;
    
    const report = new Report({
      userId: req.user._id,
      type,
      targetId,
      category,
      description
    });

    await report.save();

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReports = async (req: any, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query: any = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminReports = async (req: any, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query: any = {};
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('userId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateReportStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rewardExperience, rewardCoins, adminNotes } = req.body;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    if (rewardExperience) report.rewardExperience = rewardExperience;
    if (rewardCoins) report.rewardCoins = rewardCoins;
    if (adminNotes) report.adminNotes = adminNotes;

    await report.save();

    // If approved, give rewards to user
    if (status === 'approved' && (rewardExperience || rewardCoins)) {
      const user = await User.findById(report.userId);
      if (user) {
        if (rewardExperience) user.experience += rewardExperience;
        if (rewardCoins) user.coins += rewardCoins;
        
        // Check for level up
        const levels = [0, 100, 300, 600, 1000, 1500, 2100];
        if (user.experience >= levels[user.level] && user.level < 6) {
          user.level += 1;
        }
        
        await user.save();
      }
    }

    res.json({
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


