import { Request, Response } from 'express';
import ProficiencyTest from '../models/ProficiencyTest';
import User from '../models/User';
import { validationResult } from 'express-validator';

export const getProficiencyTests = async (req: Request, res: Response) => {
  try {
    const { level } = req.query;
    
    let query: any = {};
    if (level) {
      query.level = level;
    }

    const tests = await ProficiencyTest.find(query).sort({ level: 1 });
    res.json(tests);
  } catch (error) {
    console.error('Get proficiency tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProficiencyTestByLevel = async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    const test = await ProficiencyTest.findOne({ level: level.toUpperCase() });
    
    if (!test) {
      return res.status(404).json({ message: 'Proficiency test not found' });
    }

    res.json(test);
  } catch (error) {
    console.error('Get proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInitialProficiencyTest = async (req: any, res: Response) => {
  try {
    // Get initial test: 2 LV-A, 3 LV-B, 3 LV-C questions
    const lvAQuestions = await ProficiencyTest.findOne({ level: 'A' });
    const lvBQuestions = await ProficiencyTest.findOne({ level: 'B' });
    const lvCQuestions = await ProficiencyTest.findOne({ level: 'C' });
    
    const initialQuestions = [
      ...(lvAQuestions?.questions.slice(0, 2) || []),
      ...(lvBQuestions?.questions.slice(0, 3) || []),
      ...(lvCQuestions?.questions.slice(0, 3) || [])
    ];
    
    res.json({
      questions: initialQuestions,
      totalQuestions: initialQuestions.length,
      description: 'Initial proficiency assessment'
    });
  } catch (error) {
    console.error('Get initial proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProficiencyTest = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const testData = req.body;
    const test = new ProficiencyTest(testData);
    await test.save();

    res.status(201).json({
      message: 'Proficiency test created successfully',
      test
    });
  } catch (error) {
    console.error('Create proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitProficiencyTest = async (req: any, res: Response) => {
  try {
    const { answers, timeSpent } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Initial test: 2 LV-A, 3 LV-B, 3 LV-C (8 questions total)
    const initialAnswers = answers.slice(0, 8);
    const lvACorrect = initialAnswers.slice(0, 2).filter((answer: number, index: number) => 
      answer === 0 // Assuming correct answer is always 0 for simplicity
    ).length;
    const lvBCorrect = initialAnswers.slice(2, 5).filter((answer: number, index: number) => 
      answer === 0
    ).length;
    const lvCCorrect = initialAnswers.slice(5, 8).filter((answer: number, index: number) => 
      answer === 0
    ).length;
    
    const totalCorrect = lvACorrect + lvBCorrect + lvCCorrect;
    let proficiencyLevel = '';
    let additionalQuestions: any[] = [];
    
    // Implement the complex scoring logic
    if (totalCorrect >= 1 && totalCorrect <= 4) {
      // Show 8 more LV-A questions
      additionalQuestions = await getAdditionalQuestions('A', 8);
      proficiencyLevel = 'A1'; // Will be determined after additional questions
    } else if (totalCorrect >= 5 && totalCorrect <= 6) {
      // Show 8 more LV-B questions
      additionalQuestions = await getAdditionalQuestions('B', 8);
      proficiencyLevel = 'A2'; // Will be determined after additional questions
    } else if (totalCorrect >= 7 && totalCorrect <= 8) {
      // Show 14 more LV-C questions
      additionalQuestions = await getAdditionalQuestions('C', 14);
      proficiencyLevel = 'B1'; // Will be determined after additional questions
    }
    
    // If additional questions are needed, return them
    if (additionalQuestions.length > 0) {
      return res.json({
        message: 'Additional questions required',
        additionalQuestions,
        currentScore: totalCorrect,
        nextPhase: true
      });
    }
    
    // Final proficiency level determination
    const finalScore = totalCorrect + (answers.length > 8 ? answers.slice(8).filter((a: number) => a === 0).length : 0);
    
    if (finalScore >= 1 && finalScore <= 9) {
      proficiencyLevel = 'A1';
    } else if (finalScore >= 10 && finalScore <= 14) {
      proficiencyLevel = 'A2';
    } else if (finalScore >= 15 && finalScore <= 19) {
      proficiencyLevel = 'B1';
    } else if (finalScore >= 20 && finalScore <= 24) {
      proficiencyLevel = 'B2';
    } else if (finalScore >= 25 && finalScore <= 29) {
      proficiencyLevel = 'C1';
    } else if (finalScore >= 30) {
      proficiencyLevel = 'C2';
    }
    
    // Update user level based on proficiency
    const proficiencyToLevel: { [key: string]: number } = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };
    
    if (proficiencyToLevel[proficiencyLevel] > user.level) {
      user.level = proficiencyToLevel[proficiencyLevel];
    }
    
    // Add experience and coins
    user.experience += 50; // Bonus for completing proficiency test
    user.coins += 25;
    
    await user.save();

    res.json({
      message: 'Proficiency test completed successfully',
      result: {
        score: finalScore,
        proficiencyLevel,
        rewards: {
          experience: 50,
          coins: 25
        }
      },
      user: {
        level: user.level,
        experience: user.experience,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Submit proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get additional questions
const getAdditionalQuestions = async (level: string, count: number) => {
  // This would fetch questions from the database
  // For now, return mock questions
  return Array.from({ length: count }, (_, i) => ({
    id: `q_${level}_${i}`,
    question: `Question ${i + 1} for level ${level}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0
  }));
};
