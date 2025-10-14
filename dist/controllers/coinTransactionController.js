"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListCoinTransactions = exports.getMyCoinTransactions = void 0;
const CoinTransaction_1 = __importDefault(require("../models/CoinTransaction"));
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
        const { page = 1, limit = 20, userId } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
        const query = {};
        if (userId)
            query.userId = userId;
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
            currentPage: pageNum
        });
    }
    catch (error) {
        console.error('adminListCoinTransactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.adminListCoinTransactions = adminListCoinTransactions;
