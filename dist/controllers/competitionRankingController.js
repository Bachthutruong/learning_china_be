"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.distributeGlobalRankingRewards = exports.updateUserGlobalRanking = exports.getScoringConfigsPublic = exports.getGlobalRanking = exports.calculatePoints = exports.deleteRewardsConfig = exports.activateRewardsConfig = exports.updateRewardsConfig = exports.createRewardsConfig = exports.getRewardsConfig = exports.getActiveRewardsConfig = exports.getRewardsConfigs = exports.deleteScoringConfig = exports.activateScoringConfig = exports.updateScoringConfig = exports.createScoringConfig = exports.getScoringConfig = exports.getActiveScoringConfig = exports.getScoringConfigs = void 0;
const CompetitionScoringConfig_1 = __importDefault(require("../models/CompetitionScoringConfig"));
const CompetitionRewardsConfig_1 = __importDefault(require("../models/CompetitionRewardsConfig"));
const UserGlobalRanking_1 = __importDefault(require("../models/UserGlobalRanking"));
const UserCompetitionResult_1 = __importDefault(require("../models/UserCompetitionResult"));
const User_1 = __importDefault(require("../models/User"));
const CoinTransaction_1 = __importDefault(require("../models/CoinTransaction"));
// ==================== SCORING CONFIG MANAGEMENT ====================
// Get all scoring configs
const getScoringConfigs = async (req, res) => {
    try {
        const configs = await CompetitionScoringConfig_1.default.find().sort({ createdAt: -1 });
        res.json({ configs });
    }
    catch (error) {
        console.error('Get scoring configs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getScoringConfigs = getScoringConfigs;
// Get active scoring config
const getActiveScoringConfig = async (req, res) => {
    try {
        const config = await CompetitionScoringConfig_1.default.findOne({ isActive: true });
        if (!config) {
            return res.status(404).json({ message: 'No active scoring config found' });
        }
        res.json({ config });
    }
    catch (error) {
        console.error('Get active scoring config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getActiveScoringConfig = getActiveScoringConfig;
// Get scoring config by ID
const getScoringConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const config = await CompetitionScoringConfig_1.default.findById(id);
        if (!config) {
            return res.status(404).json({ message: 'Scoring config not found' });
        }
        res.json({ config });
    }
    catch (error) {
        console.error('Get scoring config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getScoringConfig = getScoringConfig;
// Create scoring config
const createScoringConfig = async (req, res) => {
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
        const config = new CompetitionScoringConfig_1.default({
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
    }
    catch (error) {
        console.error('Create scoring config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createScoringConfig = createScoringConfig;
// Update scoring config
const updateScoringConfig = async (req, res) => {
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
        const config = await CompetitionScoringConfig_1.default.findByIdAndUpdate(id, { name, description, scoringRules, effectiveFrom, effectiveTo }, { new: true });
        if (!config) {
            return res.status(404).json({ message: 'Scoring config not found' });
        }
        res.json({
            message: 'Scoring config updated successfully',
            config
        });
    }
    catch (error) {
        console.error('Update scoring config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateScoringConfig = updateScoringConfig;
// Activate scoring config
const activateScoringConfig = async (req, res) => {
    try {
        const { id } = req.params;
        // Deactivate all configs first
        await CompetitionScoringConfig_1.default.updateMany({}, { isActive: false });
        // Activate the selected config
        const config = await CompetitionScoringConfig_1.default.findByIdAndUpdate(id, { isActive: true }, { new: true });
        if (!config) {
            return res.status(404).json({ message: 'Scoring config not found' });
        }
        res.json({
            message: 'Scoring config activated successfully',
            config
        });
    }
    catch (error) {
        console.error('Activate scoring config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.activateScoringConfig = activateScoringConfig;
// Delete scoring config
const deleteScoringConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const config = await CompetitionScoringConfig_1.default.findByIdAndDelete(id);
        if (!config) {
            return res.status(404).json({ message: 'Scoring config not found' });
        }
        res.json({ message: 'Scoring config deleted successfully' });
    }
    catch (error) {
        console.error('Delete scoring config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteScoringConfig = deleteScoringConfig;
// =================&= REWARDS CONFIG MANAGEMENT ====================
// Get all rewards configs
const getRewardsConfigs = async (req, res) => {
    try {
        const configs = await CompetitionRewardsConfig_1.default.find().sort({ createdAt: -1 });
        res.json({ configs });
    }
    catch (error) {
        console.error('Get rewards configs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRewardsConfigs = getRewardsConfigs;
// Get active rewards config
const getActiveRewardsConfig = async (req, res) => {
    try {
        const config = await CompetitionRewardsConfig_1.default.findOne({ isActive: true });
        if (!config) {
            return res.status(404).json({ message: 'No active rewards config found' });
        }
        res.json({ config });
    }
    catch (error) {
        console.error('Get active rewards config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getActiveRewardsConfig = getActiveRewardsConfig;
// Get rewards config by ID
const getRewardsConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const config = await CompetitionRewardsConfig_1.default.findById(id);
        if (!config) {
            return res.status(404).json({ message: 'Rewards config not found' });
        }
        res.json({ config });
    }
    catch (error) {
        console.error('Get rewards config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRewardsConfig = getRewardsConfig;
// Create rewards config
const createRewardsConfig = async (req, res) => {
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
        await CompetitionRewardsConfig_1.default.updateMany({}, { isActive: false });
        const config = new CompetitionRewardsConfig_1.default({
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
    }
    catch (error) {
        console.error('Create rewards config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createRewardsConfig = createRewardsConfig;
// Update rewards config
const updateRewardsConfig = async (req, res) => {
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
        const config = await CompetitionRewardsConfig_1.default.findByIdAndUpdate(id, { name, description, rankRewards, effectiveFrom, effectiveTo }, { new: true });
        if (!config) {
            return res.status(404).json({ message: 'Rewards config not found' });
        }
        res.json({
            message: 'Rewards config updated successfully',
            config
        });
    }
    catch (error) {
        console.error('Update rewards config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateRewardsConfig = updateRewardsConfig;
// Activate rewards config
const activateRewardsConfig = async (req, res) => {
    try {
        const { id } = req.params;
        // Deactivate all configs first
        await CompetitionRewardsConfig_1.default.updateMany({}, { isActive: false });
        // Activate the selected config
        const config = await CompetitionRewardsConfig_1.default.findByIdAndUpdate(id, { isActive: true }, { new: true });
        if (!config) {
            return res.status(404).json({ message: 'Rewards config not found' });
        }
        res.json({
            message: 'Rewards config activated successfully',
            config
        });
    }
    catch (error) {
        console.error('Activate rewards config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.activateRewardsConfig = activateRewardsConfig;
// Delete rewards config
const deleteRewardsConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const config = await CompetitionRewardsConfig_1.default.findByIdAndDelete(id);
        if (!config) {
            return res.status(404).json({ message: 'Rewards config not found' });
        }
        res.json({ message: 'Rewards config deleted successfully' });
    }
    catch (error) {
        console.error('Delete rewards config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteRewardsConfig = deleteRewardsConfig;
// ==================== GLOBAL RANKING ====================
// Calculate points for a user based on rank and competition size
const calculatePoints = async (rank, participantsCount) => {
    // Use ALL configs by merging rules
    const now = new Date();
    const configs = await CompetitionScoringConfig_1.default.find();
    if (!configs || configs.length === 0) {
        return 0;
    }
    // Only configs in-effect now are considered by default
    const inRangeConfigs = configs.filter((c) => {
        const fromOk = !c.effectiveFrom || new Date(c.effectiveFrom) <= now;
        const toOk = !c.effectiveTo || now <= new Date(c.effectiveTo);
        return fromOk && toOk;
    });
    const allRules = inRangeConfigs.flatMap((c) => c.scoringRules || []);
    if (allRules.length === 0)
        return 0;
    // Prefer more specific ranges first: sort by min asc then max asc
    const sortedRules = allRules.sort((a, b) => {
        if (a.minParticipants !== b.minParticipants)
            return a.minParticipants - b.minParticipants;
        const aMax = a.maxParticipants ?? Number.POSITIVE_INFINITY;
        const bMax = b.maxParticipants ?? Number.POSITIVE_INFINITY;
        return aMax - bMax;
    });
    for (const rule of sortedRules) {
        const max = rule.maxParticipants ?? Number.POSITIVE_INFINITY;
        if (participantsCount >= rule.minParticipants && participantsCount <= max) {
            const rankPoint = rule.rankPoints.find((rp) => rp.rank === rank);
            if (rankPoint)
                return rankPoint.points;
            break;
        }
    }
    return 0;
};
exports.calculatePoints = calculatePoints;
// Get global ranking leaderboard
const getGlobalRanking = async (req, res) => {
    try {
        const { limit = 100, page = 1 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        // Get rankings sorted by total points desc, then by competitions participated desc
        const rankings = await UserGlobalRanking_1.default.find()
            .populate('user', 'name level email')
            .sort({ totalPoints: -1, competitionsParticipated: -1 })
            .skip(skip)
            .limit(Number(limit));
        // Calculate current ranks
        const allRankings = await UserGlobalRanking_1.default.find()
            .sort({ totalPoints: -1, competitionsParticipated: -1 });
        const rankingsWithRank = rankings.map(ranking => {
            const globalRank = allRankings.findIndex(r => r._id.toString() === ranking._id.toString()) + 1;
            return {
                ...ranking.toObject(),
                rank: globalRank
            };
        });
        const total = await UserGlobalRanking_1.default.countDocuments();
        res.json({
            rankings: rankingsWithRank,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    }
    catch (error) {
        console.error('Get global ranking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getGlobalRanking = getGlobalRanking;
// Public: list scoring configs for display
const getScoringConfigsPublic = async (req, res) => {
    try {
        const configs = await CompetitionScoringConfig_1.default.find()
            .sort({ effectiveFrom: -1, createdAt: -1 });
        res.json({ configs });
    }
    catch (error) {
        console.error('Get scoring configs public error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getScoringConfigsPublic = getScoringConfigsPublic;
// Update user's global ranking (called when competition result is submitted)
const updateUserGlobalRanking = async (userId, points) => {
    try {
        let userRanking = await UserGlobalRanking_1.default.findOne({ user: userId });
        if (!userRanking) {
            // Create new ranking entry
            userRanking = new UserGlobalRanking_1.default({
                user: userId,
                totalPoints: points,
                competitionsParticipated: 1,
                lastUpdated: new Date()
            });
        }
        else {
            // Update existing ranking
            userRanking.totalPoints += points;
            userRanking.competitionsParticipated += 1;
            userRanking.lastUpdated = new Date();
        }
        await userRanking.save();
    }
    catch (error) {
        console.error('Update user global ranking error:', error);
        // Don't throw error, just log it
    }
};
exports.updateUserGlobalRanking = updateUserGlobalRanking;
// Distribute rewards for global ranking (call this periodically or manually)
const distributeGlobalRankingRewards = async (req, res) => {
    try {
        const config = await CompetitionRewardsConfig_1.default.findOne({ isActive: true });
        if (!config) {
            return res.status(404).json({ message: 'No active rewards config found' });
        }
        // If rewards config has time range, compute totals in that window using UserCompetitionResult
        let candidates = [];
        if (config.effectiveFrom || config.effectiveTo) {
            const match = {};
            if (config.effectiveFrom)
                match.completedAt = { $gte: new Date(config.effectiveFrom) };
            if (config.effectiveTo) {
                match.completedAt = match.completedAt || {};
                match.completedAt.$lte = new Date(config.effectiveTo);
            }
            const agg = await UserCompetitionResult_1.default.aggregate([
                { $match: match },
                { $group: { _id: '$user', totalPoints: { $sum: '$points' }, competitionsParticipated: { $sum: 1 } } },
                { $sort: { totalPoints: -1, competitionsParticipated: -1 } },
                { $limit: config.rankRewards.length }
            ]);
            // hydrate users
            candidates = await Promise.all(agg.map(async (a, i) => {
                const u = await User_1.default.findById(a._id);
                return { user: u, totalPoints: a.totalPoints, competitionsParticipated: a.competitionsParticipated, rank: i + 1 };
            }));
        }
        else {
            // Fallback to all-time global ranking
            const topRankings = await UserGlobalRanking_1.default.find()
                .sort({ totalPoints: -1, competitionsParticipated: -1 })
                .populate('user')
                .limit(config.rankRewards.length);
            candidates = topRankings.map((r, idx) => ({ user: r.user, totalPoints: r.totalPoints, competitionsParticipated: r.competitionsParticipated, rank: idx + 1 }));
        }
        const results = [];
        for (let i = 0; i < candidates.length; i++) {
            const ranking = candidates[i];
            const globalRank = ranking.rank || i + 1;
            // Find reward for this rank
            const reward = config.rankRewards.find(rr => rr.rank === globalRank);
            if (reward && reward.coins > 0) {
                const user = await User_1.default.findById(ranking.user?._id || ranking.user);
                if (user) {
                    user.coins += reward.coins;
                    await user.save();
                    // Record transaction
                    await CoinTransaction_1.default.create({
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
    }
    catch (error) {
        console.error('Distribute global ranking rewards error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.distributeGlobalRankingRewards = distributeGlobalRankingRewards;
