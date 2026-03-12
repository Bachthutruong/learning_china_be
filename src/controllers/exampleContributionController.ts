import { Request, Response } from 'express';
import ExampleContribution from '../models/ExampleContribution';
import ExampleContributionConfig from '../models/ExampleContributionConfig';
import User from '../models/User';

// Helper to get or create config
const getConfig = async () => {
  let config = await ExampleContributionConfig.findOne();
  if (!config) {
    config = await ExampleContributionConfig.create({ rewardContributor: 1, rewardReviewer: 1 });
  }
  return config;
};

export const createContribution = async (req: any, res: Response) => {
  try {
    const { vocabularyId, content, isAnonymous } = req.body;
    const contributorId = req.user._id;

    if (!vocabularyId || !content) {
      return res.status(400).json({ message: 'Missing required fields: vocabularyId, content' });
    }

    const contribution = await ExampleContribution.create({
      vocabularyId,
      contributorId,
      content,
      isAnonymous: isAnonymous || false,
      status: 'pending'
    });

    res.status(201).json({ message: 'Contribution submitted successfully', contribution });
  } catch (error) {
    console.error('Create contribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getApprovedExamples = async (req: Request, res: Response) => {
  try {
    const { vocabularyId } = req.params;
    if (!vocabularyId) {
      return res.status(400).json({ message: 'Missing vocabularyId' });
    }

    const examples = await ExampleContribution.find({ vocabularyId, status: 'approved' })
      .populate('contributorId', 'name')
      .populate('reviewerId', 'name')
      .sort({ updatedAt: -1 });

    const formattedExamples = examples.map(ex => {
      let contributorName = 'Người dùng ẩn danh';
      const user = ex.contributorId as any;

      if (user && user.name) {
        if (ex.isAnonymous) {
          const nameParts = user.name.trim().split(' ');
          if (nameParts.length > 0) {
            contributorName = nameParts[0] + ' ***';
          }
        } else {
          contributorName = user.name;
        }
      }

      const reviewer = ex.reviewerId as any;

      return {
        _id: ex._id,
        content: ex.editedContent || ex.content,
        contributorName,
        reviewerName: reviewer ? reviewer.name : null,
        updatedAt: ex.updatedAt
      };
    });

    res.status(200).json({ examples: formattedExamples });
  } catch (error) {
    console.error('Get approved examples error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getContributionsForReview = async (req: any, res: Response) => {
  try {
    const { status, vocabularyId, page = 1, limit = 10 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (vocabularyId) query.vocabularyId = vocabularyId;

    const skip = (Number(page) - 1) * Number(limit);

    const contributions = await ExampleContribution.find(query)
      .populate('contributorId', 'name email')
      .populate('vocabularyId', 'word')
      .populate('reviewerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ExampleContribution.countDocuments(query);

    res.status(200).json({
      contributions,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const reviewContribution = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, editedContent } = req.body; // status: 'approved' | 'rejected'
    const reviewerId = req.user._id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const contribution = await ExampleContribution.findById(id);
    if (!contribution) {
      return res.status(404).json({ message: 'Contribution not found' });
    }

    if (contribution.status !== 'pending' && status === 'approved') {
       // Allow re-approving? Usually just review once. For simplicity, allow editing.
    }

    contribution.status = status;
    contribution.reviewerId = reviewerId;
    if (editedContent) {
      contribution.editedContent = editedContent;
    }
    
    await contribution.save();

    // Give rewards if approved and it was pending before
    if (status === 'approved') {
      const config = await getConfig();
      const CoinTransaction = (await import('../models/CoinTransaction')).default;

      // Reward contributor
      if (config.rewardContributor > 0) {
        const contributor = await User.findByIdAndUpdate(
          contribution.contributorId,
          { $inc: { coins: config.rewardContributor } },
          { new: true }
        );
        await CoinTransaction.create({
          userId: contribution.contributorId,
          amount: config.rewardContributor,
          type: 'earn',
          category: 'example_contribution',
          description: 'Thưởng đóng góp ví dụ từ vựng được duyệt',
          balanceAfter: contributor?.coins ?? config.rewardContributor
        });
      }

      // Reward reviewer (req.user)
      if (config.rewardReviewer > 0) {
        const reviewer = await User.findByIdAndUpdate(
          reviewerId,
          { $inc: { coins: config.rewardReviewer } },
          { new: true }
        );
        await CoinTransaction.create({
          userId: reviewerId,
          amount: config.rewardReviewer,
          type: 'earn',
          category: 'example_review',
          description: 'Thưởng duyệt ví dụ từ vựng',
          balanceAfter: reviewer?.coins ?? config.rewardReviewer
        });
      }
    }

    res.status(200).json({ message: `Contribution ${status}`, contribution });
  } catch (error) {
    console.error('Review contribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteContribution = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await ExampleContribution.findByIdAndDelete(id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete contribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRewardConfig = async (req: Request, res: Response) => {
  try {
    const config = await getConfig();
    res.status(200).json({ config });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRewardConfig = async (req: any, res: Response) => {
  try {
    // Only admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only access' });
    }

    const { rewardContributor, rewardReviewer } = req.body;
    let config = await ExampleContributionConfig.findOne();
    if (!config) {
      config = new ExampleContributionConfig();
    }
    
    if (rewardContributor !== undefined) config.rewardContributor = rewardContributor;
    if (rewardReviewer !== undefined) config.rewardReviewer = rewardReviewer;
    
    await config.save();
    res.status(200).json({ message: 'Config updated successfully', config });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
