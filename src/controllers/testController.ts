import { Request, Response } from 'express';
import Test from '../models/Test';
import User from '../models/User';
import Question from '../models/Question';
import { validationResult } from 'express-validator';
import TestHistory from '../models/TestHistory';
import { checkAndUpdateUserLevel } from '../utils/levelUtils';

export const getTests = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
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
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTest = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const testData = req.body;
    const test = new Test(testData);
    await test.save();

    res.status(201).json({
      message: 'Test created successfully',
      test
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const testData = req.body;
    
    const test = await Test.findByIdAndUpdate(
      id,
      testData,
      { new: true }
    );

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json({
      message: 'Test updated successfully',
      test
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const test = await Test.findByIdAndDelete(id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start a new test session - deduct 10,000 coins
export const startTest = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
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
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get random questions by level
export const getRandomQuestions = async (req: any, res: Response) => {
  try {
    const { level } = req.query;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const questionLevel = level ? parseInt(level as string) : user.level;
    
    // Get all questions from the question bank for this level
    const questions = await Question.find({ level: questionLevel });
    
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
  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit test answers and get detailed report
export const submitTest = async (req: any, res: Response) => {
  try {
    const { answers, questionIds } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get questions with correct answers
    const questions = await Question.find({ _id: { $in: questionIds } });
    
    let correctCount = 0;
    let totalQuestions = answers.length;
    const correctQuestions: any[] = [];
    const wrongQuestions: any[] = [];
    
    // Check each answer and update per-question progress
    for (let index = 0; index < answers.length; index++) {
      const userAnswer = answers[index];
      const question = questions.find((q: any) => q._id.toString() === questionIds[index]);
      if (!question) continue;

      const { isCorrect, canonicalCorrect } = evaluateAnswer(question, userAnswer);
      // Normalize primitives to numbers for choices
      const normalizedUserAnswer = Array.isArray(userAnswer)
        ? userAnswer.map((v: any) => (typeof v === 'string' && /^\d+$/.test(v) ? parseInt(v, 10) : v))
        : (typeof userAnswer === 'string' && /^\d+$/.test(userAnswer) ? parseInt(userAnswer, 10) : userAnswer)

      if (isCorrect) {
        correctCount++;
        correctQuestions.push({
          questionId: question._id,
          question: question.question,
          userAnswer: normalizedUserAnswer,
          correctAnswer: canonicalCorrect,
          options: question.options || undefined,
          explanation: question.explanation
        });
      } else {
        wrongQuestions.push({
          questionId: question._id,
          question: question.question,
          userAnswer: normalizedUserAnswer,
          correctAnswer: canonicalCorrect,
          options: question.options || undefined,
          explanation: question.explanation
        });
      }

      // Persist user progress
      try {
        const UserQuestionProgress = (await import('../models/UserQuestionProgress')).default;
        await UserQuestionProgress.findOneAndUpdate(
          { userId: user._id, questionId: question._id },
          { $set: { correct: isCorrect, lastAttemptAt: new Date() }, $inc: { attempts: 1 } },
          { upsert: true }
        );
      } catch (e) {
        console.error('Update UserQuestionProgress failed:', e);
      }
    }
    
    // Calculate rewards: 10 coins + 100 exp per correct answer
    const totalCoinsReward = correctCount * 10;
    const totalExpReward = correctCount * 10;
    
    // Update user stats
    user.coins += totalCoinsReward;
    user.experience += totalExpReward;
    await user.save();

    // Record coin transaction
    try {
      const CoinTransaction = (await import('../models/CoinTransaction')).default;
      await CoinTransaction.create({
        userId: user._id,
        amount: totalCoinsReward,
        type: 'earn',
        category: 'test',
        description: `Thưởng làm đúng ${correctCount}/${totalQuestions} câu hỏi`,
        balanceAfter: user.coins,
        metadata: { correctCount, totalQuestions }
      });
    } catch (e) {
      console.error('Failed to record coin transaction (test):', e);
    }

    // Persist test history for admin viewing (await to ensure availability)
    try {
      await TestHistory.create({
        userId: user._id,
        level: user.level,
        totalQuestions,
        correctCount,
        wrongCount: totalQuestions - correctCount,
        rewards: { coins: totalCoinsReward, experience: totalExpReward },
        details: [...correctQuestions.map((d: any) => ({
          questionId: d.questionId,
          question: d.question,
          userAnswer: d.userAnswer,
          correctAnswer: d.correctAnswer,
          options: d.options,
          correct: true
        })), ...wrongQuestions.map((d: any) => ({
          questionId: d.questionId,
          question: d.question,
          userAnswer: d.userAnswer,
          correctAnswer: d.correctAnswer,
          options: d.options,
          correct: false
        }))]
      })
    } catch (err) {
      console.error('Failed to save test history:', err)
    }

    // Check for level up
    const levelResult = await checkAndUpdateUserLevel((user._id as any).toString());

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
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to check if answer is correct
function evaluateAnswer(question: any, userAnswer: any): { isCorrect: boolean, canonicalCorrect: any } {
  if (question.questionType === 'multiple-choice') {
    if (Array.isArray(question.correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        const isCorrect = JSON.stringify([...userAnswer].sort()) === JSON.stringify([...question.correctAnswer].sort())
        return { isCorrect, canonicalCorrect: question.correctAnswer }
      }
      return { isCorrect: false, canonicalCorrect: question.correctAnswer }
    } else {
      return { isCorrect: userAnswer === question.correctAnswer, canonicalCorrect: question.correctAnswer }
    }
  }

  if (question.questionType === 'fill-blank') {
    const ca = typeof question.correctAnswer === 'string' ? question.correctAnswer : ''
    return { isCorrect: String(userAnswer || '').trim().toLowerCase() === ca.trim().toLowerCase(), canonicalCorrect: ca }
  }

  if (question.questionType === 'reading-comprehension') {
    const correctArray = Array.isArray(question.subQuestions) ? question.subQuestions.map((sq: any) => sq.correctAnswer) : []
    if (Array.isArray(userAnswer)) {
      const isCorrect = correctArray.length === userAnswer.length && correctArray.every((v: any, i: number) => v === userAnswer[i])
      return { isCorrect, canonicalCorrect: correctArray }
    }
    return { isCorrect: false, canonicalCorrect: correctArray }
  }

  if (question.questionType === 'sentence-order') {
    const correctOrder = Array.isArray(question.correctOrder) ? question.correctOrder : question.correctAnswer
    const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctOrder)
    return { isCorrect, canonicalCorrect: correctOrder }
  }

  return { isCorrect: false, canonicalCorrect: question.correctAnswer }
}

export const getTestByLevel = async (req: any, res: Response) => {
  try {
    const { level } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user can access this level
    if (parseInt(level) > user.level) {
      return res.status(403).json({ 
        message: 'You need to complete the proficiency test to access higher levels' 
      });
    }
    
    const tests = await Test.find({ level: parseInt(level) })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(tests);
  } catch (error) {
    console.error('Get test by level error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTestStats = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
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
  } catch (error) {
    console.error('Get test stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get test statistics by month - list of users who took tests
export const getTestStatisticsByMonth = async (req: any, res: Response) => {
  try {
    const { year, month } = req.query;
    
    // Validate year and month
    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }
    
    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ message: 'Invalid year or month' });
    }
    
    // Calculate start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    
    // Get all test histories for this month
    const testHistories = await TestHistory.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('userId', 'name email level')
    .sort({ createdAt: -1 });
    
    // Group by user and calculate statistics
    const userStatsMap = new Map();
    
    testHistories.forEach((history: any) => {
      // Skip if userId is null or doesn't exist
      if (!history.userId || !history.userId._id) {
        return;
      }
      
      const userId = history.userId._id.toString();
      const userName = history.userId.name || history.userId.email || 'Unknown';
      const userEmail = history.userId.email || 'N/A';
      const userLevel = history.userId.level || 1;
      
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          userId,
          userName,
          userEmail,
          userLevel,
          totalTests: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalCoinsEarned: 0,
          totalExperienceEarned: 0,
          averageScore: 0,
          lastTestDate: null
        });
      }
      
      const stats = userStatsMap.get(userId);
      stats.totalTests += 1;
      stats.totalQuestions += history.totalQuestions || 0;
      stats.totalCorrect += history.correctCount || 0;
      stats.totalWrong += history.wrongCount || 0;
      stats.totalCoinsEarned += (history.rewards?.coins || 0);
      stats.totalExperienceEarned += (history.rewards?.experience || 0);
      
      if (!stats.lastTestDate || history.createdAt > stats.lastTestDate) {
        stats.lastTestDate = history.createdAt;
      }
    });
    
    // Calculate average scores
    const statistics = Array.from(userStatsMap.values()).map((stats: any) => {
      stats.averageScore = stats.totalQuestions > 0 
        ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) 
        : 0;
      return stats;
    });
    
    // Sort by total tests (descending)
    statistics.sort((a: any, b: any) => b.totalTests - a.totalTests);
    
    res.json({
      year: yearNum,
      month: monthNum,
      monthName: new Date(yearNum, monthNum - 1).toLocaleString('vi-VN', { month: 'long' }),
      totalUsers: statistics.length,
      totalTests: testHistories.length,
      statistics
    });
  } catch (error) {
    console.error('Get test statistics by month error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Monthly test-takers statistics
// GET /tests/stats/monthly?month=YYYY-MM
export const getMonthlyTestTakers = async (req: any, res: Response) => {
  try {
    const { month } = req.query as { month?: string };
    // Determine time window
    let start: Date;
    let end: Date;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map((v) => parseInt(v, 10));
      // JS month is 0-based
      start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    } else {
      // Default to current month (UTC boundary)
      const now = new Date();
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    }

    const agg = await TestHistory.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: '$userId',
          testsCount: { $sum: 1 },
          totalCorrect: { $sum: '$correctCount' },
          totalWrong: { $sum: '$wrongCount' }
        }
      },
      { $sort: { testsCount: -1, totalCorrect: -1 } }
    ]);

    // hydrate user info
    const results = await Promise.all(
      agg.map(async (r: any) => {
        const u = await User.findById(r._id).select('name email level');
        return {
          userId: String(r._id),
          name: u?.name || 'Unknown',
          email: u?.email || '',
          level: u?.level ?? null,
          testsCount: r.testsCount,
          totalCorrect: r.totalCorrect,
          totalWrong: r.totalWrong,
          accuracy: r.totalCorrect + r.totalWrong > 0 ? Math.round((r.totalCorrect / (r.totalCorrect + r.totalWrong)) * 100) : 0
        };
      })
    );

    res.json({
      month: month || null,
      start,
      end,
      results
    });
  } catch (error) {
    console.error('Get monthly test-takers stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
