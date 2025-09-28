"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuestionsByType = exports.submitAdvancedTest = exports.createAdvancedTest = exports.getQuestionTypes = void 0;
const Test_1 = __importDefault(require("../models/Test"));
const QuestionType_1 = __importDefault(require("../models/QuestionType"));
const User_1 = __importDefault(require("../models/User"));
const express_validator_1 = require("express-validator");
// Get all question types
const getQuestionTypes = async (req, res) => {
    try {
        const questionTypes = await QuestionType_1.default.find({ isActive: true }).sort({ type: 1 });
        res.json(questionTypes);
    }
    catch (error) {
        console.error('Get question types error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getQuestionTypes = getQuestionTypes;
// Create advanced test with multiple question types
const createAdvancedTest = async (req, res) => {
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
            message: 'Advanced test created successfully',
            test
        });
    }
    catch (error) {
        console.error('Create advanced test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createAdvancedTest = createAdvancedTest;
// Submit advanced test with different question types
const submitAdvancedTest = async (req, res) => {
    try {
        const { testId, answers } = req.body;
        const userId = req.user._id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const test = await Test_1.default.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        // Check if user has enough coins
        if (user.coins < test.requiredCoins) {
            return res.status(400).json({ message: 'Not enough coins' });
        }
        let correctAnswers = 0;
        const detailedResults = [];
        for (let i = 0; i < test.questions.length; i++) {
            const question = test.questions[i];
            const userAnswer = answers[i];
            let isCorrect = false;
            // Check answer based on question type
            switch (question.questionType) {
                case 'multiple-choice':
                    isCorrect = userAnswer === question.correctAnswer;
                    break;
                case 'fill-blank':
                    isCorrect = checkFillBlankAnswer(question, userAnswer);
                    break;
                case 'reading-comprehension':
                    isCorrect = userAnswer === question.correctAnswer;
                    break;
                case 'sentence-order':
                    isCorrect = checkSentenceOrderAnswer(question, userAnswer);
                    break;
                case 'matching':
                    isCorrect = checkMatchingAnswer(question, userAnswer);
                    break;
                case 'true-false':
                    isCorrect = userAnswer === question.isTrue;
                    break;
                default:
                    isCorrect = userAnswer === question.correctAnswer;
            }
            if (isCorrect)
                correctAnswers++;
            detailedResults.push({
                question: question.question,
                userAnswer,
                correctAnswer: getCorrectAnswerForDisplay(question),
                isCorrect,
                explanation: question.explanation
            });
        }
        const score = (correctAnswers / test.questions.length) * 100;
        const passed = score >= 70;
        if (passed) {
            user.coins -= test.requiredCoins;
            user.experience += test.rewardExperience;
            user.coins += test.rewardCoins;
            // Check for level up
            const levels = [0, 100, 300, 600, 1000, 1500, 2100];
            if (user.experience >= levels[user.level] && user.level < 6) {
                user.level += 1;
            }
            await user.save();
        }
        res.json({
            message: passed ? 'Test passed successfully!' : 'Test failed. Try again!',
            result: {
                score,
                correctAnswers,
                totalQuestions: test.questions.length,
                passed,
                detailedResults,
                rewards: passed ? {
                    experience: test.rewardExperience,
                    coins: test.rewardCoins
                } : null
            },
            user: {
                level: user.level,
                experience: user.experience,
                coins: user.coins
            }
        });
    }
    catch (error) {
        console.error('Submit advanced test error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.submitAdvancedTest = submitAdvancedTest;
// Generate test questions by type
const generateQuestionsByType = async (req, res) => {
    try {
        const { type, level, count = 10 } = req.query;
        const userId = req.user._id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let questions = [];
        switch (type) {
            case 'multiple-choice':
                questions = await generateMultipleChoiceQuestions(parseInt(level), parseInt(count));
                break;
            case 'fill-blank':
                questions = await generateFillBlankQuestions(parseInt(level), parseInt(count));
                break;
            case 'reading-comprehension':
                questions = await generateReadingComprehensionQuestions(parseInt(level), parseInt(count));
                break;
            case 'sentence-order':
                questions = await generateSentenceOrderQuestions(parseInt(level), parseInt(count));
                break;
            case 'matching':
                questions = await generateMatchingQuestions(parseInt(level), parseInt(count));
                break;
            case 'true-false':
                questions = await generateTrueFalseQuestions(parseInt(level), parseInt(count));
                break;
            default:
                return res.status(400).json({ message: 'Invalid question type' });
        }
        res.json({
            questions,
            total: questions.length
        });
    }
    catch (error) {
        console.error('Generate questions by type error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.generateQuestionsByType = generateQuestionsByType;
// Helper functions for different question types
function checkFillBlankAnswer(question, userAnswer) {
    if (!question.blanks || !Array.isArray(userAnswer))
        return false;
    for (let i = 0; i < question.blanks.length; i++) {
        if (userAnswer[i] !== question.blanks[i].correctAnswer) {
            return false;
        }
    }
    return true;
}
function checkSentenceOrderAnswer(question, userAnswer) {
    if (!question.correctOrder || !Array.isArray(userAnswer))
        return false;
    return JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
}
function checkMatchingAnswer(question, userAnswer) {
    if (!question.correctMatches || !Array.isArray(userAnswer))
        return false;
    return JSON.stringify(userAnswer) === JSON.stringify(question.correctMatches);
}
function getCorrectAnswerForDisplay(question) {
    switch (question.questionType) {
        case 'fill-blank':
            return question.blanks?.map((blank) => blank.correctAnswer);
        case 'sentence-order':
            return question.correctOrder;
        case 'matching':
            return question.correctMatches;
        case 'true-false':
            return question.isTrue;
        default:
            return question.correctAnswer;
    }
}
// Generate different types of questions (mock implementations)
async function generateMultipleChoiceQuestions(level, count) {
    // Mock implementation - in real app, this would query database
    return Array.from({ length: count }, (_, i) => ({
        question: `Câu hỏi trắc nghiệm ${i + 1} (Level ${level})`,
        questionType: 'multiple-choice',
        options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `Giải thích cho câu hỏi ${i + 1}`
    }));
}
async function generateFillBlankQuestions(level, count) {
    return Array.from({ length: count }, (_, i) => ({
        question: `Điền vào chỗ trống: "Tôi _____ học tiếng Trung" (Level ${level})`,
        questionType: 'fill-blank',
        blanks: [
            { position: 0, correctAnswer: 'đang' }
        ],
        correctAnswer: ['đang'],
        explanation: `Giải thích cho câu điền từ ${i + 1}`
    }));
}
async function generateReadingComprehensionQuestions(level, count) {
    return Array.from({ length: count }, (_, i) => ({
        question: `Câu hỏi đọc hiểu ${i + 1} (Level ${level})`,
        questionType: 'reading-comprehension',
        passage: `Đoạn văn mẫu cho câu hỏi ${i + 1}. Đây là nội dung để người học đọc và trả lời câu hỏi.`,
        options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `Giải thích cho câu đọc hiểu ${i + 1}`
    }));
}
async function generateSentenceOrderQuestions(level, count) {
    return Array.from({ length: count }, (_, i) => ({
        question: `Sắp xếp câu theo thứ tự đúng (Level ${level})`,
        questionType: 'sentence-order',
        sentences: ['Tôi', 'học', 'tiếng Trung', 'mỗi ngày'],
        correctOrder: [0, 1, 2, 3],
        correctAnswer: [0, 1, 2, 3],
        explanation: `Giải thích cho câu sắp xếp ${i + 1}`
    }));
}
async function generateMatchingQuestions(level, count) {
    return Array.from({ length: count }, (_, i) => ({
        question: `Ghép cặp từ vựng (Level ${level})`,
        questionType: 'matching',
        leftItems: ['你好', '谢谢', '再见'],
        rightItems: ['Xin chào', 'Cảm ơn', 'Tạm biệt'],
        correctMatches: [
            { left: 0, right: 0 },
            { left: 1, right: 1 },
            { left: 2, right: 2 }
        ],
        correctAnswer: [
            { left: 0, right: 0 },
            { left: 1, right: 1 },
            { left: 2, right: 2 }
        ],
        explanation: `Giải thích cho câu ghép cặp ${i + 1}`
    }));
}
async function generateTrueFalseQuestions(level, count) {
    return Array.from({ length: count }, (_, i) => ({
        question: `Câu hỏi đúng/sai ${i + 1} (Level ${level})`,
        questionType: 'true-false',
        isTrue: Math.random() > 0.5,
        correctAnswer: Math.random() > 0.5,
        explanation: `Giải thích cho câu đúng/sai ${i + 1}`
    }));
}
//# sourceMappingURL=advancedTestController.js.map