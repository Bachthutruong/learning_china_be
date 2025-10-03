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
        const { page = 1, limit = 20, status, type, search } = req.query;
        let query = {};
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        if (search) {
            const s = String(search).trim();
            query.$or = [
                { category: { $regex: s, $options: 'i' } },
                { description: { $regex: s, $options: 'i' } },
                { targetId: { $regex: s, $options: 'i' } }
            ];
        }
        const reports = await Report_1.default.find(query)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        // Enrich with target entity summary so admin sees cụ thể nội dung
        const [Vocabulary, Question] = [
            require('../models/Vocabulary').default,
            require('../models/Question').default
        ];
        const enrichedReports = await Promise.all(reports.map(async (r) => {
            let targetSummary = null;
            try {
                if (r.type === 'vocabulary' && r.targetId) {
                    const v = await Vocabulary.findById(r.targetId).select('word pronunciation meaning level topics');
                    if (v) {
                        targetSummary = {
                            word: v.word,
                            pronunciation: v.pronunciation,
                            meaning: v.meaning,
                            level: v.level,
                            topics: v.topics
                        };
                    }
                }
                else if (r.type === 'question' && r.targetId) {
                    const q = await Question.findById(r.targetId).select('question level questionType');
                    if (q) {
                        targetSummary = {
                            question: q.question,
                            level: q.level,
                            questionType: q.questionType
                        };
                    }
                }
            }
            catch (e) {
                // ignore enrich failure, keep baseline report
            }
            return {
                id: String(r._id),
                _id: String(r._id),
                type: r.type,
                targetId: r.targetId,
                category: r.category,
                description: r.description,
                status: r.status,
                createdAt: r.createdAt,
                user: r.userId ? {
                    _id: String(r.userId._id || ''),
                    email: r.userId.email,
                    username: r.userId.username,
                    name: r.userId.name
                } : undefined,
                targetSummary
            };
        }));
        const total = await Report_1.default.countDocuments(query);
        res.json({
            reports: enrichedReports,
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
        const normalizedStatus = status === 'approved' ? 'reviewed' : status;
        if (!['pending', 'reviewed', 'resolved', 'rejected'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
        const report = await Report_1.default.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Báo lỗi không tồn tại' });
        }
        report.status = normalizedStatus;
        if (adminNotes) {
            report.adminNotes = adminNotes;
        }
        await report.save();
        // Fixed reward when a report is approved/reviewed
        if (normalizedStatus === 'reviewed') {
            try {
                const User = require('../models/User').default;
                const user = await User.findById(report.userId);
                if (user) {
                    user.experience += 5;
                    user.coins += 5;
                    await user.save();
                }
            }
            catch (e) {
                // non-blocking
            }
        }
        res.json({
            message: 'Cập nhật trạng thái báo lỗi thành công',
            report: {
                id: String(report._id),
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
