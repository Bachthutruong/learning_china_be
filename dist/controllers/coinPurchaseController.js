"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCoinPurchases = exports.rejectCoinPurchase = exports.approveCoinPurchase = exports.getPendingCoinPurchases = exports.getCoinPurchaseById = exports.getUserCoinPurchases = exports.createCoinPurchase = void 0;
const CoinPurchase_1 = __importDefault(require("../models/CoinPurchase"));
const User_1 = __importDefault(require("../models/User"));
const express_validator_1 = require("express-validator");
// User creates a coin purchase request
const createCoinPurchase = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { amount, paymentMethod, bankAccount, transactionId, proofOfPayment } = req.body;
        const user = await User_1.default.findById(req.user._id);
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
        const coinPurchase = new CoinPurchase_1.default({
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
    }
    catch (error) {
        console.error('Create coin purchase error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createCoinPurchase = createCoinPurchase;
// User gets their purchase history
const getUserCoinPurchases = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let query = { userId: user._id };
        if (status) {
            query.status = status;
        }
        const purchases = await CoinPurchase_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await CoinPurchase_1.default.countDocuments(query);
        res.json({
            purchases,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    }
    catch (error) {
        console.error('Get user coin purchases error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserCoinPurchases = getUserCoinPurchases;
// User gets specific purchase details
const getCoinPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const purchase = await CoinPurchase_1.default.findOne({ _id: id, userId: user._id });
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }
        res.json(purchase);
    }
    catch (error) {
        console.error('Get coin purchase error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCoinPurchaseById = getCoinPurchaseById;
// Admin gets all pending purchases
const getPendingCoinPurchases = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const purchases = await CoinPurchase_1.default.find({ status: 'pending' })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await CoinPurchase_1.default.countDocuments({ status: 'pending' });
        res.json({
            purchases,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    }
    catch (error) {
        console.error('Get pending coin purchases error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPendingCoinPurchases = getPendingCoinPurchases;
// Admin approves a coin purchase
const approveCoinPurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        const purchase = await CoinPurchase_1.default.findById(id);
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
        const user = await User_1.default.findById(purchase.userId);
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
    }
    catch (error) {
        console.error('Approve coin purchase error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.approveCoinPurchase = approveCoinPurchase;
// Admin rejects a coin purchase
const rejectCoinPurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        const purchase = await CoinPurchase_1.default.findById(id);
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
    }
    catch (error) {
        console.error('Reject coin purchase error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.rejectCoinPurchase = rejectCoinPurchase;
// Admin gets all coin purchases
const getAllCoinPurchases = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, userId } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        if (userId) {
            query.userId = userId;
        }
        const purchases = await CoinPurchase_1.default.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await CoinPurchase_1.default.countDocuments(query);
        res.json({
            purchases,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    }
    catch (error) {
        console.error('Get all coin purchases error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllCoinPurchases = getAllCoinPurchases;
//# sourceMappingURL=coinPurchaseController.js.map