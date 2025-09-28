"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportStatus = exports.getAllReports = exports.getUserReports = exports.createReport = void 0;
const Report_1 = __importDefault(require("../models/Report"));
const createReport = async (req, res) => {
    try {
        const { type, targetId, category, description } = req.body;
        const userId = req.user._id;
        // Validation
        if (!type || !category) {
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin báo lỗi'
            });
        }
        if (!['vocabulary', 'question', 'test'].includes(type)) {
            return res.status(400).json({
                message: 'Loại báo lỗi không hợp lệ'
            });
        }
        // Check if user exists
        const User = require('../models/User').default;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        // Create report
        const report = new Report_1.default({
            userId,
            type,
            targetId: targetId || 'unknown',
            category,
            description: description ? description.trim() : 'Không có mô tả'
        });
        await report.save();
        res.status(201).json({
            message: 'Đã gửi báo lỗi thành công! Cảm ơn bạn đã đóng góp.',
            report: {
                id: report._id,
                type: report.type,
                category: report.category,
                status: report.status,
                createdAt: report.createdAt
            }
        });
    }
    catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo báo lỗi' });
    }
};
exports.createReport = createReport;
const getUserReports = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;
        let query = { userId };
        if (status) {
            query.status = status;
        }
        const reports = await Report_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await Report_1.default.countDocuments(query);
        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            totalItems: total
        });
    }
    catch (error) {
        console.error('Get user reports error:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách báo lỗi' });
    }
};
exports.getUserReports = getUserReports;
const getAllReports = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;
        let query = {};
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        const reports = await Report_1.default.find(query)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await Report_1.default.countDocuments(query);
        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            totalItems: total
        });
    }
    catch (error) {
        console.error('Get all reports error:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách báo lỗi' });
    }
};
exports.getAllReports = getAllReports;
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        if (!['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
        const report = await Report_1.default.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Báo lỗi không tồn tại' });
        }
        report.status = status;
        if (adminNotes) {
            report.adminNotes = adminNotes;
        }
        await report.save();
        res.json({
            message: 'Cập nhật trạng thái báo lỗi thành công',
            report: {
                id: report._id,
                status: report.status,
                adminNotes: report.adminNotes
            }
        });
    }
    catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật báo lỗi' });
    }
};
exports.updateReportStatus = updateReportStatus;
