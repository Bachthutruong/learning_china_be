"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestStats = exports.getTestByLevel = exports.submitTest = exports.getRandomQuestions = exports.startTest = exports.deleteTest = exports.updateTest = exports.createTest = exports.getTestById = exports.getTests = void 0;
const Test_1 = __importDefault(require("../models/Test"));
const User_1 = __importDefault(require("../models/User"));
const Question_1 = __importDefault(require("../models/Question"));
const express_validator_1 = require("express-validator");
const levelUtils_1 = require("../utils/levelUtils");
const getTests = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Return test information for the new system
        res.json({
            message: 'Test system information',
            testCost: 10000,
            rewardPerCorrect: {
                coins: 100,
                experience: 100
            },
            user: {
                coins: user.coins,
                experience: user.experience,
                level: user.level
            },
            insufficientCoins: user.coins < 10000
        });
    }
    catch (error) {
        console.error('Get tests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTests = getTests;
const getTestById = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await Test_1.default.findById(id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json(test);
    }
    catch (error) {
        console.error('Get test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTestById = getTestById;
const createTest = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const testData = req.body;
        const test = new Test_1.default(testData);
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
        const testData = req.body;
        const test = await Test_1.default.findByIdAndUpdate(id, testData, { new: true });
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
// Start a new test session - deduct 10,000 coins
const startTest = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const TEST_COST = 10000;
        // Check if user has enough coins
        if (user.coins < TEST_COST) {
            return res.status(400).json({
                message: 'Không đủ xu để làm bài test. Hãy học thêm từ vựng để nhận xu miễn phí!',
                requiredCoins: TEST_COST,
                userCoins: user.coins,
                insufficientCoins: true
            });
        }
        // Deduct coins
        user.coins -= TEST_COST;
        await user.save();
        res.json({
            message: 'Đã trừ 10,000 xu. Bắt đầu làm bài test!',
            userCoins: user.coins,
            testSession: {
                startedAt: new Date(),
                cost: TEST_COST
            }
        });
    }
    catch (error) {
        console.error('Start test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.startTest = startTest;
// Get random questions by level
const getRandomQuestions = async (req, res) => {
    try {
        const { level } = req.query;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const questionLevel = level ? parseInt(level) : user.level;
        // Get all questions from the question bank for this level
        const questions = await Question_1.default.find({ level: questionLevel });
        if (questions.length === 0) {
            return res.status(404).json({
                message: `Không có câu hỏi nào ở cấp độ ${questionLevel}`
            });
        }
        res.json({
            questions,
            level: questionLevel,
            totalQuestions: questions.length
        });
    }
    catch (error) {
        console.error('Get random questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getRandomQuestions = getRandomQuestions;
// Submit test answers and get detailed report
const submitTest = async (req, res) => {
    try {
        const { answers, questionIds } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Get questions with correct answers
        const questions = await Question_1.default.find({ _id: { $in: questionIds } });
        let correctCount = 0;
        let totalQuestions = answers.length;
        const correctQuestions = [];
        const wrongQuestions = [];
        // Check each answer
        answers.forEach((userAnswer, index) => {
            const question = questions.find((q) => q._id.toString() === questionIds[index]);
            if (!question)
                return;
            const isCorrect = checkAnswer(question, userAnswer);
            if (isCorrect) {
                correctCount++;
                correctQuestions.push({
                    questionId: question._id,
                    question: question.question,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation
                });
            }
            else {
                wrongQuestions.push({
                    questionId: question._id,
                    question: question.question,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation
                });
            }
        });
        // Calculate rewards: 100 coins + 100 exp per correct answer
        const totalCoinsReward = correctCount * 100;
        const totalExpReward = correctCount * 100;
        // Update user stats
        user.coins += totalCoinsReward;
        user.experience += totalExpReward;
        await user.save();
        // Check for level up
        const levelResult = await (0, levelUtils_1.checkAndUpdateUserLevel)(user._id.toString());
        res.json({
            message: 'Test hoàn thành!',
            report: {
                totalQuestions,
                correctCount,
                wrongCount: totalQuestions - correctCount,
                correctQuestions,
                wrongQuestions,
                score: Math.round((correctCount / totalQuestions) * 100),
                rewards: {
                    coins: totalCoinsReward,
                    experience: totalExpReward
                }
            },
            user: {
                coins: user.coins,
                experience: user.experience,
                level: user.level
            },
            levelResult
        });
    }
    catch (error) {
        console.error('Submit test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.submitTest = submitTest;
// Helper function to check if answer is correct
function checkAnswer(question, userAnswer) {
    if (question.questionType === 'multiple-choice') {
        if (Array.isArray(question.correctAnswer)) {
            // Multiple correct answers
            if (Array.isArray(userAnswer)) {
                return JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correctAnswer.sort());
            }
            return false;
        }
        else {
            // Single correct answer
            return userAnswer === question.correctAnswer;
        }
    }
    else if (question.questionType === 'fill-blank') {
        return userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
    }
    else if (question.questionType === 'reading-comprehension') {
        if (Array.isArray(question.correctAnswer)) {
            // Multiple correct answers
            if (Array.isArray(userAnswer)) {
                return JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correctAnswer.sort());
            }
            return false;
        }
        else {
            // Single correct answer
            return userAnswer === question.correctAnswer;
        }
    }
    else if (question.questionType === 'sentence-order') {
        return JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
    }
    return false;
}
const getTestByLevel = async (req, res) => {
    try {
        const { level } = req.params;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Check if user can access this level
        if (parseInt(level) > user.level) {
            return res.status(403).json({
                message: 'You need to complete the proficiency test to access higher levels'
            });
        }
        const tests = await Test_1.default.find({ level: parseInt(level) })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(tests);
    }
    catch (error) {
        console.error('Get test by level error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTestByLevel = getTestByLevel;
const getTestStats = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Get test statistics for the user
        const stats = {
            totalTests: 0, // This would need to be tracked in a separate model
            averageScore: 0,
            bestScore: 0,
            testsThisWeek: 0,
            levelProgress: {
                current: user.level,
                experience: user.experience,
                nextLevel: user.level < 6 ? user.level + 1 : null,
                experienceNeeded: user.level < 6 ? [0, 100, 300, 600, 1000, 1500, 2100][user.level] - user.experience : 0
            }
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Get test stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTestStats = getTestStats;
//# sourceMappingURL=testController.js.map