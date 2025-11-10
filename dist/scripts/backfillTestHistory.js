"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const UserQuestionProgress_1 = __importDefault(require("../models/UserQuestionProgress"));
const Question_1 = __importDefault(require("../models/Question"));
const TestHistory_1 = __importDefault(require("../models/TestHistory"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
async function run() {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
    if (!mongoUri) {
        console.error('Missing MONGODB_URI/DATABASE_URL in environment.');
        process.exit(1);
    }
    await mongoose_1.default.connect(mongoUri);
    console.log('Connected to MongoDB');
    const progresses = await UserQuestionProgress_1.default.find({});
    console.log(`Found ${progresses.length} progress records.`);
    let created = 0;
    for (const p of progresses) {
        try {
            const user = await User_1.default.findById(p.userId);
            const question = await Question_1.default.findById(p.questionId);
            if (!user || !question)
                continue;
            // Check if we already have at least one history entry for this user-question pair
            const exist = await TestHistory_1.default.findOne({
                userId: user._id,
                'details.questionId': question._id
            });
            if (exist)
                continue;
            await TestHistory_1.default.create({
                userId: user._id,
                level: user.level,
                totalQuestions: 1,
                correctCount: p.correct ? 1 : 0,
                wrongCount: p.correct ? 0 : 1,
                rewards: { coins: 0, experience: 0 },
                details: [{
                        questionId: question._id,
                        question: question.question,
                        // Historic user answer is not stored in progress; we cannot reconstruct it
                        userAnswer: null,
                        correctAnswer: question.questionType === 'sentence-order'
                            ? (question.correctOrder ?? [])
                            : (question.correctAnswer),
                        options: question.options || undefined,
                        correct: !!p.correct
                    }],
                createdAt: p.lastAttemptAt || new Date()
            });
            created++;
        }
        catch (e) {
            console.error('Backfill error for progress', p._id, e);
        }
    }
    console.log(`Backfill complete. Created ${created} TestHistory records.`);
    await mongoose_1.default.disconnect();
}
run().catch((e) => {
    console.error('Backfill fatal error:', e);
    process.exit(1);
});
