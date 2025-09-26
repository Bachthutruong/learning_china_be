import { Request, Response } from 'express';
import UserVocabulary from '../models/UserVocabulary';
import Vocabulary from '../models/Vocabulary';
import Topic from '../models/Topic';
import User from '../models/User';
import { validationResult } from 'express-validator';

// Get user's vocabulary learning progress
export const getUserVocabularyProgress = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    
    const userVocabularies = await UserVocabulary.find({ userId })
      .populate('vocabularyId')
      .sort({ addedAt: -1 });

    const stats = {
      total: userVocabularies.length,
      learning: userVocabularies.filter(uv => uv.status === 'learning').length,
      known: userVocabularies.filter(uv => uv.status === 'known').length,
      needsStudy: userVocabularies.filter(uv => uv.status === 'needs-study').length,
      skipped: userVocabularies.filter(uv => uv.status === 'skipped').length
    };

    res.json({
      userVocabularies,
      stats
    });
  } catch (error) {
    console.error('Get user vocabulary progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vocabulary suggestions based on user's level and preferences
export const getVocabularySuggestions = async (req: any, res: Response) => {
  try {
    const { topic, keywords, limit = 10 } = req.query;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query: any = {
      level: { $lte: user.level }
    };

    // If topic is provided, filter by topic
    if (topic) {
      query.topics = topic;
    }

    // If keywords are provided, search in word, meaning, or pronunciation
    if (keywords) {
      query.$or = [
        { word: { $regex: keywords, $options: 'i' } },
        { meaning: { $regex: keywords, $options: 'i' } },
        { pronunciation: { $regex: keywords, $options: 'i' } }
      ];
    }

    // Get vocabularies that user hasn't added yet
    const userVocabularyIds = await UserVocabulary.find({ userId }).select('vocabularyId');
    const existingIds = userVocabularyIds.map(uv => uv.vocabularyId);
    
    if (existingIds.length > 0) {
      query._id = { $nin: existingIds };
    }

    const suggestions = await Vocabulary.find(query)
      .limit(parseInt(limit as string))
      .sort({ level: 1, createdAt: -1 });

    res.json({
      suggestions,
      total: suggestions.length
    });
  } catch (error) {
    console.error('Get vocabulary suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add vocabulary to user's learning list
export const addVocabularyToLearning = async (req: any, res: Response) => {
  try {
    const { vocabularyIds, customTopic } = req.body;
    const userId = req.user._id;

    if (!vocabularyIds || !Array.isArray(vocabularyIds)) {
      return res.status(400).json({ message: 'Vocabulary IDs are required' });
    }

    const addedVocabularies = [];

    for (const vocabularyId of vocabularyIds) {
      // Check if already exists
      const existing = await UserVocabulary.findOne({ userId, vocabularyId });
      if (existing) {
        continue; // Skip if already exists
      }

      const userVocabulary = new UserVocabulary({
        userId,
        vocabularyId,
        customTopic,
        isCustom: !!customTopic
      });

      await userVocabulary.save();
      addedVocabularies.push(userVocabulary);
    }

    res.json({
      message: 'Vocabulary added to learning list successfully',
      addedCount: addedVocabularies.length
    });
  } catch (error) {
    console.error('Add vocabulary to learning error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get next vocabulary to learn
export const getNextVocabularyToLearn = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    
    // Get next vocabulary in learning status
    const userVocabulary = await UserVocabulary.findOne({ 
      userId, 
      status: 'learning' 
    }).populate('vocabularyId');

    if (!userVocabulary) {
      return res.status(404).json({ message: 'No more vocabulary to learn' });
    }

    res.json({
      userVocabulary,
      vocabulary: userVocabulary.vocabularyId
    });
  } catch (error) {
    console.error('Get next vocabulary to learn error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update vocabulary learning status
export const updateVocabularyStatus = async (req: any, res: Response) => {
  try {
    const { userVocabularyId, status } = req.body;
    const userId = req.user._id;

    const userVocabulary = await UserVocabulary.findOne({ 
      _id: userVocabularyId, 
      userId 
    });

    if (!userVocabulary) {
      return res.status(404).json({ message: 'User vocabulary not found' });
    }

    userVocabulary.status = status;
    userVocabulary.studyCount += 1;
    userVocabulary.lastStudied = new Date();

    if (status === 'known') {
      userVocabulary.learnedAt = new Date();
    }

    await userVocabulary.save();

    res.json({
      message: 'Vocabulary status updated successfully',
      userVocabulary
    });
  } catch (error) {
    console.error('Update vocabulary status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vocabulary quiz questions
export const getVocabularyQuiz = async (req: any, res: Response) => {
  try {
    const { userVocabularyId } = req.params;
    const userId = req.user._id;

    const userVocabulary = await UserVocabulary.findOne({ 
      _id: userVocabularyId, 
      userId 
    }).populate('vocabularyId');

    if (!userVocabulary) {
      return res.status(404).json({ message: 'User vocabulary not found' });
    }

    const vocabulary = userVocabulary.vocabularyId as any;
    
    // Get random questions from vocabulary (max 3)
    const questions = vocabulary.questions || [];
    const randomQuestions = questions
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(3, questions.length));

    // If no questions available, create simple questions
    if (randomQuestions.length === 0) {
      const simpleQuestions = [
        {
          question: `Từ "${vocabulary.word}" có nghĩa là gì?`,
          options: [
            vocabulary.meaning,
            // Get 3 random wrong options from other vocabularies
            ...(await getRandomMeanings(vocabulary._id, 3))
          ].sort(() => 0.5 - Math.random()),
          correctAnswer: 0,
          explanation: `"${vocabulary.word}" có nghĩa là "${vocabulary.meaning}"`
        }
      ];
      
      res.json({
        vocabulary: {
          id: vocabulary._id,
          word: vocabulary.word,
          meaning: vocabulary.meaning
        },
        questions: simpleQuestions
      });
    } else {
      res.json({
        vocabulary: {
          id: vocabulary._id,
          word: vocabulary.word,
          meaning: vocabulary.meaning
        },
        questions: randomQuestions
      });
    }
  } catch (error) {
    console.error('Get vocabulary quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete vocabulary learning with quiz
export const completeVocabularyLearning = async (req: any, res: Response) => {
  try {
    const { userVocabularyId, quizAnswers } = req.body;
    const userId = req.user._id;

    const userVocabulary = await UserVocabulary.findOne({ 
      _id: userVocabularyId, 
      userId 
    }).populate('vocabularyId');

    if (!userVocabulary) {
      return res.status(404).json({ message: 'User vocabulary not found' });
    }

    const vocabulary = userVocabulary.vocabularyId as any;
    const questions = vocabulary.questions || [];
    
    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = Math.min(quizAnswers.length, questions.length);
    
    for (let i = 0; i < totalQuestions; i++) {
      if (questions[i] && quizAnswers[i] === questions[i].correctAnswer) {
        correctAnswers++;
      }
    }

    const score = (correctAnswers / totalQuestions) * 100;
    const passed = score >= 70; // 70% to pass

    if (passed) {
      userVocabulary.status = 'known';
      userVocabulary.learnedAt = new Date();
      
      // Add experience and coins
      const user = await User.findById(userId);
      if (user) {
        user.experience += 5;
        user.coins += 2;
        await user.save();
      }
    } else {
      userVocabulary.status = 'needs-study';
    }

    userVocabulary.studyCount += 1;
    userVocabulary.lastStudied = new Date();
    await userVocabulary.save();

    const user = await User.findById(userId);
    
    res.json({
      message: passed ? 'Vocabulary learned successfully!' : 'Keep studying this vocabulary',
      result: {
        score,
        correctAnswers,
        totalQuestions,
        passed
      },
      user: {
        level: user?.level || 1,
        experience: user?.experience || 0,
        coins: user?.coins || 0
      }
    });
  } catch (error) {
    console.error('Complete vocabulary learning error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search vocabulary by keywords
export const searchVocabularyByKeywords = async (req: any, res: Response) => {
  try {
    const { keywords } = req.query;
    const userId = req.user._id;

    if (!keywords) {
      return res.status(400).json({ message: 'Keywords are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const query = {
      level: { $lte: user.level },
      $or: [
        { word: { $regex: keywords, $options: 'i' } },
        { meaning: { $regex: keywords, $options: 'i' } },
        { pronunciation: { $regex: keywords, $options: 'i' } }
      ]
    };

    const vocabularies = await Vocabulary.find(query).limit(20);

    res.json({
      vocabularies,
      total: vocabularies.length
    });
  } catch (error) {
    console.error('Search vocabulary by keywords error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get random meanings for wrong options
async function getRandomMeanings(excludeId: string, count: number): Promise<string[]> {
  const vocabularies = await Vocabulary.find({ 
    _id: { $ne: excludeId } 
  }).limit(count * 2).select('meaning');
  
  return vocabularies
    .map(v => v.meaning)
    .sort(() => 0.5 - Math.random())
    .slice(0, count);
}
