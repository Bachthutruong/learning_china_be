import { Request, Response } from 'express';
import Test from '../models/Test';
import User from '../models/User';
import { validationResult } from 'express-validator';

export const getTests = async (req: any, res: Response) => {
  try {
    const { level, page = 1, limit = 10 } = req.query;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let query: any = {};
    
    // Level progression logic:
    // - User starts with level 1 tests only
    // - To unlock higher levels, they must either:
    //   1. Complete all level 1 tests, OR
    //   2. Pass a proficiency test
    let accessibleLevel = 1;
    
    if (user.level > 1) {
      // User has unlocked higher levels through proficiency test
      accessibleLevel = user.level;
    } else {
      // Check if user has completed all level 1 tests
      const completedLevel1Tests = await Test.countDocuments({ 
        level: 1, 
        completedBy: user._id 
      });
      const totalLevel1Tests = await Test.countDocuments({ level: 1 });
      
      if (completedLevel1Tests >= totalLevel1Tests && totalLevel1Tests > 0) {
        accessibleLevel = 2; // Unlock level 2
      }
    }
    
    // Filter by accessible level
    if (level) {
      const requestedLevel = parseInt(level as string);
      if (requestedLevel > accessibleLevel) {
        return res.status(403).json({ 
          message: `You need to complete level ${requestedLevel - 1} tests first or pass a proficiency test to unlock level ${requestedLevel}` 
        });
      }
      query.level = requestedLevel;
    } else {
      query.level = { $lte: accessibleLevel };
    }

    const tests = await Test.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Test.countDocuments(query);

    res.json({
      tests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      accessibleLevel,
      userLevel: user.level
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

export const submitTest = async (req: any, res: Response) => {
  try {
    const { testId, answers, timeSpent } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has enough coins
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    if (user.coins < test.requiredCoins) {
      return res.status(400).json({ message: 'Not enough coins' });
    }
    
    // Calculate score
    let correctAnswers = 0;
    const detailedResults = test.questions.map((question, index) => {
      const isCorrect = answers[index] === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        question: question.question,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      };
    });
    
    const score = (correctAnswers / test.questions.length) * 100;
    const passed = score >= 70; // 70% to pass
    
    // Only give rewards if passed
    if (passed) {
      user.coins -= test.requiredCoins;
      user.experience += test.rewardExperience;
      user.coins += test.rewardCoins;
      
      // Check for level up
      const levels = [0, 100, 300, 600, 1000, 1500, 2100];
      if (user.experience >= levels[user.level] && user.level < 6) {
        user.level += 1;
      }
      
      // Add user to completedBy list if not already there
      if (!test.completedBy.includes(user._id as any)) {
        test.completedBy.push(user._id as any);
        await test.save();
      }
      
      await user.save();
    }

    res.json({
      message: passed ? 'Test passed successfully!' : 'Test failed. Try again!',
      result: {
        score,
        correctAnswers,
        totalQuestions: test.questions.length,
        timeSpent,
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
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
