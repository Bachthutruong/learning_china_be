import { Request, Response } from 'express';
import User from '../models/User';
import Question from '../models/Question';
import ProficiencyQuestion from '../models/ProficiencyQuestion';
import ProficiencyConfig from '../models/ProficiencyConfig';
import { checkAndUpdateUserLevel } from '../utils/levelUtils';

// Get active proficiency test configuration
export const getProficiencyConfig = async (req: any, res: Response) => {
  try {
    const config = await ProficiencyConfig.findOne({ isActive: true });
    
    if (!config) {
      return res.status(404).json({ message: 'No active proficiency test configuration found' });
    }

    res.json({
      config: {
        id: config._id,
        name: config.name,
        description: config.description,
        cost: config.cost,
        initialQuestions: config.initialQuestions,
        branches: config.branches
      }
    });
  } catch (error) {
    console.error('Get proficiency config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start proficiency test
export const startProficiencyTest = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const config = await ProficiencyConfig.findOne({ isActive: true });
    if (!config) {
      return res.status(404).json({ message: 'No active proficiency test configuration found' });
    }

    // Check if user has enough coins
    if (user.coins < config.cost) {
      return res.status(400).json({ 
        message: 'Không đủ xu để làm test năng lực',
        requiredCoins: config.cost,
        userCoins: user.coins,
        insufficientCoins: true
      });
    }

    // Deduct coins
    user.coins -= config.cost;
    await user.save();

    // Get initial questions based on configuration
    const initialQuestions = [];
    for (const initialConfig of config.initialQuestions) {
      const questions = await ProficiencyQuestion.find({ level: initialConfig.level })
        .limit(initialConfig.count)
        .sort({ createdAt: -1 });
      
      initialQuestions.push(...questions.map(q => ({
        ...q.toObject(),
        proficiencyLevel: initialConfig.level
      })));
    }

    res.json({
      questions: initialQuestions,
      totalQuestions: initialQuestions.length,
      timeLimit: 30, // minutes
      description: config.description,
      configId: config._id,
      phase: 'initial',
      userCoins: user.coins
    });
  } catch (error) {
    console.error('Start proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit proficiency test answers
export const submitProficiencyTest = async (req: any, res: Response) => {
  try {
    const { answers, questionIds, phase, configId } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const config = await ProficiencyConfig.findById(configId);
    if (!config) {
      return res.status(404).json({ message: 'Proficiency test configuration not found' });
    }

    // Extract questionIds from answers if not provided
    const extractedQuestionIds = questionIds || answers.map((answer: any) => answer.questionId);
    
    // Get questions with correct answers
    const questions = await ProficiencyQuestion.find({ _id: { $in: extractedQuestionIds } });
    
    // Count correct answers
    let correctCount = 0;
    const questionResults: any[] = [];
    
    answers.forEach((userAnswer: any, index: number) => {
      const question = questions.find((q: any) => q._id.toString() === userAnswer.questionId);
      if (!question) return;
      
      const isCorrect = checkAnswer(question, userAnswer.answer);
      if (isCorrect) correctCount++;
      
      questionResults.push({
        questionId: question._id,
        question: question.question,
        userAnswer: userAnswer.answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        level: question.level
      });
    });

    // Debug log
    console.log('Debug - Phase:', phase, 'CorrectCount:', correctCount);
    console.log('Debug - Available branches:', config.branches.map(b => ({
      name: b.name,
      fromPhase: b.condition.fromPhase,
      correctRange: b.condition.correctRange
    })));
    
    // Check each branch condition
    config.branches.forEach((branch, index) => {
      console.log(`Branch ${index}:`, {
        name: branch.name,
        fromPhase: branch.condition.fromPhase,
        correctRange: branch.condition.correctRange,
        phaseMatch: branch.condition.fromPhase === phase,
        countMatch: correctCount >= branch.condition.correctRange[0] && correctCount <= branch.condition.correctRange[1]
      });
    });

    // Recursive function to find matching branch in nested structure
    const findMatchingBranch = (branches: any[], currentPhase: string, correctCount: number): any => {
      for (const branch of branches) {
        if (branch.condition.fromPhase === currentPhase &&
            correctCount >= branch.condition.correctRange[0] &&
            correctCount <= branch.condition.correctRange[1]) {
          return branch;
        }
        
        // Recursively search in subBranches
        if (branch.subBranches && branch.subBranches.length > 0) {
          const foundInSubBranches = findMatchingBranch(branch.subBranches, currentPhase, correctCount);
          if (foundInSubBranches) {
            return foundInSubBranches;
          }
        }
      }
      return null;
    };

    // Find matching branch (including nested subBranches)
    const matchingBranch = findMatchingBranch(config.branches, phase, correctCount);

    if (!matchingBranch) {
      return res.status(400).json({ 
        message: 'No matching branch found for current results',
        debug: {
          phase,
          correctCount,
          availableBranches: config.branches.map(b => ({
            name: b.name,
            fromPhase: b.condition.fromPhase,
            correctRange: b.condition.correctRange
          }))
        }
      });
    }

    // If this branch leads to a final result
    if (matchingBranch.resultLevel !== undefined) {
      // Calculate final level based on result
      const finalLevel = matchingBranch.resultLevel;
      
      // Update user level if needed
      if (finalLevel > user.level) {
        user.level = finalLevel;
        await user.save();
      }

      // Calculate rewards
      const experienceReward = correctCount * 50; // 50 XP per correct answer
      const coinsReward = correctCount * 20; // 20 coins per correct answer
      
      user.experience += experienceReward;
      user.coins += coinsReward;
      await user.save();

      return res.json({
        completed: true,
        result: {
          level: finalLevel,
          correctCount,
          totalQuestions: answers.length,
          score: Math.round((correctCount / answers.length) * 100),
          rewards: {
            experience: experienceReward,
            coins: coinsReward
          }
        },
        questionResults,
        user: {
          level: user.level,
          experience: user.experience,
          coins: user.coins
        }
      });
    }

    // If this branch leads to next phase, get next questions
    if (matchingBranch.nextPhase) {
      const nextQuestions = [];
      for (const nextConfig of matchingBranch.nextQuestions) {
        const questions = await ProficiencyQuestion.find({ level: nextConfig.level })
          .limit(nextConfig.count)
          .sort({ createdAt: -1 });
        
        nextQuestions.push(...questions.map(q => ({
          ...q.toObject(),
          proficiencyLevel: nextConfig.level
        })));
      }

      // Check if there are subBranches for the next phase
      const hasSubBranches = matchingBranch.subBranches && matchingBranch.subBranches.length > 0;
      
      return res.json({
        nextPhase: true,
        phase: matchingBranch.nextPhase,
        questions: nextQuestions,
        totalQuestions: nextQuestions.length,
        timeLimit: matchingBranch.nextPhase === 'final' ? 25 : 15,
        branchName: matchingBranch.name,
        hasSubBranches: hasSubBranches,
        subBranches: hasSubBranches ? matchingBranch.subBranches : [],
        previousResults: {
          correctCount,
          totalQuestions: answers.length,
          questionResults
        }
      });
    }

    res.status(400).json({ message: 'Invalid branch configuration' });
  } catch (error) {
    console.error('Submit proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to check if answer is correct
function checkAnswer(question: any, userAnswer: any): boolean {
  if (question.questionType === 'multiple-choice' || question.questionType === 'reading-comprehension') {
    if (Array.isArray(question.correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        return JSON.stringify(userAnswer.sort()) === JSON.stringify(question.correctAnswer.sort());
      }
      return false;
    } else {
      return userAnswer === question.correctAnswer;
    }
  } else if (question.questionType === 'fill-blank') {
    return userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
  } else if (question.questionType === 'sentence-order') {
    return JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
  }
  return false;
}

// Get proficiency test history for user
export const getProficiencyHistory = async (req: any, res: Response) => {
  try {
    // This would need a separate ProficiencyTestResult model to store test results
    // For now, return empty array
    res.json({
      history: [],
      message: 'Proficiency test history feature coming soon'
    });
  } catch (error) {
    console.error('Get proficiency history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};