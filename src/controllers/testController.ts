import { Request, Response } from 'express';
import Test from '../models/Test';
import User from '../models/User';
import Question from '../models/Question';
import { validationResult } from 'express-validator';
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
    
    // Check each answer
    answers.forEach((userAnswer: any, index: number) => {
      const question = questions.find((q: any) => q._id.toString() === questionIds[index]);
      if (!question) return;
      
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
      } else {
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
function checkAnswer(question: any, userAnswer: any): boolean {
  if (question.questionType === 'multiple-choice') {
    if (Array.isArray(question.correctAnswer)) {
      // Multiple correct answers
      if (Array.isArray(userAnswer)) {
        return JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correctAnswer.sort());
      }
      return false;
    } else {
      // Single correct answer
      return userAnswer === question.correctAnswer;
    }
  } else if (question.questionType === 'fill-blank') {
    return userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
  } else if (question.questionType === 'reading-comprehension') {
    if (Array.isArray(question.correctAnswer)) {
      // Multiple correct answers
      if (Array.isArray(userAnswer)) {
        return JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correctAnswer.sort());
      }
      return false;
    } else {
      // Single correct answer
      return userAnswer === question.correctAnswer;
    }
  } else if (question.questionType === 'sentence-order') {
    return JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
  }
  
  return false;
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
