import { Request, Response } from 'express';
import Vocabulary from '../models/Vocabulary';
import Topic from '../models/Topic';
import User from '../models/User';
import { validationResult } from 'express-validator';

export const getVocabularies = async (req: any, res: Response) => {
  try {
    const { level, topic, page = 1, limit = 10, search } = req.query;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let query: any = {};
    
    // Filter by level (user can only access their level and below)
    if (level) {
      query.level = { $lte: parseInt(level as string) };
    } else {
      query.level = { $lte: user.level };
    }
    
    // Filter by topic
    if (topic) {
      query.topics = topic;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } },
        { pronunciation: { $regex: search, $options: 'i' } }
      ];
    }

    const vocabularies = await Vocabulary.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Vocabulary.countDocuments(query);

    res.json({
      vocabularies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get vocabularies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVocabularyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vocabulary = await Vocabulary.findById(id);
    
    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    res.json(vocabulary);
  } catch (error) {
    console.error('Get vocabulary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createVocabulary = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vocabularyData = req.body;
    const vocabulary = new Vocabulary(vocabularyData);
    await vocabulary.save();

    res.status(201).json({
      message: 'Vocabulary created successfully',
      vocabulary
    });
  } catch (error) {
    console.error('Create vocabulary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateVocabulary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vocabularyData = req.body;
    
    const vocabulary = await Vocabulary.findByIdAndUpdate(
      id,
      vocabularyData,
      { new: true }
    );

    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    res.json({
      message: 'Vocabulary updated successfully',
      vocabulary
    });
  } catch (error) {
    console.error('Update vocabulary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteVocabulary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const vocabulary = await Vocabulary.findByIdAndDelete(id);
    
    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    res.json({ message: 'Vocabulary deleted successfully' });
  } catch (error) {
    console.error('Delete vocabulary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTopics = async (req: Request, res: Response) => {
  try {
    const topics = await Topic.find().sort({ name: 1 });
    res.json(topics);
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTopic = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const topic = new Topic(req.body);
    await topic.save();

    res.status(201).json({
      message: 'Topic created successfully',
      topic
    });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSuggestedVocabularies = async (req: any, res: Response) => {
  try {
    const { topic } = req.query;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let query: any = {
      level: { $lte: user.level }
    };
    
    if (topic) {
      query.topics = topic;
    }

    const vocabularies = await Vocabulary.find(query)
      .limit(10)
      .sort({ createdAt: -1 });

    res.json(vocabularies);
  } catch (error) {
    console.error('Get suggested vocabularies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeVocabulary = async (req: any, res: Response) => {
  try {
    const { vocabularyId, quizAnswers } = req.body;
    const user = await User.findById(req.user._id);
    const vocabulary = await Vocabulary.findById(vocabularyId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    // Check quiz answers if provided
    let quizPassed = true;
    if (quizAnswers && vocabulary.questions && vocabulary.questions.length > 0) {
      const correctAnswers = vocabulary.questions.filter((q: any, index: number) => {
        return q.correctAnswer === quizAnswers[index];
      });
      
      // User must get all questions correct to pass
      quizPassed = correctAnswers.length === vocabulary.questions.length;
    }

    if (quizPassed) {
      // Check if vocabulary was already learned before
      const wasAlreadyLearned = user.learnedVocabulary && user.learnedVocabulary.includes(vocabularyId);
      
      if (wasAlreadyLearned) {
        // Already learned vocabulary: 1 XP, 1 coin
        user.experience += 1;
        user.coins += 1;
      } else {
        // New vocabulary: 10 XP, 10 coins
        user.experience += 10;
        user.coins += 10;
      }
      
      // Check for level up
      const levels = [0, 100, 300, 600, 1000, 1500, 2100];
      if (user.experience >= levels[user.level] && user.level < 6) {
        user.level += 1;
      }
      
      // Add to learned vocabulary (you might want to create a separate model for this)
      if (!user.learnedVocabulary) {
        user.learnedVocabulary = [];
      }
      if (!user.learnedVocabulary.includes(vocabularyId)) {
        user.learnedVocabulary.push(vocabularyId);
      }
      
      await user.save();

      res.json({
        message: 'Vocabulary completed successfully',
        quizPassed: true,
        user: {
          level: user.level,
          experience: user.experience,
          coins: user.coins
        }
      });
    } else {
      // Add to needs more study list
      if (!user.needsStudyVocabulary) {
        user.needsStudyVocabulary = [];
      }
      if (!user.needsStudyVocabulary.includes(vocabularyId)) {
        user.needsStudyVocabulary.push(vocabularyId);
      }
      await user.save();

      res.json({
        message: 'Quiz not passed, added to study list',
        quizPassed: false,
        user: {
          level: user.level,
          experience: user.experience,
          coins: user.coins
        }
      });
    }
  } catch (error) {
    console.error('Complete vocabulary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVocabularyQuiz = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const vocabulary = await Vocabulary.findById(id);
    
    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    // Return random questions (up to 3, or all if less than 3)
    const questions = vocabulary.questions || [];
    const randomQuestions = questions
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(3, questions.length));

    res.json({
      vocabulary: {
        id: vocabulary._id,
        word: vocabulary.word,
        meaning: vocabulary.meaning
      },
      questions: randomQuestions
    });
  } catch (error) {
    console.error('Get vocabulary quiz error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAISuggestions = async (req: any, res: Response) => {
  try {
    const { topic, keywords } = req.body;
    
    // Use AI to generate vocabulary suggestions
    const { getPersonalizedVocabularySuggestions } = await import('../ai/flows/personalized-vocabulary-suggestions');
    
    const suggestions = await getPersonalizedVocabularySuggestions({
      topic,
      keywords: keywords || ''
    });
    
    res.json({
      message: 'AI suggestions generated successfully',
      suggestedVocabulary: suggestions.suggestedVocabulary
    });
  } catch (error) {
    console.error('Get AI suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
