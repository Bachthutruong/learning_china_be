"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeLearningValidation = exports.userVocabularyValidation = exports.personalTopicValidation = exports.getVocabularySuggestions = exports.completeVocabularyLearning = exports.getVocabularyQuiz = exports.addUserVocabulary = exports.getUserVocabularies = exports.createPersonalTopic = exports.getPersonalTopics = exports.getVocabularies = void 0;
const express_validator_1 = require("express-validator");
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const PersonalTopic_1 = require("../models/PersonalTopic");
const UserVocabulary_1 = require("../models/UserVocabulary");
const User_1 = __importDefault(require("../models/User"));
const levelUtils_1 = require("../utils/levelUtils");
// Get vocabularies with search and topic filters
const getVocabularies = async (req, res) => {
    try {
        const { search, topic, limit = 50, page = 1 } = req.query;
        const userId = req.user?._id;
        let query = {};
        // Search filter
        if (search) {
            query.$or = [
                { word: { $regex: search, $options: 'i' } },
                { meaning: { $regex: search, $options: 'i' } },
                { pronunciation: { $regex: search, $options: 'i' } }
            ];
        }
        // Topic filter
        if (topic && topic !== 'all') {
            query.topics = { $in: [topic] };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const vocabularies = await Vocabulary_1.default.find(query)
            .limit(Number(limit))
            .skip(skip)
            .sort({ createdAt: -1 });
        // Get total count
        const total = await Vocabulary_1.default.countDocuments(query);
        res.json({
            vocabularies,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page)
        });
    }
    catch (error) {
        console.error('Error fetching vocabularies:', error);
        res.status(500).json({ message: 'Không thể tải danh sách từ vựng' });
    }
};
exports.getVocabularies = getVocabularies;
// Get personal topics for user
const getPersonalTopics = async (req, res) => {
    try {
        const userId = req.user?._id;
        const topics = await PersonalTopic_1.PersonalTopic.find({ userId })
            .sort({ createdAt: -1 });
        // Get vocabulary count for each topic
        const topicsWithCount = await Promise.all(topics.map(async (topic) => {
            const count = await UserVocabulary_1.UserVocabulary.countDocuments({
                userId,
                personalTopicId: topic._id
            });
            return {
                ...topic.toObject(),
                vocabularyCount: count
            };
        }));
        res.json({ topics: topicsWithCount });
    }
    catch (error) {
        console.error('Error fetching personal topics:', error);
        res.status(500).json({ message: 'Không thể tải danh sách chủ đề cá nhân' });
    }
};
exports.getPersonalTopics = getPersonalTopics;
// Create personal topic
const createPersonalTopic = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user?._id;
        const { name, description } = req.body;
        // Check if topic with same name already exists for user
        const existingTopic = await PersonalTopic_1.PersonalTopic.findOne({ userId, name });
        if (existingTopic) {
            return res.status(400).json({ message: 'Chủ đề với tên này đã tồn tại' });
        }
        const topic = new PersonalTopic_1.PersonalTopic({
            name,
            description,
            userId
        });
        await topic.save();
        res.status(201).json({
            message: 'Tạo chủ đề cá nhân thành công',
            topic
        });
    }
    catch (error) {
        console.error('Error creating personal topic:', error);
        res.status(500).json({ message: 'Không thể tạo chủ đề cá nhân' });
    }
};
exports.createPersonalTopic = createPersonalTopic;
// Get user vocabularies with filters
const getUserVocabularies = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { status, personalTopicId } = req.query;
        let query = { userId };
        if (status && status !== 'all') {
            query.status = status;
        }
        if (personalTopicId && personalTopicId !== 'all') {
            query.personalTopicId = personalTopicId;
        }
        const userVocabularies = await UserVocabulary_1.UserVocabulary.find(query)
            .populate('vocabularyId', 'word pronunciation meaning partOfSpeech level topics examples synonyms antonyms audio audioUrl questions')
            .populate('personalTopicId', 'name description')
            .sort({ updatedAt: -1 });
        res.json({ userVocabularies });
    }
    catch (error) {
        console.error('Error fetching user vocabularies:', error);
        res.status(500).json({ message: 'Không thể tải danh sách từ vựng của người dùng' });
    }
};
exports.getUserVocabularies = getUserVocabularies;
// Add vocabulary to user's list
const addUserVocabulary = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user?._id;
        const { vocabularyId, status, personalTopicId } = req.body;
        // Check if vocabulary exists
        const vocabulary = await Vocabulary_1.default.findById(vocabularyId);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Từ vựng không tồn tại' });
        }
        // Check if personal topic exists (if provided)
        if (personalTopicId) {
            const personalTopic = await PersonalTopic_1.PersonalTopic.findOne({ _id: personalTopicId, userId });
            if (!personalTopic) {
                return res.status(404).json({ message: 'Chủ đề cá nhân không tồn tại' });
            }
        }
        // Check if user vocabulary already exists
        const existingUserVocab = await UserVocabulary_1.UserVocabulary.findOne({ userId, vocabularyId });
        if (existingUserVocab) {
            // Update existing
            existingUserVocab.status = status;
            existingUserVocab.personalTopicId = personalTopicId;
            if (status === 'learned') {
                existingUserVocab.learnedAt = new Date();
            }
            await existingUserVocab.save();
        }
        else {
            // Create new
            const userVocabulary = new UserVocabulary_1.UserVocabulary({
                userId,
                vocabularyId,
                status,
                personalTopicId,
                learnedAt: status === 'learned' ? new Date() : undefined
            });
            await userVocabulary.save();
        }
        res.json({
            message: 'Đã thêm từ vựng vào danh sách',
            status
        });
    }
    catch (error) {
        console.error('Error adding user vocabulary:', error);
        res.status(500).json({ message: 'Không thể thêm từ vựng' });
    }
};
exports.addUserVocabulary = addUserVocabulary;
// Get quiz questions for vocabulary
const getVocabularyQuiz = async (req, res) => {
    try {
        const { vocabularyId } = req.params;
        const vocabulary = await Vocabulary_1.default.findById(vocabularyId);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Từ vựng không tồn tại' });
        }
        const questions = vocabulary.questions || [];
        res.json({ questions });
    }
    catch (error) {
        console.error('Error fetching vocabulary quiz:', error);
        res.status(500).json({ message: 'Không thể tải câu hỏi khảo bài' });
    }
};
exports.getVocabularyQuiz = getVocabularyQuiz;
// Complete vocabulary learning (with rewards)
const completeVocabularyLearning = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user?._id;
        const { vocabularyId, personalTopicId, quizScore } = req.body;
        // Get user
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        // Check if vocabulary exists
        const vocabulary = await Vocabulary_1.default.findById(vocabularyId);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Từ vựng không tồn tại' });
        }
        // Update or create user vocabulary
        const userVocabulary = await UserVocabulary_1.UserVocabulary.findOneAndUpdate({ userId, vocabularyId }, {
            status: 'learned',
            personalTopicId,
            learnedAt: new Date()
        }, { upsert: true, new: true });
        // Check if vocabulary was already learned before
        const wasAlreadyLearned = userVocabulary.status === 'learned' && userVocabulary.learnedAt;
        let rewards = { experience: 0, coins: 0 };
        if (wasAlreadyLearned) {
            // Already learned vocabulary: 1 XP, 1 coin
            rewards = { experience: 1, coins: 1 };
        }
        else {
            // New vocabulary: 10 XP, 10 coins
            rewards = { experience: 10, coins: 10 };
        }
        user.experience += rewards.experience;
        user.coins += rewards.coins;
        await user.save();
        // Check for level up
        const levelResult = await (0, levelUtils_1.checkAndUpdateUserLevel)(user._id.toString());
        res.json({
            message: wasAlreadyLearned
                ? `Ôn tập từ vựng thành công! Nhận được ${rewards.experience} XP + ${rewards.coins} xu!`
                : `Học từ vựng mới thành công! Nhận được ${rewards.experience} XP + ${rewards.coins} xu!`,
            rewards,
            levelResult,
            userVocabulary,
            isNewVocabulary: !wasAlreadyLearned
        });
    }
    catch (error) {
        console.error('Error completing vocabulary learning:', error);
        res.status(500).json({ message: 'Không thể hoàn thành học từ vựng' });
    }
};
exports.completeVocabularyLearning = completeVocabularyLearning;
// Get vocabulary suggestions based on topic
const getVocabularySuggestions = async (req, res) => {
    try {
        const { topic, limit = 10 } = req.query;
        const userId = req.user?._id;
        let query = {};
        if (topic && topic !== 'all') {
            query.topics = { $in: [topic] };
        }
        // Get vocabularies user hasn't learned yet
        const userVocabularies = await UserVocabulary_1.UserVocabulary.find({ userId }).select('vocabularyId');
        const learnedVocabularyIds = userVocabularies.map((uv) => uv.vocabularyId);
        if (learnedVocabularyIds.length > 0) {
            query._id = { $nin: learnedVocabularyIds };
        }
        const vocabularies = await Vocabulary_1.default.find(query)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        res.json({ vocabularies });
    }
    catch (error) {
        console.error('Error fetching vocabulary suggestions:', error);
        res.status(500).json({ message: 'Không thể tải gợi ý từ vựng' });
    }
};
exports.getVocabularySuggestions = getVocabularySuggestions;
// Validation rules
exports.personalTopicValidation = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Tên chủ đề là bắt buộc'),
    (0, express_validator_1.body)('description').optional().trim()
];
exports.userVocabularyValidation = [
    (0, express_validator_1.body)('vocabularyId').notEmpty().withMessage('ID từ vựng là bắt buộc'),
    (0, express_validator_1.body)('status').isIn(['learned', 'studying', 'skipped']).withMessage('Trạng thái không hợp lệ'),
    (0, express_validator_1.body)('personalTopicId').optional().isMongoId().withMessage('ID chủ đề cá nhân không hợp lệ')
];
exports.completeLearningValidation = [
    (0, express_validator_1.body)('vocabularyId').notEmpty().withMessage('ID từ vựng là bắt buộc'),
    (0, express_validator_1.body)('quizScore').isNumeric().withMessage('Điểm khảo bài phải là số'),
    (0, express_validator_1.body)('personalTopicId').optional().isMongoId().withMessage('ID chủ đề cá nhân không hợp lệ')
];
//# sourceMappingURL=vocabularyLearningController.js.map