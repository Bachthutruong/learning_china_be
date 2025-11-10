import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserQuestionProgress from '../models/UserQuestionProgress';
import Question from '../models/Question';
import TestHistory from '../models/TestHistory';
import User from '../models/User';

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
  if (!mongoUri) {
    console.error('Missing MONGODB_URI/DATABASE_URL in environment.');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const progresses = await UserQuestionProgress.find({});
  console.log(`Found ${progresses.length} progress records.`);

  let created = 0;
  for (const p of progresses) {
    try {
      const user = await User.findById(p.userId);
      const question = await Question.findById(p.questionId);
      if (!user || !question) continue;

      // Check if we already have at least one history entry for this user-question pair
      const exist = await TestHistory.findOne({
        userId: user._id,
        'details.questionId': question._id
      });
      if (exist) continue;

      await TestHistory.create({
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
      } as any);
      created++;
    } catch (e) {
      console.error('Backfill error for progress', p._id, e);
    }
  }

  console.log(`Backfill complete. Created ${created} TestHistory records.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Backfill fatal error:', e);
  process.exit(1);
});


