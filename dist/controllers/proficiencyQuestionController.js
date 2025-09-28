"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomProficiencyQuestions = exports.deleteProficiencyQuestion = exports.updateProficiencyQuestion = exports.createProficiencyQuestion = exports.getProficiencyQuestionById = exports.getAllProficiencyQuestions = void 0;
const express_validator_1 = require("express-validator");
const ProficiencyQuestion_1 = __importDefault(require("../models/ProficiencyQuestion"));
// Get all proficiency questions with pagination, search, and filtering
const getAllProficiencyQuestions = async (req, res) => {
    try {
        const { level, questionType, search = '', limit = 10, offset = 0 } = req.query;
        // Build filter object
        let filter = {};
        // Filter by level
        if (level && level !== '') {
            filter.level = parseInt(level);
        }
        // Filter by question type
        if (questionType) {
            filter.questionType = questionType;
        }
        // Search in question text
        if (search && search !== '') {
            filter.question = { $regex: search, $options: 'i' };
        }
        // Get total count for pagination
        const total = await ProficiencyQuestion_1.default.countDocuments(filter);
        // Get paginated results
        const questions = await ProficiencyQuestion_1.default.find(filter)
            .sort({ level: 1, createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));
        res.json({
            success: true,
            questions,
            total,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            totalPages: Math.ceil(total / parseInt(limit)),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
    catch (error) {
        console.error('Get proficiency questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllProficiencyQuestions = getAllProficiencyQuestions;
// Get proficiency question by ID
const getProficiencyQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await ProficiencyQuestion_1.default.findById(id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({
            success: true,
            question
        });
    }
    catch (error) {
        console.error('Get proficiency question error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProficiencyQuestionById = getProficiencyQuestionById;
// Create new proficiency question
const createProficiencyQuestion = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { question, options, correctAnswer, explanation, level, questionType } = req.body;
        // Validate that we have at least 2 options
        const validOptions = options.filter((opt) => opt.trim());
        if (validOptions.length < 2) {
            return res.status(400).json({ message: 'Cần ít nhất 2 phương án' });
        }
        // Validate correct answers
        if (!correctAnswer || correctAnswer.length === 0) {
            return res.status(400).json({ message: 'Cần ít nhất một đáp án đúng' });
        }
        // Validate correct answer indices
        const maxIndex = validOptions.length - 1;
        const invalidAnswers = correctAnswer.filter((answer) => answer < 0 || answer > maxIndex);
        if (invalidAnswers.length > 0) {
            return res.status(400).json({ message: 'Đáp án đúng không hợp lệ' });
        }
        const proficiencyQuestion = new ProficiencyQuestion_1.default({
            question: question.trim(),
            options: validOptions,
            correctAnswer,
            explanation: explanation?.trim() || '',
            level: parseInt(level),
            questionType
        });
        await proficiencyQuestion.save();
        res.status(201).json({
            success: true,
            message: 'Tạo câu hỏi thành công',
            question: proficiencyQuestion
        });
    }
    catch (error) {
        console.error('Create proficiency question error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createProficiencyQuestion = createProficiencyQuestion;
// Update proficiency question
const updateProficiencyQuestion = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const { question, options, correctAnswer, explanation, level, questionType } = req.body;
        // Validate that we have at least 2 options
        const validOptions = options.filter((opt) => opt.trim());
        if (validOptions.length < 2) {
            return res.status(400).json({ message: 'Cần ít nhất 2 phương án' });
        }
        // Validate correct answers
        if (!correctAnswer || correctAnswer.length === 0) {
            return res.status(400).json({ message: 'Cần ít nhất một đáp án đúng' });
        }
        // Validate correct answer indices
        const maxIndex = validOptions.length - 1;
        const invalidAnswers = correctAnswer.filter((answer) => answer < 0 || answer > maxIndex);
        if (invalidAnswers.length > 0) {
            return res.status(400).json({ message: 'Đáp án đúng không hợp lệ' });
        }
        const proficiencyQuestion = await ProficiencyQuestion_1.default.findByIdAndUpdate(id, {
            question: question.trim(),
            options: validOptions,
            correctAnswer,
            explanation: explanation?.trim() || '',
            level: parseInt(level),
            questionType
        }, { new: true, runValidators: true });
        if (!proficiencyQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({
            success: true,
            message: 'Cập nhật câu hỏi thành công',
            question: proficiencyQuestion
        });
    }
    catch (error) {
        console.error('Update proficiency question error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProficiencyQuestion = updateProficiencyQuestion;
// Delete proficiency question
const deleteProficiencyQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const proficiencyQuestion = await ProficiencyQuestion_1.default.findByIdAndDelete(id);
        if (!proficiencyQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json({
            success: true,
            message: 'Xóa câu hỏi thành công'
        });
    }
    catch (error) {
        console.error('Delete proficiency question error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteProficiencyQuestion = deleteProficiencyQuestion;
// Get random proficiency questions by level
const getRandomProficiencyQuestions = async (req, res) => {
    try {
        const { level, count = 10 } = req.query;
        if (!level) {
            return res.status(400).json({ message: 'Level is required' });
        }
        const questions = await ProficiencyQuestion_1.default.aggregate([
            { $match: { level: parseInt(level) } },
            { $sample: { size: parseInt(count) } }
        ]);
        res.json({
            success: true,
            questions
        });
    }
    catch (error) {
        console.error('Get random proficiency questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRandomProficiencyQuestions = getRandomProficiencyQuestions;
