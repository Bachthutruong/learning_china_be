"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCoinPurchase = exports.getPaymentConfig = exports.getAllCoinPurchases = exports.rejectCoinPurchase = exports.approveCoinPurchase = exports.getPendingCoinPurchases = exports.getCoinPurchaseById = exports.getUserCoinPurchases = exports.createCoinPurchase = void 0;
const CoinPurchase_1 = __importDefault(require("../models/CoinPurchase"));
const User_1 = __importDefault(require("../models/User"));
const PaymentConfig_1 = __importDefault(require("../models/PaymentConfig"));
const express_validator_1 = require("express-validator");
// User creates a coin purchase request
const createCoinPurchase = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { amount, bankAccount, transactionId, receiptImage } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Get payment config
        const paymentConfig = await PaymentConfig_1.default.findOne({ isActive: true });
        if (!paymentConfig) {
            return res.status(400).json({ message: 'Payment configuration not found' });
        }
        // Validate amount (minimum 1 TWD)
        if (amount < 1) {
            return res.status(400).json({ message: 'Minimum purchase amount is 1 TWD' });
        }
        // Calculate coins based on exchange rate
        const coins = Math.floor(amount * paymentConfig.exchangeRate);
        // Create coin purchase request
        const coinPurchase = new CoinPurchase_1.default({
            userId: user._id,
            amount,
            currency: 'TWD',
            coins,
            paymentMethod: 'bank_transfer',
            bankAccount,
            transactionId,
            receiptImage,
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
            total,
            totalItems: total
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
// Get payment configuration
const getPaymentConfig = async (req, res) => {
    try {
        const config = await PaymentConfig_1.default.findOne({ isActive: true });
        if (!config) {
            return res.status(404).json({ message: 'Payment configuration not found' });
        }
        res.json({ config });
    }
    catch (error) {
        console.error('Get payment config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPaymentConfig = getPaymentConfig;
// Update coin purchase (user can edit or cancel)
const updateCoinPurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, bankAccount, transactionId, receiptImage, action } = req.body;
        const purchase = await CoinPurchase_1.default.findById(id);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }
        // Check if user owns this purchase
        if (purchase.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        // Check if purchase can be edited
        if (!purchase.canEdit || purchase.status !== 'pending') {
            return res.status(400).json({ message: 'This purchase cannot be modified' });
        }
        if (action === 'cancel') {
            purchase.status = 'cancelled';
            purchase.canEdit = false;
        }
        else {
            // Get payment config for recalculation
            const paymentConfig = await PaymentConfig_1.default.findOne({ isActive: true });
            if (!paymentConfig) {
                return res.status(400).json({ message: 'Payment configuration not found' });
            }
            if (amount < 1) {
                return res.status(400).json({ message: 'Minimum purchase amount is 1 TWD' });
            }
            purchase.amount = amount;
            purchase.coins = Math.floor(amount * paymentConfig.exchangeRate);
            purchase.bankAccount = bankAccount;
            purchase.transactionId = transactionId;
            purchase.receiptImage = receiptImage;
        }
        await purchase.save();
        res.json({
            message: action === 'cancel' ? 'Purchase cancelled successfully' : 'Purchase updated successfully',
            purchase
        });
    }
    catch (error) {
        console.error('Update coin purchase error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateCoinPurchase = updateCoinPurchase;
