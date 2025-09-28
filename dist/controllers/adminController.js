"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCompetition = exports.updateCompetition = exports.createCompetition = exports.getAllCompetitions = exports.activateProficiencyConfig = exports.deleteProficiencyConfig = exports.updateProficiencyConfig = exports.createProficiencyConfig = exports.getProficiencyConfigs = exports.getAllProficiencyTests = exports.getAllTests = exports.getAllLevels = exports.getAllTopics = exports.getAllVocabularies = exports.getAdminActivities = exports.getAdminStats = exports.deleteProficiencyTest = exports.updateProficiencyTest = exports.createProficiencyTest = exports.deleteTest = exports.updateTest = exports.createTest = exports.deleteLevel = exports.updateLevel = exports.createLevel = exports.deleteTopic = exports.updateTopic = exports.createTopic = exports.deleteVocabulary = exports.updateVocabulary = exports.createVocabulary = void 0;
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const Topic_1 = __importDefault(require("../models/Topic"));
const Level_1 = __importDefault(require("../models/Level"));
const Test_1 = __importDefault(require("../models/Test"));
const ProficiencyTest_1 = __importDefault(require("../models/ProficiencyTest"));
const ProficiencyConfig_1 = __importDefault(require("../models/ProficiencyConfig"));
const Competition_1 = __importDefault(require("../models/Competition"));
const Report_1 = __importDefault(require("../models/Report"));
const User_1 = __importDefault(require("../models/User"));
const express_validator_1 = require("express-validator");
// Vocabulary Management
const createVocabulary = async (req, res) => {
    try {
        console.log('Create vocabulary request body:', req.body);
        console.log('Create vocabulary request file:', req.file);
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.error('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }
        const { word, pronunciation, meaning, audioUrl, level, topics, partOfSpeech, synonyms, antonyms, examples, questions } = req.body;
        // Parse JSON strings for array fields
        let parsedTopics, parsedSynonyms, parsedAntonyms, parsedExamples, parsedQuestions;
        try {
            parsedTopics = typeof topics === 'string' ? JSON.parse(topics) : topics;
            parsedSynonyms = typeof synonyms === 'string' ? JSON.parse(synonyms) : synonyms;
            parsedAntonyms = typeof antonyms === 'string' ? JSON.parse(antonyms) : antonyms;
            parsedExamples = typeof examples === 'string' ? JSON.parse(examples) : examples;
            parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
        }
        catch (parseError) {
            console.error('JSON parse error:', parseError);
            return res.status(400).json({
                message: 'Invalid JSON format in array fields',
                error: parseError
            });
        }
        // Handle file upload if present
        let audioUrlFinal = audioUrl;
        if (req.file) {
            try {
                audioUrlFinal = req.file.path; // Cloudinary URL
                console.log('Audio file uploaded successfully:', req.file.path);
            }
            catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                return res.status(500).json({
                    message: 'Failed to upload audio file',
                    error: uploadError
                });
            }
        }
        // Validate required fields
        if (!word || !pronunciation || !meaning || !partOfSpeech) {
            return res.status(400).json({
                message: 'Missing required fields: word, pronunciation, meaning, partOfSpeech'
            });
        }
        const vocabulary = new Vocabulary_1.default({
            word,
            pronunciation,
            meaning,
            audioUrl: audioUrlFinal,
            level,
            topics: parsedTopics || [],
            partOfSpeech,
            synonyms: parsedSynonyms || [],
            antonyms: parsedAntonyms || [],
            examples: parsedExamples || [],
            questions: parsedQuestions || []
        });
        await vocabulary.save();
        res.status(201).json({
            message: 'Vocabulary created successfully',
            vocabulary: {
                ...vocabulary.toObject(),
                audioUrl: vocabulary.audioUrl || null
            }
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
        const updateData = req.body;
        console.log('Update data received:', updateData);
        // Handle file upload if present
        if (req.file) {
            try {
                updateData.audioUrl = req.file.path; // Cloudinary URL
                console.log('Audio file uploaded successfully:', req.file.path);
            }
            catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                return res.status(500).json({
                    message: 'Failed to upload audio file',
                    error: uploadError
                });
            }
        }
        // Filter out empty strings and undefined values, and parse JSON strings
        const filteredData = Object.keys(updateData).reduce((acc, key) => {
            if (updateData[key] !== '' && updateData[key] !== undefined && updateData[key] !== null) {
                // Parse JSON strings for array fields
                if (['topics', 'examples', 'synonyms', 'antonyms', 'questions'].includes(key)) {
                    try {
                        acc[key] = JSON.parse(updateData[key]);
                    }
                    catch (e) {
                        acc[key] = updateData[key];
                    }
                }
                else {
                    acc[key] = updateData[key];
                }
            }
            return acc;
        }, {});
        console.log('Filtered data:', filteredData);
        // Ensure required fields are present
        if (!filteredData.word || !filteredData.pronunciation || !filteredData.meaning || !filteredData.partOfSpeech) {
            return res.status(400).json({
                message: 'Missing required fields: word, pronunciation, meaning, partOfSpeech',
                received: filteredData
            });
        }
        const vocabulary = await Vocabulary_1.default.findByIdAndUpdate(id, filteredData, { new: true, runValidators: true });
        if (!vocabulary) {
            return res.status(404).json({ message: 'Vocabulary not found' });
        }
        res.json({
            message: 'Vocabulary updated successfully',
            vocabulary: {
                ...vocabulary.toObject(),
                audioUrl: vocabulary.audioUrl || null
            }
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
// Topic Management
const createTopic = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, description, color } = req.body;
        const topic = new Topic_1.default({
            name,
            description,
            color
        });
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
const updateTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const topic = await Topic_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        res.json({
            message: 'Topic updated successfully',
            topic
        });
    }
    catch (error) {
        console.error('Update topic error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateTopic = updateTopic;
const deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const topic = await Topic_1.default.findByIdAndDelete(id);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        res.json({ message: 'Topic deleted successfully' });
    }
    catch (error) {
        console.error('Delete topic error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteTopic = deleteTopic;
// Level Management
const createLevel = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, number, description, requiredExperience, color } = req.body;
        const level = new Level_1.default({
            name,
            number,
            description,
            requiredExperience,
            color
        });
        await level.save();
        res.status(201).json({
            message: 'Level created successfully',
            level
        });
    }
    catch (error) {
        console.error('Create level error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createLevel = createLevel;
const updateLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const level = await Level_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!level) {
            return res.status(404).json({ message: 'Level not found' });
        }
        res.json({
            message: 'Level updated successfully',
            level
        });
    }
    catch (error) {
        console.error('Update level error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateLevel = updateLevel;
const deleteLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const level = await Level_1.default.findByIdAndDelete(id);
        if (!level) {
            return res.status(404).json({ message: 'Level not found' });
        }
        res.json({ message: 'Level deleted successfully' });
    }
    catch (error) {
        console.error('Delete level error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteLevel = deleteLevel;
// Test Management
const createTest = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { title, description, level, questions, timeLimit, requiredCoins, rewardExperience, rewardCoins } = req.body;
        const test = new Test_1.default({
            title,
            description,
            level,
            questions,
            timeLimit,
            requiredCoins,
            rewardExperience,
            rewardCoins
        });
        await test.save();
        res.status(201).json({
            message: 'Test created successfully',
            test
        });
    }
    catch (error) {
        console.error('Create test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createTest = createTest;
const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const test = await Test_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json({
            message: 'Test updated successfully',
            test
        });
    }
    catch (error) {
        console.error('Update test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateTest = updateTest;
const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await Test_1.default.findByIdAndDelete(id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json({ message: 'Test deleted successfully' });
    }
    catch (error) {
        console.error('Delete test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteTest = deleteTest;
// Proficiency Test Management
const createProficiencyTest = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { level, questions, timeLimit, requiredCoins, rewardExperience, rewardCoins } = req.body;
        const proficiencyTest = new ProficiencyTest_1.default({
            level,
            questions,
            timeLimit,
            requiredCoins,
            rewardExperience,
            rewardCoins
        });
        await proficiencyTest.save();
        res.status(201).json({
            message: 'Proficiency test created successfully',
            proficiencyTest
        });
    }
    catch (error) {
        console.error('Create proficiency test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createProficiencyTest = createProficiencyTest;
const updateProficiencyTest = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const proficiencyTest = await ProficiencyTest_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!proficiencyTest) {
            return res.status(404).json({ message: 'Proficiency test not found' });
        }
        res.json({
            message: 'Proficiency test updated successfully',
            proficiencyTest
        });
    }
    catch (error) {
        console.error('Update proficiency test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProficiencyTest = updateProficiencyTest;
const deleteProficiencyTest = async (req, res) => {
    try {
        const { id } = req.params;
        const proficiencyTest = await ProficiencyTest_1.default.findByIdAndDelete(id);
        if (!proficiencyTest) {
            return res.status(404).json({ message: 'Proficiency test not found' });
        }
        res.json({ message: 'Proficiency test deleted successfully' });
    }
    catch (error) {
        console.error('Delete proficiency test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteProficiencyTest = deleteProficiencyTest;
// Admin Dashboard Stats
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments();
        const totalVocabulary = await Vocabulary_1.default.countDocuments();
        const totalTopics = await Topic_1.default.countDocuments();
        const totalTests = await Test_1.default.countDocuments();
        const totalProficiencyTests = await ProficiencyTest_1.default.countDocuments();
        const pendingReports = await Report_1.default.countDocuments({ status: 'pending' });
        // Calculate additional stats
        const users = await User_1.default.find().select('experience coins lastCheckIn');
        const totalExperience = users.reduce((sum, user) => sum + user.experience, 0);
        const totalCoins = users.reduce((sum, user) => sum + user.coins, 0);
        // Active users (logged in within last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsers = await User_1.default.countDocuments({
            lastCheckIn: { $gte: oneDayAgo }
        });
        // Calculate analytics data
        const completedTests = await Test_1.default.countDocuments({ completedBy: { $exists: true, $ne: [] } });
        const testCompletionRate = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
        const learnedVocabulary = users.reduce((sum, user) => sum + (user.learnedVocabulary?.length || 0), 0);
        const vocabularyLearningRate = totalVocabulary > 0 ? Math.round((learnedVocabulary / totalVocabulary) * 100) : 0;
        // Mock satisfaction rate (in real app, this would come from feedback/reviews)
        const satisfactionRate = Math.min(95, Math.max(70, 85 + Math.floor(Math.random() * 20)));
        const recentUsers = await User_1.default.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email level experience coins createdAt');
        const recentReports = await Report_1.default.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);
        res.json({
            stats: {
                totalUsers,
                totalVocabulary,
                totalTopics,
                totalTests,
                totalProficiencyTests,
                pendingReports,
                activeUsers,
                totalExperience,
                totalCoins,
                testCompletionRate,
                vocabularyLearningRate,
                satisfactionRate
            },
            recentUsers,
            recentReports
        });
    }
    catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAdminStats = getAdminStats;
// Recent activities (mocked for now)
const getAdminActivities = async (_req, res) => {
    try {
        const activities = [
            { id: '1', type: 'user_registered', description: 'Người dùng mới đăng ký', timestamp: new Date().toISOString() },
            { id: '2', type: 'vocabulary_created', description: 'Thêm từ vựng mới', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: '3', type: 'test_completed', description: 'Một bài test vừa được hoàn thành', timestamp: new Date(Date.now() - 7200000).toISOString() },
            { id: '4', type: 'report_submitted', description: 'Có báo cáo mới cần duyệt', timestamp: new Date(Date.now() - 10800000).toISOString() },
        ];
        res.json({ activities });
    }
    catch (error) {
        console.error('Get admin activities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAdminActivities = getAdminActivities;
// Get all data for admin management
const getAllVocabularies = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, level, topic } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { word: { $regex: search, $options: 'i' } },
                { meaning: { $regex: search, $options: 'i' } }
            ];
        }
        if (level)
            query.level = level;
        if (topic)
            query.topics = topic;
        const vocabularies = await Vocabulary_1.default.find(query)
            .populate('topics', 'name color')
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
        console.error('Get all vocabularies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllVocabularies = getAllVocabularies;
const getAllTopics = async (req, res) => {
    try {
        const topics = await Topic_1.default.find().sort({ name: 1 });
        res.json(topics);
    }
    catch (error) {
        console.error('Get all topics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllTopics = getAllTopics;
const getAllLevels = async (req, res) => {
    try {
        const levels = await Level_1.default.find().sort({ number: 1 });
        res.json(levels);
    }
    catch (error) {
        console.error('Get all levels error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllLevels = getAllLevels;
const getAllTests = async (req, res) => {
    try {
        const { page = 1, limit = 10, level } = req.query;
        let query = {};
        if (level)
            query.level = level;
        const tests = await Test_1.default.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await Test_1.default.countDocuments(query);
        res.json({
            tests,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    }
    catch (error) {
        console.error('Get all tests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllTests = getAllTests;
const getAllProficiencyTests = async (req, res) => {
    try {
        const { level } = req.query;
        let query = {};
        if (level)
            query.level = level;
        const proficiencyTests = await ProficiencyTest_1.default.find(query).sort({ level: 1 });
        res.json(proficiencyTests);
    }
    catch (error) {
        console.error('Get all proficiency tests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllProficiencyTests = getAllProficiencyTests;
// Proficiency Config Management
const getProficiencyConfigs = async (req, res) => {
    try {
        const configs = await ProficiencyConfig_1.default.find().sort({ createdAt: -1 });
        res.json({ configs });
    }
    catch (error) {
        console.error('Get proficiency configs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getProficiencyConfigs = getProficiencyConfigs;
const createProficiencyConfig = async (req, res) => {
    try {
        const { name, description, cost, initialQuestions, branches } = req.body;
        // Deactivate all existing configs
        await ProficiencyConfig_1.default.updateMany({}, { isActive: false });
        const config = new ProficiencyConfig_1.default({
            name,
            description,
            cost,
            initialQuestions,
            branches,
            isActive: true
        });
        await config.save();
        res.status(201).json({
            message: 'Proficiency config created successfully',
            config
        });
    }
    catch (error) {
        console.error('Create proficiency config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createProficiencyConfig = createProficiencyConfig;
const updateProficiencyConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, cost, initialQuestions, branches } = req.body;
        const config = await ProficiencyConfig_1.default.findByIdAndUpdate(id, { name, description, cost, initialQuestions, branches }, { new: true });
        if (!config) {
            return res.status(404).json({ message: 'Proficiency config not found' });
        }
        res.json({
            message: 'Proficiency config updated successfully',
            config
        });
    }
    catch (error) {
        console.error('Update proficiency config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateProficiencyConfig = updateProficiencyConfig;
const deleteProficiencyConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const config = await ProficiencyConfig_1.default.findByIdAndDelete(id);
        if (!config) {
            return res.status(404).json({ message: 'Proficiency config not found' });
        }
        res.json({ message: 'Proficiency config deleted successfully' });
    }
    catch (error) {
        console.error('Delete proficiency config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteProficiencyConfig = deleteProficiencyConfig;
const activateProficiencyConfig = async (req, res) => {
    try {
        const { id } = req.params;
        // Deactivate all configs first
        await ProficiencyConfig_1.default.updateMany({}, { isActive: false });
        // Activate the selected config
        const config = await ProficiencyConfig_1.default.findByIdAndUpdate(id, { isActive: true }, { new: true });
        if (!config) {
            return res.status(404).json({ message: 'Proficiency config not found' });
        }
        res.json({
            message: 'Proficiency config activated successfully',
            config
        });
    }
    catch (error) {
        console.error('Activate proficiency config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.activateProficiencyConfig = activateProficiencyConfig;
// Competition Management
const getAllCompetitions = async (req, res) => {
    try {
        const competitions = await Competition_1.default.find().sort({ createdAt: -1 });
        res.json({ competitions });
    }
    catch (error) {
        console.error('Get competitions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllCompetitions = getAllCompetitions;
const createCompetition = async (req, res) => {
    try {
        const { title, description, level, startDate, endDate, cost, reward, prizes, questions } = req.body;
        // Validate required fields
        if (!title || !description || !level || !startDate || !endDate || !cost || !reward || !prizes || !questions) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }
        const competition = new Competition_1.default({
            title,
            description,
            level,
            startDate: start,
            endDate: end,
            cost,
            reward,
            prizes,
            questions,
            participants: [],
            isActive: true
        });
        await competition.save();
        res.status(201).json({
            message: 'Competition created successfully',
            competition
        });
    }
    catch (error) {
        console.error('Create competition error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createCompetition = createCompetition;
const updateCompetition = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Validate dates if provided
        if (updateData.startDate && updateData.endDate) {
            const start = new Date(updateData.startDate);
            const end = new Date(updateData.endDate);
            if (start >= end) {
                return res.status(400).json({ message: 'End date must be after start date' });
            }
        }
        const competition = await Competition_1.default.findByIdAndUpdate(id, updateData, { new: true });
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        res.json({
            message: 'Competition updated successfully',
            competition
        });
    }
    catch (error) {
        console.error('Update competition error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateCompetition = updateCompetition;
const deleteCompetition = async (req, res) => {
    try {
        const { id } = req.params;
        const competition = await Competition_1.default.findByIdAndDelete(id);
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        res.json({ message: 'Competition deleted successfully' });
    }
    catch (error) {
        console.error('Delete competition error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteCompetition = deleteCompetition;
//# sourceMappingURL=adminController.js.map