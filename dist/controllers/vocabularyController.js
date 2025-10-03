"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = exports.getVocabulariesByCategories = exports.getAISuggestions = exports.getVocabularyQuiz = exports.completeVocabulary = exports.getSuggestedVocabularies = exports.createTopic = exports.getTopics = exports.deleteVocabulary = exports.updateVocabulary = exports.createVocabulary = exports.getVocabularyById = exports.getVocabularies = void 0;
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const Topic_1 = __importDefault(require("../models/Topic"));
const User_1 = __importDefault(require("../models/User"));
const express_validator_1 = require("express-validator");
const getVocabularies = async (req, res) => {
    try {
        const { level, topic, page = 1, limit = 10, search } = req.query;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let query = {};
        // Filter by level (user can only access their level and below)
        if (level) {
            query.level = { $lte: parseInt(level) };
        }
        else {
            query.level = { $lte: user.level };
        }
        // Filter by topic
        if (topic) {
            query.topics = topic;
        }
        // Add search functionality
        if (search) {
            query.$or = [
                { word: { $regex: search, $options: 'i' } },
                { meaning: { $regex: search, $options: 'i' } },
                { pronunciation: { $regex: search, $options: 'i' } }
            ];
        }
        const vocabularies = await Vocabulary_1.default.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await Vocabulary_1.default.countDocuments(query);
        res.json({
            vocabularies,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    }
    catch (error) {
        console.error('Get vocabularies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getVocabularies = getVocabularies;
const getVocabularyById = async (req, res) => {
    try {
        const { id } = req.params;
        const vocabulary = await Vocabulary_1.default.findById(id);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        res.json(vocabulary);
    }
    catch (error) {
        console.error('Get vocabulary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getVocabularyById = getVocabularyById;
const createVocabulary = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const vocabularyData = req.body;
        const vocabulary = new Vocabulary_1.default(vocabularyData);
        await vocabulary.save();
        res.status(201).json({
            message: 'Vocabulary created successfully',
            vocabulary
        });
    }
    catch (error) {
        console.error('Create vocabulary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createVocabulary = createVocabulary;
const updateVocabulary = async (req, res) => {
    try {
        const { id } = req.params;
        const vocabularyData = req.body;
        const vocabulary = await Vocabulary_1.default.findByIdAndUpdate(id, vocabularyData, { new: true });
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        res.json({
            message: 'Vocabulary updated successfully',
            vocabulary
        });
    }
    catch (error) {
        console.error('Update vocabulary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateVocabulary = updateVocabulary;
const deleteVocabulary = async (req, res) => {
    try {
        const { id } = req.params;
        const vocabulary = await Vocabulary_1.default.findByIdAndDelete(id);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        res.json({ message: 'Vocabulary deleted successfully' });
    }
    catch (error) {
        console.error('Delete vocabulary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteVocabulary = deleteVocabulary;
const getTopics = async (req, res) => {
    try {
        const topics = await Topic_1.default.find().sort({ name: 1 });
        res.json(topics);
    }
    catch (error) {
        console.error('Get topics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTopics = getTopics;
const createTopic = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const topic = new Topic_1.default(req.body);
        await topic.save();
        res.status(201).json({
            message: 'Topic created successfully',
            topic
        });
    }
    catch (error) {
        console.error('Create topic error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createTopic = createTopic;
const getSuggestedVocabularies = async (req, res) => {
    try {
        const { topic } = req.query;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let query = {
            level: { $lte: user.level }
        };
        if (topic) {
            query.topics = topic;
        }
        const vocabularies = await Vocabulary_1.default.find(query)
            .limit(10)
            .sort({ createdAt: -1 });
        res.json(vocabularies);
    }
    catch (error) {
        console.error('Get suggested vocabularies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getSuggestedVocabularies = getSuggestedVocabularies;
const completeVocabulary = async (req, res) => {
    try {
        const { vocabularyId, quizAnswers } = req.body;
        const user = await User_1.default.findById(req.user._id);
        const vocabulary = await Vocabulary_1.default.findById(vocabularyId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        // Check quiz answers if provided
        let quizPassed = true;
        if (quizAnswers && vocabulary.questions && vocabulary.questions.length > 0) {
            const correctAnswers = vocabulary.questions.filter((q, index) => {
                return q.correctAnswer === quizAnswers[index];
            });
            // User must get all questions correct to pass
            quizPassed = correctAnswers.length === vocabulary.questions.length;
        }
        if (quizPassed) {
            // Check if vocabulary was already learned before
            const wasAlreadyLearned = user.learnedVocabulary && user.learnedVocabulary.includes(vocabularyId);
            if (wasAlreadyLearned) {
                // Already learned vocabulary: 1 XP, 1 coin
                user.experience += 1;
                user.coins += 1;
            }
            else {
                // New vocabulary: 10 XP, 10 coins
                user.experience += 10;
                user.coins += 10;
            }
            // Check for level up
            const levels = [0, 100, 300, 600, 1000, 1500, 2100];
            if (user.experience >= levels[user.level] && user.level < 6) {
                user.level += 1;
            }
            // Add to learned vocabulary (you might want to create a separate model for this)
            if (!user.learnedVocabulary) {
                user.learnedVocabulary = [];
            }
            if (!user.learnedVocabulary.includes(vocabularyId)) {
                user.learnedVocabulary.push(vocabularyId);
            }
            await user.save();
            res.json({
                message: 'Vocabulary completed successfully',
                quizPassed: true,
                user: {
                    level: user.level,
                    experience: user.experience,
                    coins: user.coins
                }
            });
        }
        else {
            // Add to needs more study list
            if (!user.needsStudyVocabulary) {
                user.needsStudyVocabulary = [];
            }
            if (!user.needsStudyVocabulary.includes(vocabularyId)) {
                user.needsStudyVocabulary.push(vocabularyId);
            }
            await user.save();
            res.json({
                message: 'Quiz not passed, added to study list',
                quizPassed: false,
                user: {
                    level: user.level,
                    experience: user.experience,
                    coins: user.coins
                }
            });
        }
    }
    catch (error) {
        console.error('Complete vocabulary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.completeVocabulary = completeVocabulary;
const getVocabularyQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const vocabulary = await Vocabulary_1.default.findById(id);
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        // Return random questions (up to 3, or all if less than 3)
        const questions = vocabulary.questions || [];
        const randomQuestions = questions
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(3, questions.length));
        res.json({
            vocabulary: {
                id: vocabulary._id,
                word: vocabulary.word,
                meaning: vocabulary.meaning
            },
            questions: randomQuestions
        });
    }
    catch (error) {
        console.error('Get vocabulary quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getVocabularyQuiz = getVocabularyQuiz;
const getAISuggestions = async (req, res) => {
    try {
        const { topic, keywords } = req.body;
        // Use AI to generate vocabulary suggestions (temporarily disabled)
        // const { getPersonalizedVocabularySuggestions } = await import('../ai/flows/personalized-vocabulary-suggestions');
        // const suggestions = await getPersonalizedVocabularySuggestions({
        //   topic,
        //   keywords: keywords || ''
        // });
        // Mock suggestions for now
        const suggestions = {
            suggestedVocabulary: [
                { hanzi: '学习', pinyin: 'xuéxí', meaning: 'học tập', partOfSpeech: 'verb', level: 'A', examples: ['我在学习中文'] },
                { hanzi: '工作', pinyin: 'gōngzuò', meaning: 'làm việc', partOfSpeech: 'verb', level: 'A', examples: ['我在工作'] }
            ]
        };
        res.json({
            message: 'AI suggestions generated successfully',
            suggestedVocabulary: suggestions.suggestedVocabulary
        });
    }
    catch (error) {
        console.error('Get AI suggestions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAISuggestions = getAISuggestions;
const getVocabulariesByCategories = async (req, res) => {
    try {
        const { categories, search, limit = 50 } = req.query;
        if (!categories) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất một danh mục' });
        }
        let query = {};
        // Search filter
        if (search) {
            query.$or = [
                { word: { $regex: search, $options: 'i' } },
                { meaning: { $regex: search, $options: 'i' } },
                { pronunciation: { $regex: search, $options: 'i' } }
            ];
        }
        // Category filter - get vocabularies that match any of the selected categories
        const categoryArray = categories.split(',').map((c) => c.trim());
        query.topics = { $in: categoryArray };
        const vocabularies = await Vocabulary_1.default.find(query)
            .limit(Number(limit))
            .sort({ level: 1, createdAt: -1 });
        res.json({ vocabularies });
    }
    catch (error) {
        console.error('Error fetching vocabularies by categories:', error);
        res.status(500).json({ message: 'Không thể tải từ vựng theo danh mục' });
    }
};
exports.getVocabulariesByCategories = getVocabulariesByCategories;
const getCategories = async (req, res) => {
    try {
        // Get unique topics from vocabularies
        const topics = await Vocabulary_1.default.distinct('topics');
        // Count vocabularies for each topic
        const categories = await Promise.all(topics.map(async (topic) => {
            const count = await Vocabulary_1.default.countDocuments({ topics: topic });
            return {
                _id: topic,
                name: topic,
                description: `Từ vựng về ${topic}`,
                vocabularyCount: count
            };
        }));
        res.json({ categories });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Không thể tải danh mục' });
    }
};
exports.getCategories = getCategories;
