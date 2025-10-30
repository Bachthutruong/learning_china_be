import { Request, Response } from 'express';
import CompetitionScoringConfig from '../models/CompetitionScoringConfig';
import CompetitionRewardsConfig from '../models/CompetitionRewardsConfig';
import UserGlobalRanking from '../models/UserGlobalRanking';
import UserCompetitionResult from '../models/UserCompetitionResult';
import UserCompetition from '../models/UserCompetition';
import User from '../models/User';
import CoinTransaction from '../models/CoinTransaction';

// ==================== SCORING CONFIG MANAGEMENT ====================

// Get all scoring configs
export const getScoringConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await CompetitionScoringConfig.find().sort({ createdAt: -1 });
    res.json({ configs });
  } catch (error) {
    console.error('Get scoring configs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active scoring config
export const getActiveScoringConfig = async (req: Request, res: Response) => {
  try {
    const config = await CompetitionScoringConfig.findOne({ isActive: true });
    if (!config) {
      return res.status(404).json({ message: 'No active scoring config found' });
    }
    res.json({ config });
  } catch (error) {
    console.error('Get active scoring config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get scoring config by ID
export const getScoringConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = await CompetitionScoringConfig.findById(id);
    if (!config) {
      return res.status(404).json({ message: 'Scoring config not found' });
    }
    res.json({ config });
  } catch (error) {
    console.error('Get scoring config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create scoring config
export const createScoringConfig = async (req: Request, res: Response) => {
  try {
    const { name, description, scoringRules, effectiveFrom, effectiveTo } = req.body;

    if (!name || !scoringRules || !Array.isArray(scoringRules)) {
      return res.status(400).json({ message: 'Name and scoring rules are required' });
    }

    // Validate time window
    if (effectiveFrom && effectiveTo && new Date(effectiveTo) < new Date(effectiveFrom)) {
      return res.status(400).json({ message: 'effectiveTo must be after effectiveFrom' });
    }

    // Validate scoring rules
    for (const rule of scoringRules) {
      if (!rule.minParticipants || !rule.rankPoints || !Array.isArray(rule.rankPoints)) {
        return res.status(400).json({ message: 'Invalid scoring rule format' });
      }
      if (rule.maxParticipants !== undefined && rule.maxParticipants < rule.minParticipants) {
        return res.status(400).json({ message: 'maxParticipants must be >= minParticipants' });
      }
      for (const rp of rule.rankPoints) {
        if (!rp.rank || rp.points === undefined) {
          return res.status(400).json({ message: 'Invalid rank points format' });
        }
      }
    }

    const config = new CompetitionScoringConfig({
      name,
      description,
      scoringRules,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
    });

    await config.save();
    res.status(201).json({
      message: 'Scoring config created successfully',
      config
    });
  } catch (error) {
    console.error('Create scoring config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update scoring config
export const updateScoringConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, scoringRules, effectiveFrom, effectiveTo } = req.body;

    if (effectiveFrom && effectiveTo && new Date(effectiveTo) < new Date(effectiveFrom)) {
      return res.status(400).json({ message: 'effectiveTo must be after effectiveFrom' });
    }

    if (scoringRules) {
      // Validate scoring rules
      for (const rule of scoringRules) {
        if (!rule.minParticipants || !rule.rankPoints || !Array.isArray(rule.rankPoints)) {
          return res.status(400).json({ message: 'Invalid scoring rule format' });
        }
        if (rule.maxParticipants !== undefined && rule.maxParticipants < rule.minParticipants) {
          return res.status(400).json({ message: 'maxParticipants must be >= minParticipants' });
        }
        for (const rp of rule.rankPoints) {
          if (!rp.rank || rp.points === undefined) {
            return res.status(400).json({ message: 'Invalid rank points format' });
          }
        }
      }
    }

    const config = await CompetitionScoringConfig.findByIdAndUpdate(
      id,
      { name, description, scoringRules, effectiveFrom, effectiveTo },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Scoring config not found' });
    }

    res.json({
      message: 'Scoring config updated successfully',
      config
    });
  } catch (error) {
    console.error('Update scoring config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Activate scoring config
export const activateScoringConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Deactivate all configs first
    await CompetitionScoringConfig.updateMany({}, { isActive: false });

    // Activate the selected config
    const config = await CompetitionScoringConfig.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Scoring config not found' });
    }

    res.json({
      message: 'Scoring config activated successfully',
      config
    });
  } catch (error) {
    console.error('Activate scoring config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete scoring config
export const deleteScoringConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = await CompetitionScoringConfig.findByIdAndDelete(id);

    if (!config) {
      return res.status(404).json({ message: 'Scoring config not found' });
    }

    res.json({ message: 'Scoring config deleted successfully' });
  } catch (error) {
    console.error('Delete scoring config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =================&= REWARDS CONFIG MANAGEMENT ====================

// Get all rewards configs
export const getRewardsConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await CompetitionRewardsConfig.find().sort({ createdAt: -1 });
    res.json({ configs });
  } catch (error) {
    console.error('Get rewards configs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active rewards config
export const getActiveRewardsConfig = async (req: Request, res: Response) => {
  try {
    const config = await CompetitionRewardsConfig.findOne({ isActive: true });
    if (!config) {
      return res.status(404).json({ message: 'No active rewards config found' });
    }
    res.json({ config });
  } catch (error) {
    console.error('Get active rewards config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get rewards config by ID
export const getRewardsConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = await CompetitionRewardsConfig.findById(id);
    if (!config) {
      return res.status(404).json({ message: 'Rewards config not found' });
    }
    res.json({ config });
  } catch (error) {
    console.error('Get rewards config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create rewards config
export const createRewardsConfig = async (req: Request, res: Response) => {
  try {
    const { name, description, rankRewards, effectiveFrom, effectiveTo } = req.body;

    if (!name || !rankRewards || !Array.isArray(rankRewards)) {
      return res.status(400).json({ message: 'Name and rank rewards are required' });
    }

    // Validate time window
    if (effectiveFrom && effectiveTo && new Date(effectiveTo) < new Date(effectiveFrom)) {
      return res.status(400).json({ message: 'effectiveTo must be after effectiveFrom' });
    }

    // Validate rank rewards
    for (const rr of rankRewards) {
      if (!rr.rank || rr.coins === undefined) {
        return res.status(400).json({ message: 'Invalid rank reward format' });
      }
    }

    // Deactivate all existing configs first
    await CompetitionRewardsConfig.updateMany({}, { isActive: false });

    const config = new CompetitionRewardsConfig({
      name,
      description,
      rankRewards,
      isActive: true,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
    });

    await config.save();
    res.status(201).json({
      message: 'Rewards config created successfully',
      config
    });
  } catch (error) {
    console.error('Create rewards config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update rewards config
export const updateRewardsConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, rankRewards, effectiveFrom, effectiveTo } = req.body;

    if (effectiveFrom && effectiveTo && new Date(effectiveTo) < new Date(effectiveFrom)) {
      return res.status(400).json({ message: 'effectiveTo must be after effectiveFrom' });
    }

    if (rankRewards) {
      // Validate rank rewards
      for (const rr of rankRewards) {
        if (!rr.rank || rr.coins === undefined) {
          return res.status(400).json({ message: 'Invalid rank reward format' });
        }
      }
    }

    const config = await CompetitionRewardsConfig.findByIdAndUpdate(
      id,
      { name, description, rankRewards, effectiveFrom, effectiveTo },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Rewards config not found' });
    }

    res.json({
      message: 'Rewards config updated successfully',
      config
    });
  } catch (error) {
    console.error('Update rewards config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Activate rewards config
export const activateRewardsConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Deactivate all configs first
    await CompetitionRewardsConfig.updateMany({}, { isActive: false });

    // Activate the selected config
    const config = await CompetitionRewardsConfig.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Rewards config not found' });
    }

    res.json({
      message: 'Rewards config activated successfully',
      config
    });
  } catch (error) {
    console.error('Activate rewards config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete rewards config
export const deleteRewardsConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = await CompetitionRewardsConfig.findByIdAndDelete(id);

    if (!config) {
      return res.status(404).json({ message: 'Rewards config not found' });
    }

    res.json({ message: 'Rewards config deleted successfully' });
  } catch (error) {
    console.error('Delete rewards config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== GLOBAL RANKING ====================

// Calculate points for a user based on rank and competition size
export const calculatePoints = async (rank: number, participantsCount: number): Promise<number> => {
  // Use ALL configs by merging rules
  const now = new Date();
  const configs = await CompetitionScoringConfig.find();
  if (!configs || configs.length === 0) {
    return 0;
  }

  // Only configs in-effect now are considered by default
  const inRangeConfigs = configs.filter((c: any) => {
    const fromOk = !c.effectiveFrom || new Date(c.effectiveFrom) <= now;
    const toOk = !c.effectiveTo || now <= new Date(c.effectiveTo);
    return fromOk && toOk;
  });

  const allRules = inRangeConfigs.flatMap((c: any) => c.scoringRules || []);
  if (allRules.length === 0) return 0;

  // Prefer more specific ranges first: sort by min asc then max asc
  const sortedRules = allRules.sort((a: any, b: any) => {
    if (a.minParticipants !== b.minParticipants) return a.minParticipants - b.minParticipants;
    const aMax = a.maxParticipants ?? Number.POSITIVE_INFINITY;
    const bMax = b.maxParticipants ?? Number.POSITIVE_INFINITY;
    return aMax - bMax;
  });

  for (const rule of sortedRules) {
    const max = (rule as any).maxParticipants ?? Number.POSITIVE_INFINITY;
    if (participantsCount >= (rule as any).minParticipants && participantsCount <= max) {
      const rankPoint = rule.rankPoints.find((rp: any) => rp.rank === rank);
      if (rankPoint) return rankPoint.points;
      break;
    }
  }

  return 0;
};

// Get global ranking leaderboard
export const getGlobalRanking = async (req: Request, res: Response) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get rankings sorted by total points desc, then by competitions participated desc
    const rankings = await UserGlobalRanking.find()
      .populate('user', 'name level email')
      .sort({ totalPoints: -1, competitionsParticipated: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Calculate current ranks
    const allRankings = await UserGlobalRanking.find()
      .sort({ totalPoints: -1, competitionsParticipated: -1 });
    
    const rankingsWithRank = rankings.map(ranking => {
      const globalRank = allRankings.findIndex(r => 
        (r._id as any).toString() === (ranking._id as any).toString()
      ) + 1;
      return {
        ...ranking.toObject(),
        rank: globalRank
      };
    });

    const total = await UserGlobalRanking.countDocuments();

    res.json({
      rankings: rankingsWithRank,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Get global ranking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Public: list scoring configs for display
export const getScoringConfigsPublic = async (req: Request, res: Response) => {
  try {
    const configs = await CompetitionScoringConfig.find()
      .sort({ effectiveFrom: -1, createdAt: -1 });
    res.json({ configs });
  } catch (error) {
    console.error('Get scoring configs public error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user's global ranking (called when competition result is submitted)
export const updateUserGlobalRanking = async (userId: any, points: number) => {
  try {
    let userRanking = await UserGlobalRanking.findOne({ user: userId });
    
    if (!userRanking) {
      // Create new ranking entry
      userRanking = new UserGlobalRanking({
        user: userId,
        totalPoints: points,
        competitionsParticipated: 1,
        lastUpdated: new Date()
      });
    } else {
      // Update existing ranking
      userRanking.totalPoints += points;
      userRanking.competitionsParticipated += 1;
      userRanking.lastUpdated = new Date();
    }

    await userRanking.save();
  } catch (error) {
    console.error('Update user global ranking error:', error);
    // Don't throw error, just log it
  }
};

// Distribute rewards for global ranking (call this periodically or manually)
export const distributeGlobalRankingRewards = async (req: Request, res: Response) => {
  try {
  const config = await CompetitionRewardsConfig.findOne({ isActive: true });
    if (!config) {
      return res.status(404).json({ message: 'No active rewards config found' });
    }

  // If rewards config has time range, compute totals in that window using UserCompetitionResult
  let candidates: any[] = [];
  if ((config as any).effectiveFrom || (config as any).effectiveTo) {
    const match: any = {};
    if ((config as any).effectiveFrom) match.completedAt = { $gte: new Date((config as any).effectiveFrom) };
    if ((config as any).effectiveTo) {
      match.completedAt = match.completedAt || {};
      match.completedAt.$lte = new Date((config as any).effectiveTo);
    }
    const agg = await UserCompetitionResult.aggregate([
      { $match: match },
      { $group: { _id: '$user', totalPoints: { $sum: '$points' }, competitionsParticipated: { $sum: 1 } } },
      { $sort: { totalPoints: -1, competitionsParticipated: -1 } },
      { $limit: (config as any).rankRewards.length }
    ]);
    // hydrate users
    candidates = await Promise.all(
      agg.map(async (a, i) => {
        const u = await User.findById(a._id);
        return { user: u, totalPoints: a.totalPoints, competitionsParticipated: a.competitionsParticipated, rank: i + 1 };
      })
    );
  } else {
    // Fallback to all-time global ranking
    const topRankings = await UserGlobalRanking.find()
      .sort({ totalPoints: -1, competitionsParticipated: -1 })
      .populate('user')
      .limit((config as any).rankRewards.length);
    candidates = topRankings.map((r, idx) => ({ user: r.user, totalPoints: r.totalPoints, competitionsParticipated: r.competitionsParticipated, rank: idx + 1 }));
  }

    const results = [];

    for (let i = 0; i < candidates.length; i++) {
      const ranking = candidates[i];
      const globalRank = ranking.rank || i + 1;
      
      // Find reward for this rank
      const reward = config.rankRewards.find(rr => rr.rank === globalRank);
      
      if (reward && reward.coins > 0) {
        const user = await User.findById((ranking.user as any)?._id || ranking.user);
        if (user) {
          user.coins += reward.coins;
          await user.save();

          // Record transaction
          await CoinTransaction.create({
            userId: user._id,
            amount: reward.coins,
            type: 'earn',
            category: 'global_ranking_reward',
            description: `Thưởng xếp hạng toàn bộ vị trí #${globalRank}`,
            balanceAfter: user.coins,
            metadata: { rank: globalRank, totalPoints: ranking.totalPoints }
          });

          results.push({
            userId: user._id,
            userName: user.name,
            rank: globalRank,
            coins: reward.coins
          });
        }
      }
    }

    res.json({
      message: 'Rewards distributed successfully',
      results
    });
  } catch (error) {
    console.error('Distribute global ranking rewards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

