"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVocabularyByKeywords = exports.completeVocabularyLearning = exports.getVocabularyQuiz = exports.updateVocabularyStatus = exports.getNextVocabularyToLearn = exports.addVocabularyToLearning = exports.getVocabularySuggestions = exports.getUserVocabularyProgress = void 0;
const UserVocabulary_1 = require("../models/UserVocabulary");
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const User_1 = __importDefault(require("../models/User"));
// Get user's vocabulary learning progress
const getUserVocabularyProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const userVocabularies = await UserVocabulary_1.UserVocabulary.find({ userId })
            .populate('vocabularyId')
            .sort({ addedAt: -1 });
        const stats = {
            total: userVocabularies.length,
            learned: userVocabularies.filter((uv) => uv.status === 'learned').length,
            studying: userVocabularies.filter((uv) => uv.status === 'studying').length,
            skipped: userVocabularies.filter((uv) => uv.status === 'skipped').length
        };
        res.json({
            userVocabularies,
            stats
        });
    }
    catch (error) {
        console.error('Get user vocabulary progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserVocabularyProgress = getUserVocabularyProgress;
// Get vocabulary suggestions based on user's level and preferences
const getVocabularySuggestions = async (req, res) => {
    try {
        const { topic, keywords, limit = 10 } = req.query;
        const userId = req.user._id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let query = {
            level: { $lte: user.level }
        };
        // If topic is provided, filter by topic
        if (topic) {
            query.topics = topic;
        }
        // If keywords are provided, search in word, meaning, or pronunciation
        if (keywords) {
            query.$or = [
                { word: { $regex: keywords, $options: 'i' } },
                { meaning: { $regex: keywords, $options: 'i' } },
                { pronunciation: { $regex: keywords, $options: 'i' } }
            ];
        }
        // Get vocabularies that user hasn't added yet
        const userVocabularyIds = await UserVocabulary_1.UserVocabulary.find({ userId }).select('vocabularyId');
        const existingIds = userVocabularyIds.map((uv) => uv.vocabularyId);
        if (existingIds.length > 0) {
            query._id = { $nin: existingIds };
        }
        const suggestions = await Vocabulary_1.default.find(query)
            .limit(parseInt(limit))
            .sort({ level: 1, createdAt: -1 });
        res.json({
            suggestions,
            total: suggestions.length
        });
    }
    catch (error) {
        console.error('Get vocabulary suggestions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getVocabularySuggestions = getVocabularySuggestions;
// Add vocabulary to user's learning list
const addVocabularyToLearning = async (req, res) => {
    try {
        const { vocabularyIds, customTopic } = req.body;
        const userId = req.user._id;
        if (!vocabularyIds || !Array.isArray(vocabularyIds)) {
            return res.status(400).json({ message: 'Vocabulary IDs are required' });
        }
        const addedVocabularies = [];
        for (const vocabularyId of vocabularyIds) {
            // Check if already exists
            const existing = await UserVocabulary_1.UserVocabulary.findOne({ userId, vocabularyId });
            if (existing) {
                continue; // Skip if already exists
            }
            const userVocabulary = new UserVocabulary_1.UserVocabulary({
                userId,
                vocabularyId,
                customTopic,
                isCustom: !!customTopic
            });
            await userVocabulary.save();
            addedVocabularies.push(userVocabulary);
        }
        res.json({
            message: 'Vocabulary added to learning list successfully',
            addedCount: addedVocabularies.length
        });
    }
    catch (error) {
        console.error('Add vocabulary to learning error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.addVocabularyToLearning = addVocabularyToLearning;
// Get next vocabulary to learn
const getNextVocabularyToLearn = async (req, res) => {
    try {
        const userId = req.user._id;
        // Get next vocabulary in learning status
        const userVocabulary = await UserVocabulary_1.UserVocabulary.findOne({
            userId,
            status: 'learning'
        }).populate('vocabularyId');
        if (!userVocabulary) {
            return res.status(404).json({ message: 'No more vocabulary to learn' });
        }
        res.json({
            userVocabulary,
            vocabulary: userVocabulary.vocabularyId
        });
    }
    catch (error) {
        console.error('Get next vocabulary to learn error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getNextVocabularyToLearn = getNextVocabularyToLearn;
// Update vocabulary learning status
const updateVocabularyStatus = async (req, res) => {
    try {
        const { userVocabularyId, status } = req.body;
        const userId = req.user._id;
        const userVocabulary = await UserVocabulary_1.UserVocabulary.findOne({
            _id: userVocabularyId,
            userId
        });
        if (!userVocabulary) {
            return res.status(404).json({ message: 'User vocabulary not found' });
        }
        userVocabulary.status = status;
        if (status === 'learned') {
            userVocabulary.learnedAt = new Date();
        }
        await userVocabulary.save();
        res.json({
            message: 'Vocabulary status updated successfully',
            userVocabulary
        });
    }
    catch (error) {
        console.error('Update vocabulary status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateVocabularyStatus = updateVocabularyStatus;
// Get vocabulary quiz questions
const getVocabularyQuiz = async (req, res) => {
    try {
        const { userVocabularyId } = req.params;
        const userId = req.user._id;
        const userVocabulary = await UserVocabulary_1.UserVocabulary.findOne({
            _id: userVocabularyId,
            userId
        }).populate('vocabularyId');
        if (!userVocabulary) {
            return res.status(404).json({ message: 'User vocabulary not found' });
        }
        const vocabulary = userVocabulary.vocabularyId;
        // Get random questions from vocabulary (max 3)
        const questions = vocabulary.questions || [];
        const randomQuestions = questions
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.min(3, questions.length));
        // If no questions available, create simple questions
        if (randomQuestions.length === 0) {
            const simpleQuestions = [
                {
                    question: `Từ "${vocabulary.word}" có nghĩa là gì?`,
                    options: [
                        vocabulary.meaning,
                        // Get 3 random wrong options from other vocabularies
                        ...(await getRandomMeanings(vocabulary._id, 3))
                    ].sort(() => 0.5 - Math.random()),
                    correctAnswer: 0,
                    explanation: `"${vocabulary.word}" có nghĩa là "${vocabulary.meaning}"`
                }
            ];
            res.json({
                vocabulary: {
                    id: vocabulary._id,
                    word: vocabulary.word,
                    meaning: vocabulary.meaning
                },
                questions: simpleQuestions
            });
        }
        else {
            res.json({
                vocabulary: {
                    id: vocabulary._id,
                    word: vocabulary.word,
                    meaning: vocabulary.meaning
                },
                questions: randomQuestions
            });
        }
    }
    catch (error) {
        console.error('Get vocabulary quiz error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getVocabularyQuiz = getVocabularyQuiz;
// Complete vocabulary learning with quiz
const completeVocabularyLearning = async (req, res) => {
    try {
        const { userVocabularyId, quizAnswers } = req.body;
        const userId = req.user._id;
        const userVocabulary = await UserVocabulary_1.UserVocabulary.findOne({
            _id: userVocabularyId,
            userId
        }).populate('vocabularyId');
        if (!userVocabulary) {
            return res.status(404).json({ message: 'User vocabulary not found' });
        }
        const vocabulary = userVocabulary.vocabularyId;
        const questions = vocabulary.questions || [];
        // Calculate score
        let correctAnswers = 0;
        const totalQuestions = Math.min(quizAnswers.length, questions.length);
        for (let i = 0; i < totalQuestions; i++) {
            if (questions[i] && quizAnswers[i] === questions[i].correctAnswer) {
                correctAnswers++;
            }
        }
        const score = (correctAnswers / totalQuestions) * 100;
        const passed = score >= 70; // 70% to pass
        if (passed) {
            userVocabulary.status = 'learned';
            userVocabulary.learnedAt = new Date();
            // Add experience and coins
            const user = await User_1.default.findById(userId);
            if (user) {
                // Check if vocabulary was already learned before
                const wasAlreadyLearned = userVocabulary.status === 'learned' && userVocabulary.learnedAt;
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
                await user.save();
            }
        }
        else {
            userVocabulary.status = 'studying';
        }
        await userVocabulary.save();
        const user = await User_1.default.findById(userId);
        res.json({
            message: passed ? 'Vocabulary learned successfully!' : 'Keep studying this vocabulary',
            result: {
                score,
                correctAnswers,
                totalQuestions,
                passed
            },
            user: {
                level: user?.level || 1,
                experience: user?.experience || 0,
                coins: user?.coins || 0
            }
        });
    }
    catch (error) {
        console.error('Complete vocabulary learning error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.completeVocabularyLearning = completeVocabularyLearning;
// Search vocabulary by keywords
const searchVocabularyByKeywords = async (req, res) => {
    try {
        const { keywords } = req.query;
        const userId = req.user._id;
        if (!keywords) {
            return res.status(400).json({ message: 'Keywords are required' });
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const query = {
            level: { $lte: user.level },
            $or: [
                { word: { $regex: keywords, $options: 'i' } },
                { meaning: { $regex: keywords, $options: 'i' } },
                { pronunciation: { $regex: keywords, $options: 'i' } }
            ]
        };
        const vocabularies = await Vocabulary_1.default.find(query).limit(20);
        res.json({
            vocabularies,
            total: vocabularies.length
        });
    }
    catch (error) {
        console.error('Search vocabulary by keywords error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.searchVocabularyByKeywords = searchVocabularyByKeywords;
// Helper function to get random meanings for wrong options
async function getRandomMeanings(excludeId, count) {
    const vocabularies = await Vocabulary_1.default.find({
        _id: { $ne: excludeId }
    }).limit(count * 2).select('meaning');
    return vocabularies
        .map(v => v.meaning)
        .sort(() => 0.5 - Math.random())
        .slice(0, count);
}
//# sourceMappingURL=smartVocabularyController.js.map