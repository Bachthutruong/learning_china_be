"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompetitionStats = exports.getGlobalLeaderboard = exports.getCompetitionLeaderboard = exports.submitCompetition = exports.getCompetitionQuestions = exports.joinCompetition = exports.getCompetitionById = exports.getCompetitions = void 0;
const Competition_1 = __importDefault(require("../models/Competition"));
const CompetitionResult_1 = __importDefault(require("../models/CompetitionResult"));
const User_1 = __importDefault(require("../models/User"));
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const getCompetitions = async (req, res) => {
    try {
        const { status, level } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        if (level && level !== 'All') {
            query.level = level;
        }
        const competitions = await Competition_1.default.find(query)
            .populate('participants', 'name email')
            .sort({ startDate: -1 });
        res.json({ competitions });
    }
    catch (error) {
        console.error('Get competitions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompetitions = getCompetitions;
const getCompetitionById = async (req, res) => {
    try {
        const { id } = req.params;
        const competition = await Competition_1.default.findById(id)
            .populate('participants', 'name email level');
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        res.json(competition);
    }
    catch (error) {
        console.error('Get competition error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompetitionById = getCompetitionById;
const joinCompetition = async (req, res) => {
    try {
        const { competitionId } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const competition = await Competition_1.default.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        // Check if competition is still open
        if (!competition.isActive) {
            return res.status(400).json({ message: 'Competition is not available for joining' });
        }
        // Check if user has enough coins
        if (user.coins < competition.cost) {
            return res.status(400).json({ message: 'Not enough coins to join competition' });
        }
        // Check if user is already a participant
        if (competition.participants.includes(user._id)) {
            return res.status(400).json({ message: 'You are already participating in this competition' });
        }
        // Check if competition is full
        if (competition.maxParticipants && competition.participants.length >= competition.maxParticipants) {
            return res.status(400).json({ message: 'Competition is full' });
        }
        // Deduct coins and add user to participants
        user.coins -= competition.cost;
        competition.participants.push(user._id);
        await user.save();
        await competition.save();
        res.json({
            message: 'Successfully joined competition!',
            user: {
                id: user._id,
                coins: user.coins
            }
        });
    }
    catch (error) {
        console.error('Join competition error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.joinCompetition = joinCompetition;
const getCompetitionQuestions = async (req, res) => {
    try {
        const { competitionId } = req.params;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const competition = await Competition_1.default.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        // Check if user is a participant
        if (!competition.participants.includes(user._id)) {
            return res.status(403).json({ message: 'You are not a participant in this competition' });
        }
        // Check if competition is active
        if (!competition.isActive) {
            return res.status(400).json({ message: 'Competition is not currently active' });
        }
        // Generate questions based on competition level
        let query = {};
        if (competition.level !== 'All') {
            query.level = competition.level;
        }
        // Get random vocabulary for questions
        const vocabulary = await Vocabulary_1.default.aggregate([
            { $match: query },
            { $sample: { size: 20 } } // 20 questions for competition
        ]);
        // Transform vocabulary into question format
        const questions = vocabulary.map((vocab, index) => ({
            id: `q${index + 1}`,
            question: `What is the meaning of "${vocab.hanzi}"?`,
            options: [
                vocab.meaning,
                // Add 3 random wrong options
                ...vocabulary
                    .filter(v => v._id.toString() !== vocab._id.toString())
                    .slice(0, 3)
                    .map(v => v.meaning)
            ].sort(() => Math.random() - 0.5),
            correctAnswer: 0,
            explanation: `The meaning of "${vocab.hanzi}" is "${vocab.meaning}"`
        }));
        res.json({
            competition: {
                id: competition._id,
                title: competition.title,
                timeLimit: 30 // 30 minutes for competition
            },
            questions
        });
    }
    catch (error) {
        console.error('Get competition questions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompetitionQuestions = getCompetitionQuestions;
const submitCompetition = async (req, res) => {
    try {
        const { competitionId, answers, timeSpent } = req.body;
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const competition = await Competition_1.default.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        // Check if user is a participant
        if (!competition.participants.includes(user._id)) {
            return res.status(403).json({ message: 'You are not a participant in this competition' });
        }
        // Check if competition is still active
        if (!competition.isActive) {
            return res.status(400).json({ message: 'Competition is no longer active' });
        }
        // Check if user already submitted
        const existingResult = await CompetitionResult_1.default.findOne({
            competitionId: competition._id,
            userId: user._id
        });
        if (existingResult) {
            return res.status(400).json({ message: 'You have already submitted your answers' });
        }
        // Calculate score
        let correctAnswers = 0;
        const detailedAnswers = answers.map((answer) => {
            const isCorrect = answer.userAnswer === answer.correctAnswer;
            if (isCorrect)
                correctAnswers++;
            return {
                questionId: answer.questionId,
                userAnswer: answer.userAnswer,
                isCorrect,
                timeSpent: answer.timeSpent || 0
            };
        });
        const score = (correctAnswers / answers.length) * 100;
        // Calculate rewards based on score
        let rewardXp = 0;
        let rewardCoins = 0;
        if (score >= 90) {
            rewardXp = competition.prizes.first.xp;
            rewardCoins = competition.prizes.first.coins;
        }
        else if (score >= 80) {
            rewardXp = competition.prizes.second.xp;
            rewardCoins = competition.prizes.second.coins;
        }
        else if (score >= 70) {
            rewardXp = competition.prizes.third.xp;
            rewardCoins = competition.prizes.third.coins;
        }
        else {
            rewardXp = competition.reward.xp;
            rewardCoins = competition.reward.coins;
        }
        // Create competition result
        const result = new CompetitionResult_1.default({
            competitionId: competition._id,
            userId: user._id,
            score,
            timeSpent,
            rewards: {
                xp: rewardXp,
                coins: rewardCoins
            },
            answers: detailedAnswers
        });
        await result.save();
        // Update user rewards
        user.experience += rewardXp;
        user.coins += rewardCoins;
        await user.save();
        res.json({
            message: 'Competition submitted successfully!',
            result: {
                score,
                correctAnswers,
                totalQuestions: answers.length,
                timeSpent,
                rewards: {
                    xp: rewardXp,
                    coins: rewardCoins
                }
            },
            user: {
                level: user.level,
                experience: user.experience,
                coins: user.coins
            }
        });
    }
    catch (error) {
        console.error('Submit competition error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.submitCompetition = submitCompetition;
const getCompetitionLeaderboard = async (req, res) => {
    try {
        const { competitionId } = req.params;
        const results = await CompetitionResult_1.default.find({ competitionId })
            .populate('userId', 'name email')
            .sort({ score: -1, timeSpent: 1 })
            .limit(50);
        // Update ranks
        for (let i = 0; i < results.length; i++) {
            results[i].rank = i + 1;
            await results[i].save();
        }
        res.json({
            leaderboard: results.map(result => ({
                rank: result.rank,
                name: result.userId.name,
                score: result.score,
                timeSpent: result.timeSpent,
                rewards: result.rewards
            }))
        });
    }
    catch (error) {
        console.error('Get competition leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompetitionLeaderboard = getCompetitionLeaderboard;
const getGlobalLeaderboard = async (_req, res) => {
    try {
        const results = await CompetitionResult_1.default.find({})
            .populate('userId', 'name email')
            .sort({ score: -1, timeSpent: 1 })
            .limit(50);
        res.json({
            leaderboard: results.map((r, idx) => ({
                rank: idx + 1,
                name: r.userId?.name || 'Unknown',
                score: r.score,
                timeSpent: r.timeSpent
            }))
        });
    }
    catch (error) {
        console.error('Get global leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getGlobalLeaderboard = getGlobalLeaderboard;
const getCompetitionStats = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const totalCompetitions = await Competition_1.default.countDocuments();
        const userParticipations = await CompetitionResult_1.default.countDocuments({ userId: user._id });
        const userWins = await CompetitionResult_1.default.countDocuments({
            userId: user._id,
            rank: 1
        });
        res.json({
            totalCompetitions,
            userParticipations,
            userWins,
            userLevel: user.level
        });
    }
    catch (error) {
        console.error('Get competition stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCompetitionStats = getCompetitionStats;
