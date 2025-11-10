"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLearnersByVocabularyStats = exports.getMonthlyVocabularyLearners = exports.getVocabulariesByTopic = exports.getLearnedVocabulariesForQuiz = exports.addVocabulariesToTopic = exports.getAvailableVocabularies = exports.completeLearningValidation = exports.userVocabularyValidation = exports.personalTopicValidation = exports.getVocabularySuggestions = exports.completeVocabularyLearning = exports.getVocabularyQuiz = exports.addUserVocabulary = exports.getUserVocabularies = exports.createPersonalTopic = exports.getPersonalTopics = exports.getVocabularies = void 0;
const express_validator_1 = require("express-validator");
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const PersonalTopic_1 = require("../models/PersonalTopic");
const UserVocabulary_1 = require("../models/UserVocabulary");
const User_1 = __importDefault(require("../models/User"));
const levelUtils_1 = require("../utils/levelUtils");
const mongoose_1 = __importDefault(require("mongoose"));
// Get vocabularies with search and topic filters
const getVocabularies = async (req, res) => {
    try {
        const { search, topic, limit = 50, page = 1, excludeLearned = 'true' } = req.query;
        const userId = req.user?._id;
        let query = {};
        // Search filter
        if (search) {
            query.$or = [
                { word: { $regex: search, $options: 'i' } },
                { meaning: { $regex: search, $options: 'i' } },
                { pinyin: { $regex: search, $options: 'i' } },
                { zhuyin: { $regex: search, $options: 'i' } }
            ];
        }
        // Topic filter
        if (topic && topic !== 'all') {
            query.topics = { $in: [topic] };
        }
        // Exclude vocabularies that the user already learned (optional)
        if (excludeLearned !== 'false' && userId) {
            const learnedDocs = await UserVocabulary_1.UserVocabulary.find({ userId, status: 'learned' }).select('vocabularyId');
            const learnedIds = learnedDocs.map((d) => d.vocabularyId);
            if (learnedIds.length > 0) {
                query._id = { $nin: learnedIds };
            }
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
            // Count learned vocabularies in this topic that have at least 1 question
            const learnedMappings = await UserVocabulary_1.UserVocabulary.find({
                userId,
                personalTopicId: topic._id,
                status: 'learned'
            }).select('vocabularyId');
            const learnedIds = learnedMappings.map((m) => m.vocabularyId);
            let learnedCount = 0;
            if (learnedIds.length > 0) {
                learnedCount = await Vocabulary_1.default.countDocuments({
                    _id: { $in: learnedIds },
                    'questions.0': { $exists: true }
                });
            }
            return {
                ...topic.toObject(),
                vocabularyCount: count,
                learnedCount
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
        let { vocabularyId, status, personalTopicId } = req.body;
        // Check if vocabulary exists
        const vocabulary = await Vocabulary_1.default.findById(vocabularyId);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Từ vựng không tồn tại' });
        }
        // If personalTopicId missing, infer the most recent mapping for this user+vocab
        if (!personalTopicId) {
            const latestMapping = await UserVocabulary_1.UserVocabulary.findOne({ userId, vocabularyId })
                .sort({ updatedAt: -1 })
                .select('personalTopicId');
            if (latestMapping?.personalTopicId) {
                personalTopicId = latestMapping.personalTopicId;
            }
        }
        // Check if personal topic exists (if provided or inferred)
        if (personalTopicId) {
            const personalTopic = await PersonalTopic_1.PersonalTopic.findOne({ _id: personalTopicId, userId });
            if (!personalTopic) {
                return res.status(404).json({ message: 'Chủ đề cá nhân không tồn tại' });
            }
        }
        // Only update the document within the SAME topic if it exists.
        // This avoids moving a vocabulary from another topic into this one and
        // accidentally violating the unique (userId, vocabularyId, personalTopicId) index.
        let isNewlyLearned = false;
        // Always update the mapping within the provided personalTopicId
        const existingInThisTopic = await UserVocabulary_1.UserVocabulary.findOne({ userId, vocabularyId, personalTopicId });
        if (existingInThisTopic) {
            const wasLearned = existingInThisTopic.status === 'learned';
            existingInThisTopic.status = status;
            if (status === 'learned' && !wasLearned) {
                existingInThisTopic.learnedAt = new Date();
                isNewlyLearned = true;
            }
            await existingInThisTopic.save();
        }
        else {
            // Create a new mapping for this topic only
            const userVocabulary = new UserVocabulary_1.UserVocabulary({
                userId,
                vocabularyId,
                status,
                personalTopicId,
                learnedAt: status === 'learned' ? new Date() : undefined
            });
            await userVocabulary.save();
            if (status === 'learned') {
                isNewlyLearned = true;
            }
        }
        // Cộng xu và exp nếu học thuộc thành công
        if (status === 'learned') {
            const user = await User_1.default.findById(userId);
            if (user) {
                let expGain, coinGain;
                if (isNewlyLearned) {
                    // Từ mới chưa thuộc lần nào: +10 EXP, +10 xu
                    expGain = 10;
                    coinGain = 10;
                }
                else {
                    // Từ đã thuộc rồi, học lại: +1 EXP, +1 xu
                    expGain = 1;
                    coinGain = 1;
                }
                user.experience += expGain;
                user.coins += coinGain;
                // Kiểm tra và cập nhật level
                const levelUpResult = await (0, levelUtils_1.checkAndUpdateUserLevel)(userId);
                await user.save();
                res.json({
                    message: 'Đã học thuộc từ vựng thành công!',
                    status,
                    rewards: {
                        exp: expGain,
                        coins: coinGain,
                        levelUp: levelUpResult.leveledUp,
                        newLevel: levelUpResult.newLevel,
                        isNewlyLearned
                    }
                });
                return;
            }
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
        // Check prior state before updating to avoid always treating as already learned
        const existingUserVocab = await UserVocabulary_1.UserVocabulary.findOne({ userId, vocabularyId });
        const wasAlreadyLearned = !!(existingUserVocab && existingUserVocab.status === 'learned' && existingUserVocab.learnedAt);
        // Update or create user vocabulary
        const userVocabulary = await UserVocabulary_1.UserVocabulary.findOneAndUpdate({ userId, vocabularyId }, {
            status: 'learned',
            personalTopicId,
            learnedAt: new Date()
        }, { upsert: true, new: true });
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
        try {
            const CoinTransaction = (await Promise.resolve().then(() => __importStar(require('../models/CoinTransaction')))).default;
            await CoinTransaction.create({
                userId: user._id,
                amount: rewards.coins,
                type: 'earn',
                category: 'vocabulary',
                description: wasAlreadyLearned ? 'Ôn lại từ vựng' : 'Học từ vựng mới',
                balanceAfter: user.coins,
                metadata: { vocabularyId, personalTopicId, quizScore }
            });
        }
        catch (e) {
            console.error('Failed to record coin transaction (vocabulary):', e);
        }
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
    (0, express_validator_1.body)('personalTopicId').notEmpty().withMessage('ID chủ đề cá nhân là bắt buộc').isMongoId().withMessage('ID chủ đề cá nhân không hợp lệ')
];
exports.completeLearningValidation = [
    (0, express_validator_1.body)('vocabularyId').notEmpty().withMessage('ID từ vựng là bắt buộc'),
    (0, express_validator_1.body)('quizScore').isNumeric().withMessage('Điểm khảo bài phải là số'),
    (0, express_validator_1.body)('personalTopicId').optional().isMongoId().withMessage('ID chủ đề cá nhân không hợp lệ')
];
// Get available vocabularies for personal topics
const getAvailableVocabularies = async (req, res) => {
    try {
        const { topics, search, limit = 20 } = req.query;
        const userId = req.user?._id;
        if (!topics) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất một chủ đề' });
        }
        // Get user's current level
        const user = await User_1.default.findById(userId).select('level');
        const userLevel = user?.level || 1;
        let query = {
            // Filter by user level (show vocabularies within 2 levels of user's level)
            level: { $gte: Math.max(1, userLevel - 1), $lte: userLevel + 1 }
        };
        // Search filter
        if (search) {
            query.$or = [
                { word: { $regex: search, $options: 'i' } },
                { meaning: { $regex: search, $options: 'i' } },
                { pinyin: { $regex: search, $options: 'i' } },
                { zhuyin: { $regex: search, $options: 'i' } }
            ];
        }
        // Topic filter - get vocabularies that match any of the selected topics
        const topicArray = topics.split(',').map((t) => t.trim());
        query.topics = { $in: topicArray };
        // Exclude vocabularies that the user already has in any personal topic
        const existingUserVocabularies = await UserVocabulary_1.UserVocabulary.find({ userId }).select('vocabularyId');
        const existingIds = existingUserVocabularies.map((d) => d.vocabularyId);
        if (existingIds.length > 0) {
            query._id = { $nin: existingIds };
        }
        const vocabularies = await Vocabulary_1.default.find(query)
            .limit(Number(limit))
            .sort({ level: 1, createdAt: -1 });
        res.json(vocabularies);
    }
    catch (error) {
        console.error('Error fetching available vocabularies:', error);
        res.status(500).json({ message: 'Không thể tải danh sách từ vựng có sẵn' });
    }
};
exports.getAvailableVocabularies = getAvailableVocabularies;
// Add vocabularies to personal topic
const addVocabulariesToTopic = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { topicId, vocabularyIds } = req.body;
        if (!topicId || !vocabularyIds || !Array.isArray(vocabularyIds) || vocabularyIds.length === 0) {
            return res.status(400).json({ message: 'Vui lòng cung cấp chủ đề và danh sách từ vựng' });
        }
        // Check if topic exists and belongs to user
        const topic = await PersonalTopic_1.PersonalTopic.findOne({ _id: topicId, userId });
        if (!topic) {
            return res.status(404).json({ message: 'Chủ đề không tồn tại' });
        }
        // Check if vocabularies exist
        const vocabularies = await Vocabulary_1.default.find({ _id: { $in: vocabularyIds } });
        if (vocabularies.length !== vocabularyIds.length) {
            return res.status(400).json({ message: 'Một số từ vựng không tồn tại' });
        }
        // Check which vocabularies already exist for this user in THIS specific topic
        const existingUserVocabularies = await UserVocabulary_1.UserVocabulary.find({
            userId,
            vocabularyId: { $in: vocabularyIds },
            personalTopicId: topicId
        }).select('vocabularyId');
        const existingVocabularyIds = existingUserVocabularies.map(uv => uv.vocabularyId.toString());
        const newVocabularyIds = vocabularyIds.filter(id => !existingVocabularyIds.includes(id));
        if (newVocabularyIds.length === 0) {
            return res.json({
                message: 'Tất cả từ vựng đã tồn tại trong chủ đề này',
                added: 0,
                skipped: vocabularyIds.length
            });
        }
        // Add only new vocabularies to topic
        const userVocabularies = newVocabularyIds.map((vocabularyId) => ({
            userId,
            vocabularyId,
            personalTopicId: topicId,
            status: 'studying',
            addedAt: new Date()
        }));
        try {
            await UserVocabulary_1.UserVocabulary.insertMany(userVocabularies, { ordered: false });
        }
        catch (error) {
            // Handle duplicate key errors gracefully
            if (error.code === 11000) {
                // Some documents were inserted, some failed due to duplicates
                const insertedCount = error.result?.insertedCount || 0;
                const duplicateCount = newVocabularyIds.length - insertedCount;
                res.json({
                    message: `Thêm ${insertedCount} từ vựng mới, ${duplicateCount} từ đã tồn tại`,
                    added: insertedCount,
                    skipped: duplicateCount
                });
                return;
            }
            throw error;
        }
        res.json({
            message: `Thêm ${newVocabularyIds.length} từ vựng vào chủ đề thành công`,
            added: newVocabularyIds.length,
            skipped: existingVocabularyIds.length
        });
    }
    catch (error) {
        console.error('Error adding vocabularies to topic:', error);
        res.status(500).json({ message: 'Không thể thêm từ vựng vào chủ đề' });
    }
};
exports.addVocabulariesToTopic = addVocabulariesToTopic;
const getLearnedVocabulariesForQuiz = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { personalTopicId } = req.query;
        if (!personalTopicId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp chủ đề' });
        }
        // Bước 1: Lấy tất cả vocabularyIds thuộc chủ đề này của người dùng
        const topicMappings = await UserVocabulary_1.UserVocabulary.find({ userId, personalTopicId }).select('vocabularyId');
        const topicVocabularyIds = topicMappings.map(m => m.vocabularyId);
        if (topicVocabularyIds.length === 0) {
            return res.json({ vocabularies: [], count: 0 });
        }
        // Bước 2: Với các vocabularyIds trên, chọn những từ mà user đã "learned" ở bất kỳ chủ đề nào
        const learnedMappings = await UserVocabulary_1.UserVocabulary.find({
            userId,
            vocabularyId: { $in: topicVocabularyIds },
            status: 'learned'
        }).select('vocabularyId');
        const learnedIds = Array.from(new Set(learnedMappings.map(m => String(m.vocabularyId))));
        if (learnedIds.length === 0) {
            return res.json({ vocabularies: [], count: 0 });
        }
        // Bước 3: Lấy dữ liệu từ vựng có câu hỏi cho các id đã học
        const vocabularies = await Vocabulary_1.default.find({
            _id: { $in: learnedIds },
            'questions.0': { $exists: true }
        });
        res.json({
            vocabularies,
            count: vocabularies.length
        });
    }
    catch (error) {
        console.error('Error fetching learned vocabularies for quiz:', error);
        res.status(500).json({ message: 'Không thể tải từ vựng đã học cho khảo bài' });
    }
};
exports.getLearnedVocabulariesForQuiz = getLearnedVocabulariesForQuiz;
// Get vocabularies by personal topic
const getVocabulariesByTopic = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { personalTopicId, search, limit = 20 } = req.query;
        if (!personalTopicId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp chủ đề' });
        }
        // Lấy từ vựng trong chủ đề cá nhân
        const userVocabularies = await UserVocabulary_1.UserVocabulary.find({
            userId,
            personalTopicId
        })
            .populate('vocabularyId')
            .populate('personalTopicId');
        // Lọc bỏ những từ không tồn tại
        const validVocabularies = userVocabularies.filter(uv => uv.vocabularyId);
        // Build items with status
        let items = validVocabularies.map(uv => ({ vocabulary: uv.vocabularyId, status: uv.status }));
        // Apply search filter if provided
        let filteredItems = items;
        if (search) {
            const s = String(search).toLowerCase();
            filteredItems = items.filter(({ vocabulary }) => vocabulary.word.toLowerCase().includes(s) ||
                vocabulary.meaning.toLowerCase().includes(s) ||
                vocabulary.pronunciation.toLowerCase().includes(s));
        }
        // Apply limit
        if (limit) {
            filteredItems = filteredItems.slice(0, Number(limit));
        }
        const vocabularies = filteredItems.map(i => i.vocabulary);
        const statuses = {};
        filteredItems.forEach(i => { statuses[String(i.vocabulary._id)] = i.status; });
        res.json({ vocabularies, statuses, count: vocabularies.length });
    }
    catch (error) {
        console.error('Error fetching vocabularies by topic:', error);
        res.status(500).json({ message: 'Không thể tải từ vựng theo chủ đề' });
    }
};
exports.getVocabulariesByTopic = getVocabulariesByTopic;
// Get monthly vocabulary learners statistics
// GET /vocabulary-learning/stats/monthly?month=YYYY-MM
const getMonthlyVocabularyLearners = async (req, res) => {
    try {
        const { month } = req.query;
        // Determine time window
        let start;
        let end;
        if (month && /^\d{4}-\d{2}$/.test(month)) {
            const [y, m] = month.split('-').map((v) => parseInt(v, 10));
            // JS month is 0-based
            start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
            end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
        }
        else {
            // Default to current month (UTC boundary)
            const now = new Date();
            start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
            end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
        }
        // Aggregate by user to get statistics
        const agg = await UserVocabulary_1.UserVocabulary.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lt: end },
                    status: { $in: ['learned', 'studying'] }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    learnedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'learned'] }, 1, 0] }
                    },
                    studyingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'studying'] }, 1, 0] }
                    },
                    totalVocabularies: { $sum: 1 }
                }
            },
            { $sort: { totalVocabularies: -1, learnedCount: -1 } }
        ]);
        // Hydrate user info
        const results = await Promise.all(agg.map(async (r) => {
            // userId is stored as String in UserVocabulary, convert to ObjectId for User query
            const userIdObj = mongoose_1.default.Types.ObjectId.isValid(r._id)
                ? new mongoose_1.default.Types.ObjectId(r._id)
                : r._id;
            const u = await User_1.default.findById(userIdObj).select('name email level');
            return {
                userId: String(r._id),
                name: u?.name || 'Unknown',
                email: u?.email || '',
                level: u?.level ?? null,
                learnedCount: r.learnedCount,
                studyingCount: r.studyingCount,
                totalVocabularies: r.totalVocabularies
            };
        }));
        res.json({
            month: month || null,
            start,
            end,
            results
        });
    }
    catch (error) {
        console.error('Get monthly vocabulary learners stats error:', error);
        res.status(500).json({ message: 'Không thể tải thống kê người học từ vựng' });
    }
};
exports.getMonthlyVocabularyLearners = getMonthlyVocabularyLearners;
// Stats: learners by vocabulary for a given month
const getLearnersByVocabularyStats = async (req, res) => {
    try {
        const { month, vocabularyIds } = req.query;
        // month: 'YYYY-MM'; default to current month
        const now = new Date();
        let year = now.getUTCFullYear();
        let monthIdx = now.getUTCMonth(); // 0-11
        if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
            const [y, m] = month.split('-').map((n) => Number(n));
            year = y;
            monthIdx = m - 1;
        }
        const monthStart = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0));
        const monthEnd = new Date(Date.UTC(year, monthIdx + 1, 1, 0, 0, 0));
        const match = {
            status: 'learned',
            learnedAt: { $gte: monthStart, $lt: monthEnd }
        };
        if (vocabularyIds) {
            const ids = String(vocabularyIds)
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            if (ids.length > 0) {
                match.vocabularyId = { $in: ids };
            }
        }
        const pipeline = [
            { $match: match },
            {
                $group: {
                    _id: '$vocabularyId',
                    learnedCount: { $sum: 1 },
                    uniqueLearners: { $addToSet: '$userId' }
                }
            },
            {
                $project: {
                    _id: 0,
                    vocabularyId: '$_id',
                    learnedCount: 1,
                    uniqueLearnersCount: { $size: '$uniqueLearners' }
                }
            }
        ];
        const results = await UserVocabulary_1.UserVocabulary.aggregate(pipeline);
        // Join vocabulary info
        const vocabIds = results.map((r) => r.vocabularyId);
        const vocabDocs = await Vocabulary_1.default.find({ _id: { $in: vocabIds } }).select('word pinyin zhuyin meaning');
        const idToVocab = new Map();
        vocabDocs.forEach((v) => idToVocab.set(String(v._id), v));
        const stats = results.map((r) => {
            const v = idToVocab.get(String(r.vocabularyId));
            return {
                vocabularyId: r.vocabularyId,
                word: v?.word || '',
                pinyin: v?.pinyin || v?.pronunciation || '',
                meaning: v?.meaning || '',
                learnedCount: r.learnedCount,
                uniqueLearners: r.uniqueLearnersCount
            };
        });
        // If client passed vocabularyIds but some have zero for this month, include zeros
        if (vocabularyIds) {
            const requested = String(vocabularyIds)
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            const existingSet = new Set(stats.map(s => String(s.vocabularyId)));
            if (requested.length > 0) {
                const missingIds = requested.filter(id => !existingSet.has(id));
                if (missingIds.length > 0) {
                    const missingVocabDocs = await Vocabulary_1.default.find({ _id: { $in: missingIds } }).select('word pinyin zhuyin meaning');
                    const missingMap = new Map();
                    missingVocabDocs.forEach((v) => missingMap.set(String(v._id), v));
                    missingIds.forEach(id => {
                        const v = missingMap.get(id);
                        stats.push({
                            vocabularyId: id,
                            word: v?.word || '',
                            pinyin: v?.pinyin || v?.pronunciation || '',
                            meaning: v?.meaning || '',
                            learnedCount: 0,
                            uniqueLearners: 0
                        });
                    });
                }
            }
        }
        // Sort by learnedCount desc then word asc
        stats.sort((a, b) => {
            if (b.learnedCount !== a.learnedCount)
                return b.learnedCount - a.learnedCount;
            return String(a.word).localeCompare(String(b.word));
        });
        res.json({
            month: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
            stats,
            count: stats.length
        });
    }
    catch (error) {
        console.error('Error fetching learners-by-vocabulary stats:', error);
        res.status(500).json({ message: 'Không thể tải thống kê người học theo từ vựng' });
    }
};
exports.getLearnersByVocabularyStats = getLearnersByVocabularyStats;
