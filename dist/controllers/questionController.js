"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.updateQuestion = exports.createQuestion = exports.listQuestions = exports.getProgressSummary = exports.submitAnswer = exports.getNextQuestions = void 0;
const Question_1 = __importDefault(require("../models/Question"));
const User_1 = __importDefault(require("../models/User"));
const UserQuestionProgress_1 = __importDefault(require("../models/UserQuestionProgress"));
const levelUtils_1 = require("../utils/levelUtils");
const express_validator_1 = require("express-validator");
// Get next questions for user based on level and progress
const getNextQuestions = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // First fetch incorrect or unseen questions at user's level
        const progressed = await UserQuestionProgress_1.default.find({ userId: user._id }).select('questionId correct');
        const incorrectIds = new Set(progressed.filter(p => !p.correct).map(p => String(p.questionId)));
        const seenIds = new Set(progressed.map(p => String(p.questionId)));
        const incorrectQuestions = await Question_1.default.find({ _id: { $in: Array.from(incorrectIds) }, level: user.level })
            .limit(Number(limit));
        let remaining = Number(limit) - incorrectQuestions.length;
        const unseenQuestions = remaining > 0
            ? await Question_1.default.find({ level: user.level, _id: { $nin: Array.from(seenIds) } }).limit(remaining)
            : [];
        remaining = Number(limit) - incorrectQuestions.length - unseenQuestions.length;
        // If none left, show other level questions starting from 1..6 as fallback
        const fallbackQuestions = remaining > 0
            ? await Question_1.default.find({ _id: { $nin: Array.from(seenIds) } }).sort({ level: 1 }).limit(remaining)
            : [];
        const questions = [...incorrectQuestions, ...unseenQuestions, ...fallbackQuestions];
        res.json({ questions, level: user.level });
    }
    catch (error) {
        console.error('getNextQuestions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getNextQuestions = getNextQuestions;
// Submit answer for a question and update progress + rewards
const submitAnswer = async (req, res) => {
    try {
        const { questionId, answer } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const question = await Question_1.default.findById(questionId);
        if (!question)
            return res.status(404).json({ message: 'Question not found' });
        const isCorrect = Array.isArray(question.correctAnswer)
            ? JSON.stringify(question.correctAnswer) === JSON.stringify(answer)
            : question.correctAnswer === answer;
        const progress = await UserQuestionProgress_1.default.findOneAndUpdate({ userId: user._id, questionId }, {
            $set: { correct: isCorrect, lastAttemptAt: new Date() },
            $inc: { attempts: 1 }
        }, { upsert: true, new: true });
        // Reward simple XP when correct
        if (isCorrect) {
            user.experience += 5;
            await user.save();
            // Check for level up using dynamic level requirements
            const levelResult = await (0, levelUtils_1.checkAndUpdateUserLevel)(user._id.toString());
        }
        // Get updated user data
        const updatedUser = await User_1.default.findById(user._id);
        res.json({
            correct: isCorrect,
            explanation: question.explanation || null,
            user: {
                level: updatedUser?.level || user.level,
                experience: updatedUser?.experience || user.experience
            }
        });
    }
    catch (error) {
        console.error('submitAnswer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.submitAnswer = submitAnswer;
const getProgressSummary = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const totalAtLevel = await Question_1.default.countDocuments({ level: user.level });
        const correctAtLevel = await UserQuestionProgress_1.default.countDocuments({ userId: user._id, correct: true });
        res.json({ level: user.level, totalAtLevel, correctAtLevel });
    }
    catch (error) {
        console.error('getProgressSummary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProgressSummary = getProgressSummary;
// Admin: CRUD Question Bank
const listQuestions = async (req, res) => {
    try {
        const { level, q = '', page = 1, limit = 20 } = req.query;
        const query = {};
        if (level)
            query.level = Number(level);
        if (q)
            query.question = { $regex: q, $options: 'i' };
        const items = await Question_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await Question_1.default.countDocuments(query);
        res.json({ items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    }
    catch (error) {
        console.error('listQuestions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.listQuestions = listQuestions;
const createQuestion = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const q = new Question_1.default(req.body);
        await q.save();
        res.status(201).json({ message: 'Question created', question: q });
    }
    catch (error) {
        console.error('createQuestion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createQuestion = createQuestion;
const updateQuestion = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });
        const { id } = req.params;
        const q = await Question_1.default.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!q)
            return res.status(404).json({ message: 'Question not found' });
        res.json({ message: 'Question updated', question: q });
    }
    catch (error) {
        console.error('updateQuestion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateQuestion = updateQuestion;
const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const q = await Question_1.default.findByIdAndDelete(id);
        if (!q)
            return res.status(404).json({ message: 'Question not found' });
        res.json({ message: 'Question deleted' });
    }
    catch (error) {
        console.error('deleteQuestion error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteQuestion = deleteQuestion;
//# sourceMappingURL=questionController.js.map