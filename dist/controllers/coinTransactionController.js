"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListCoinTransactions = exports.getMyCoinTransactions = void 0;
const CoinTransaction_1 = __importDefault(require("../models/CoinTransaction"));
const User_1 = __importDefault(require("../models/User"));
// Get current user's coin transactions
const getMyCoinTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
        const [items, total] = await Promise.all([
            CoinTransaction_1.default.find({ userId: req.user._id })
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip((pageNum - 1) * limitNum),
            CoinTransaction_1.default.countDocuments({ userId: req.user._id })
        ]);
        res.json({
            transactions: items,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum
        });
    }
    catch (error) {
        console.error('getMyCoinTransactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMyCoinTransactions = getMyCoinTransactions;
// Admin: list coin transactions, optional by userId
const adminListCoinTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, search, startDate, endDate } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const query = {};
        if (userId)
            query.userId = userId;
        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        // Search by user name or email
        if (search) {
            const users = await User_1.default.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            if (query.userId) {
                // If both userId and search are provided, intersect them
                if (!userIds.map((id) => id.toString()).includes(query.userId.toString())) {
                    return res.json({
                        transactions: [],
                        total: 0,
                        totalPages: 0,
                        currentPage: pageNum
                    });
                }
            }
            else {
                query.userId = { $in: userIds };
            }
        }
        const [items, total] = await Promise.all([
            CoinTransaction_1.default.find(query)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip((pageNum - 1) * limitNum),
            CoinTransaction_1.default.countDocuments(query)
        ]);
        res.json({
            transactions: items,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            limit: limitNum
        });
    }
    catch (error) {
        console.error('adminListCoinTransactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.adminListCoinTransactions = adminListCoinTransactions;
