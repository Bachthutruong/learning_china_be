"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRewardConfig = exports.getRewardConfig = exports.deleteContribution = exports.reviewContribution = exports.getContributionsForReview = exports.getApprovedExamples = exports.createContribution = void 0;
const ExampleContribution_1 = __importDefault(require("../models/ExampleContribution"));
const ExampleContributionConfig_1 = __importDefault(require("../models/ExampleContributionConfig"));
const User_1 = __importDefault(require("../models/User"));
// Helper to get or create config
const getConfig = async () => {
    let config = await ExampleContributionConfig_1.default.findOne();
    if (!config) {
        config = await ExampleContributionConfig_1.default.create({ rewardContributor: 1, rewardReviewer: 1 });
    }
    return config;
};
const createContribution = async (req, res) => {
    try {
        const { vocabularyId, content, isAnonymous } = req.body;
        const contributorId = req.user._id;
        if (!vocabularyId || !content) {
            return res.status(400).json({ message: 'Missing required fields: vocabularyId, content' });
        }
        const contribution = await ExampleContribution_1.default.create({
            vocabularyId,
            contributorId,
            content,
            isAnonymous: isAnonymous || false,
            status: 'pending'
        });
        res.status(201).json({ message: 'Contribution submitted successfully', contribution });
    }
    catch (error) {
        console.error('Create contribution error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createContribution = createContribution;
const getApprovedExamples = async (req, res) => {
    try {
        const { vocabularyId } = req.params;
        if (!vocabularyId) {
            return res.status(400).json({ message: 'Missing vocabularyId' });
        }
        const examples = await ExampleContribution_1.default.find({ vocabularyId, status: 'approved' })
            .populate('contributorId', 'name')
            .populate('reviewerId', 'name')
            .sort({ updatedAt: -1 });
        const formattedExamples = examples.map(ex => {
            let contributorName = 'Người dùng ẩn danh';
            const user = ex.contributorId;
            if (user && user.name) {
                if (ex.isAnonymous) {
                    const nameParts = user.name.trim().split(' ');
                    if (nameParts.length > 0) {
                        contributorName = nameParts[0] + ' ***';
                    }
                }
                else {
                    contributorName = user.name;
                }
            }
            const reviewer = ex.reviewerId;
            return {
                _id: ex._id,
                content: ex.editedContent || ex.content,
                contributorName,
                reviewerName: reviewer ? reviewer.name : null,
                updatedAt: ex.updatedAt
            };
        });
        res.status(200).json({ examples: formattedExamples });
    }
    catch (error) {
        console.error('Get approved examples error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getApprovedExamples = getApprovedExamples;
const getContributionsForReview = async (req, res) => {
    try {
        const { status, vocabularyId, page = 1, limit = 10 } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (vocabularyId)
            query.vocabularyId = vocabularyId;
        const skip = (Number(page) - 1) * Number(limit);
        const contributions = await ExampleContribution_1.default.find(query)
            .populate('contributorId', 'name email')
            .populate('vocabularyId', 'word')
            .populate('reviewerId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await ExampleContribution_1.default.countDocuments(query);
        res.status(200).json({
            contributions,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        });
    }
    catch (error) {
        console.error('Get contributions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getContributionsForReview = getContributionsForReview;
const reviewContribution = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, editedContent } = req.body; // status: 'approved' | 'rejected'
        const reviewerId = req.user._id;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const contribution = await ExampleContribution_1.default.findById(id);
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
            const CoinTransaction = (await Promise.resolve().then(() => __importStar(require('../models/CoinTransaction')))).default;
            // Reward contributor
            if (config.rewardContributor > 0) {
                const contributor = await User_1.default.findByIdAndUpdate(contribution.contributorId, { $inc: { coins: config.rewardContributor } }, { new: true });
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
                const reviewer = await User_1.default.findByIdAndUpdate(reviewerId, { $inc: { coins: config.rewardReviewer } }, { new: true });
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
    }
    catch (error) {
        console.error('Review contribution error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.reviewContribution = reviewContribution;
const deleteContribution = async (req, res) => {
    try {
        const { id } = req.params;
        await ExampleContribution_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: 'Deleted successfully' });
    }
    catch (error) {
        console.error('Delete contribution error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteContribution = deleteContribution;
const getRewardConfig = async (req, res) => {
    try {
        const config = await getConfig();
        res.status(200).json({ config });
    }
    catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRewardConfig = getRewardConfig;
const updateRewardConfig = async (req, res) => {
    try {
        // Only admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin only access' });
        }
        const { rewardContributor, rewardReviewer } = req.body;
        let config = await ExampleContributionConfig_1.default.findOne();
        if (!config) {
            config = new ExampleContributionConfig_1.default();
        }
        if (rewardContributor !== undefined)
            config.rewardContributor = rewardContributor;
        if (rewardReviewer !== undefined)
            config.rewardReviewer = rewardReviewer;
        await config.save();
        res.status(200).json({ message: 'Config updated successfully', config });
    }
    catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateRewardConfig = updateRewardConfig;
