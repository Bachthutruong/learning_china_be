"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportStatus = exports.getAdminReports = exports.getReportById = exports.getReports = exports.createReport = void 0;
const Report_1 = __importDefault(require("../models/Report"));
const User_1 = __importDefault(require("../models/User"));
const express_validator_1 = require("express-validator");
const levelUtils_1 = require("../utils/levelUtils");
const createReport = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { type, targetId, category, description } = req.body;
        const report = new Report_1.default({
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
    }
    catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createReport = createReport;
const getReports = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        let query = { userId: req.user._id };
        if (status) {
            query.status = status;
        }
        const reports = await Report_1.default.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await Report_1.default.countDocuments(query);
        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    }
    catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getReports = getReports;
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report_1.default.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.json(report);
    }
    catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getReportById = getReportById;
const getAdminReports = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        const reports = await Report_1.default.find(query)
            .populate('userId', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await Report_1.default.countDocuments(query);
        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    }
    catch (error) {
        console.error('Get admin reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAdminReports = getAdminReports;
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rewardExperience, rewardCoins, adminNotes } = req.body;
        const report = await Report_1.default.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        report.status = status;
        if (rewardExperience)
            report.rewardExperience = rewardExperience;
        if (rewardCoins)
            report.rewardCoins = rewardCoins;
        if (adminNotes)
            report.adminNotes = adminNotes;
        await report.save();
        // If approved, give rewards to user
        if (status === 'approved' && (rewardExperience || rewardCoins)) {
            const user = await User_1.default.findById(report.userId);
            if (user) {
                console.log(`Giving rewards to user ${user.name}: +${rewardExperience} XP, +${rewardCoins} coins`);
                console.log(`User current stats: Level ${user.level}, ${user.experience} XP, ${user.coins} coins`);
                if (rewardExperience)
                    user.experience += rewardExperience;
                if (rewardCoins)
                    user.coins += rewardCoins;
                await user.save();
                console.log(`User updated stats: Level ${user.level}, ${user.experience} XP, ${user.coins} coins`);
                // Check for level up using dynamic level requirements
                const levelResult = await (0, levelUtils_1.checkAndUpdateUserLevel)(user._id.toString());
                if (levelResult.leveledUp) {
                    console.log(`User ${user.name} leveled up to level ${levelResult.newLevel}!`);
                }
            }
        }
        res.json({
            message: 'Report status updated successfully',
            report
        });
    }
    catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateReportStatus = updateReportStatus;
//# sourceMappingURL=reportController.js.map