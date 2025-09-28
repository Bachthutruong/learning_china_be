"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.recalculateLevel = exports.forceRecalculateAllLevels = exports.getProfile = exports.getUserLearningStats = exports.getUserAchievements = exports.getAllUsers = exports.getLeaderboard = exports.getPaymentHistory = exports.purchaseCoins = exports.getUserStats = exports.checkIn = void 0;
const User_1 = __importDefault(require("../models/User"));
const Report_1 = __importDefault(require("../models/Report"));
const Payment_1 = __importDefault(require("../models/Payment"));
const levelUtils_1 = require("../utils/levelUtils");
const checkIn = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
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
        }
        else {
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
        }
        else if (user.streak === 30) {
            milestoneBonus = 200; // 1 month streak
        }
        else if (user.streak === 100) {
            milestoneBonus = 500; // 100 day streak
        }
        const finalExperience = totalExperience + milestoneBonus;
        const finalCoins = totalCoins + Math.floor(milestoneBonus / 2);
        user.experience += finalExperience;
        user.coins += finalCoins;
        user.lastCheckIn = today;
        await user.save();
        // Check for level up using dynamic level requirements
        const levelResult = await (0, levelUtils_1.checkAndUpdateUserLevel)(user._id.toString());
        res.json({
            message: 'Check-in successful',
            rewards: {
                experience: finalExperience,
                coins: finalCoins,
                streak: user.streak,
                milestoneBonus: milestoneBonus > 0 ? milestoneBonus : undefined
            },
            user: {
                level: levelResult.level,
                experience: user.experience,
                coins: user.coins,
                streak: user.streak
            },
            leveledUp: levelResult.leveledUp,
            newLevel: levelResult.newLevel
        });
    }
    catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.checkIn = checkIn;
const getUserStats = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Get user's reports
        const reports = await Report_1.default.find({ userId: req.user._id });
        const pendingReports = reports.filter(r => r.status === 'pending').length;
        const approvedReports = reports.filter(r => r.status === 'resolved').length;
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
    }
    catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserStats = getUserStats;
const purchaseCoins = async (req, res) => {
    try {
        const { amount, paymentMethod, currency = 'VND' } = req.body;
        const user = await User_1.default.findById(req.user._id);
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
        const payment = new Payment_1.default({
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
    }
    catch (error) {
        console.error('Purchase coins error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.purchaseCoins = purchaseCoins;
const getPaymentHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const payments = await Payment_1.default.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum);
        const total = await Payment_1.default.countDocuments({ userId: user._id });
        res.json({
            payments,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });
    }
    catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPaymentHistory = getPaymentHistory;
const getLeaderboard = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const users = await User_1.default.find()
            .select('name level experience coins')
            .sort({ experience: -1 })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum);
        const total = await User_1.default.countDocuments();
        res.json({
            leaderboard: users,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });
    }
    catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getLeaderboard = getLeaderboard;
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const users = await User_1.default.find(query)
            .select('name email level experience coins role streak createdAt')
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum);
        const total = await User_1.default.countDocuments(query);
        res.json({
            users,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            total
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserAchievements = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Mock achievements based on user stats
        const achievements = [
            {
                id: 'first_login',
                name: 'First Steps',
                description: 'Welcome to the platform!',
                icon: '🎉',
                unlocked: true,
                unlockedAt: user.createdAt || new Date()
            },
            {
                id: 'level_2',
                name: 'Rising Star',
                description: 'Reach level 2',
                icon: '⭐',
                unlocked: user.level >= 2,
                unlockedAt: user.level >= 2 ? new Date() : null
            },
            {
                id: 'streak_7',
                name: 'Week Warrior',
                description: '7-day check-in streak',
                icon: '🔥',
                unlocked: user.streak >= 7,
                unlockedAt: user.streak >= 7 ? new Date() : null
            },
            {
                id: 'coins_100',
                name: 'Coin Collector',
                description: 'Earn 100 coins',
                icon: '💰',
                unlocked: user.coins >= 100,
                unlockedAt: user.coins >= 100 ? new Date() : null
            }
        ];
        res.json({ achievements });
    }
    catch (error) {
        console.error('Get user achievements error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserAchievements = getUserAchievements;
const getUserLearningStats = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Mock learning stats
        const stats = {
            totalStudyTime: Math.floor(Math.random() * 1000) + 100, // minutes
            vocabularyLearned: user.learnedVocabulary?.length || 0,
            testsCompleted: Math.floor(Math.random() * 50) + 10,
            currentStreak: user.streak,
            longestStreak: Math.max(user.streak, Math.floor(Math.random() * 30) + 5),
            weeklyGoal: 7,
            weeklyProgress: Math.min(user.streak, 7),
            favoriteTopic: 'Gia đình',
            improvementRate: Math.floor(Math.random() * 20) + 5 // percentage
        };
        res.json({ stats });
    }
    catch (error) {
        console.error('Get user learning stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserLearningStats = getUserLearningStats;
const getProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Get next level requirements
        const levelInfo = await (0, levelUtils_1.getNextLevelRequirements)(user._id.toString());
        res.json({
            user: {
                ...user.toObject(),
                levelInfo
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProfile = getProfile;
const forceRecalculateAllLevels = async (req, res) => {
    try {
        const users = await User_1.default.find({});
        let updatedCount = 0;
        for (const user of users) {
            const levelResult = await (0, levelUtils_1.checkAndUpdateUserLevel)(user._id.toString());
            if (levelResult.leveledUp) {
                updatedCount++;
            }
        }
        res.json({
            message: `Recalculated levels for ${users.length} users`,
            updatedCount
        });
    }
    catch (error) {
        console.error('Force recalculate all levels error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.forceRecalculateAllLevels = forceRecalculateAllLevels;
const recalculateLevel = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Get all levels for debugging
        const Level = require('../models/Level').default;
        const allLevels = await Level.find({}).sort({ number: 1 });
        console.log('User experience:', user.experience);
        console.log('Current user level:', user.level);
        console.log('Available levels:', allLevels.map((l) => ({ number: l.number, requiredExperience: l.requiredExperience, name: l.name })));
        // Recalculate level based on current experience
        const levelResult = await (0, levelUtils_1.checkAndUpdateUserLevel)(user._id.toString());
        const levelInfo = await (0, levelUtils_1.getNextLevelRequirements)(user._id.toString());
        console.log('Level result:', levelResult);
        res.json({
            message: 'Level recalculated successfully',
            user: {
                level: levelResult.level,
                experience: user.experience,
                coins: user.coins
            },
            leveledUp: levelResult.leveledUp,
            newLevel: levelResult.newLevel,
            levelInfo,
            debug: {
                allLevels: allLevels.map((l) => ({ number: l.number, requiredExperience: l.requiredExperience, name: l.name })),
                userExperience: user.experience,
                previousLevel: user.level
            }
        });
    }
    catch (error) {
        console.error('Recalculate level error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.recalculateLevel = recalculateLevel;
// Admin functions for user management
const createUser = async (req, res) => {
    try {
        const { name, email, password, level = 1, coins = 0, role = 'user' } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Create new user
        const user = new User_1.default({
            name,
            email,
            password,
            level: parseInt(level),
            coins: parseInt(coins),
            role,
            experience: 0,
            streak: 0
        });
        await user.save();
        res.status(201).json({
            message: 'User created successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                level: user.level,
                coins: user.coins,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, level, coins, role, password } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (level !== undefined)
            updateData.level = parseInt(level);
        if (coins !== undefined)
            updateData.coins = parseInt(coins);
        if (role)
            updateData.role = role;
        if (password)
            updateData.password = password;
        const user = await User_1.default.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            message: 'User updated successfully',
            user
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.default.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
