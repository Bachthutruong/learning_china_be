import { Request, Response } from 'express';
import Vocabulary from '../models/Vocabulary';
import Topic from '../models/Topic';
import Level from '../models/Level';
import Test from '../models/Test';
import ProficiencyTest from '../models/ProficiencyTest';
import ProficiencyConfig from '../models/ProficiencyConfig';
import Competition from '../models/Competition';
import Report from '../models/Report';
import User from '../models/User';
import { validationResult } from 'express-validator';

// Vocabulary Management
export const createVocabulary = async (req: any, res: Response) => {
  try {
    console.log('Create vocabulary request body:', req.body);
    console.log('Create vocabulary request file:', req.file);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      word,
      pronunciation,
      meaning,
      audioUrl,
      level,
      topics,
      partOfSpeech,
      synonyms,
      antonyms,
      examples,
      questions
    } = req.body;

    // Parse JSON strings for array fields
    let parsedTopics, parsedSynonyms, parsedAntonyms, parsedExamples, parsedQuestions;
    
    try {
      parsedTopics = typeof topics === 'string' ? JSON.parse(topics) : topics;
      parsedSynonyms = typeof synonyms === 'string' ? JSON.parse(synonyms) : synonyms;
      parsedAntonyms = typeof antonyms === 'string' ? JSON.parse(antonyms) : antonyms;
      parsedExamples = typeof examples === 'string' ? JSON.parse(examples) : examples;
      parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(400).json({ 
        message: 'Invalid JSON format in array fields',
        error: parseError 
      });
    }

    // Handle file upload if present
    let audioUrlFinal = audioUrl;
    if (req.file) {
      try {
        audioUrlFinal = req.file.path; // Cloudinary URL
        console.log('Audio file uploaded successfully:', req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload audio file',
          error: uploadError 
        });
      }
    }

    // Validate required fields
    if (!word || !pronunciation || !meaning || !partOfSpeech) {
      return res.status(400).json({ 
        message: 'Missing required fields: word, pronunciation, meaning, partOfSpeech' 
      });
    }

    const vocabulary = new Vocabulary({
      word,
      pronunciation,
      meaning,
      audioUrl: audioUrlFinal,
      level,
      topics: parsedTopics || [],
      partOfSpeech,
      synonyms: parsedSynonyms || [],
      antonyms: parsedAntonyms || [],
      examples: parsedExamples || [],
      questions: parsedQuestions || []
    });

    await vocabulary.save();
    res.status(201).json({
      message: 'Vocabulary created successfully',
      vocabulary: {
        ...vocabulary.toObject(),
        audioUrl: vocabulary.audioUrl || null
      }
    });
  } catch (error) {
    console.error('Create vocabulary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateVocabulary = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('Update data received:', updateData);

    // Handle file upload if present
    if (req.file) {
      try {
        updateData.audioUrl = req.file.path; // Cloudinary URL
        console.log('Audio file uploaded successfully:', req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload audio file',
          error: uploadError 
        });
      }
    }

    // Filter out empty strings and undefined values, and parse JSON strings
    const filteredData = Object.keys(updateData).reduce((acc, key) => {
      if (updateData[key] !== '' && updateData[key] !== undefined && updateData[key] !== null) {
        // Parse JSON strings for array fields
        if (['topics', 'examples', 'synonyms', 'antonyms', 'questions'].includes(key)) {
          try {
            acc[key] = JSON.parse(updateData[key]);
          } catch (e) {
            acc[key] = updateData[key];
          }
        } else {
          acc[key] = updateData[key];
        }
      }
      return acc;
    }, {} as any);

    console.log('Filtered data:', filteredData);

    // Ensure required fields are present
    if (!filteredData.word || !filteredData.pronunciation || !filteredData.meaning || !filteredData.partOfSpeech) {
      return res.status(400).json({ 
        message: 'Missing required fields: word, pronunciation, meaning, partOfSpeech',
        received: filteredData
      });
    }

    const vocabulary = await Vocabulary.findByIdAndUpdate(
      id,
      filteredData,
      { new: true, runValidators: true }
    );

    if (!vocabulary) {
      return res.status(404).json({ message: 'Vocabulary not found' });
    }

    res.json({
      message: 'Vocabulary updated successfully',
      vocabulary: {
        ...vocabulary.toObject(),
        audioUrl: vocabulary.audioUrl || null
      }
    });
  } catch (error) {
    console.error('Update vocabulary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteVocabulary = async (req: any, res: Response) => {
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

// Topic Management
export const createTopic = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color } = req.body;

    const topic = new Topic({
      name,
      description,
      color
    });

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

export const updateTopic = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const topic = await Topic.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json({
      message: 'Topic updated successfully',
      topic
    });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTopic = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findByIdAndDelete(id);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Level Management
export const createLevel = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, number, description, requiredExperience, color } = req.body;

    const level = new Level({
      name,
      number,
      description,
      requiredExperience,
      color
    });

    await level.save();
    res.status(201).json({
      message: 'Level created successfully',
      level
    });
  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateLevel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const level = await Level.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }

    res.json({
      message: 'Level updated successfully',
      level
    });
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteLevel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const level = await Level.findByIdAndDelete(id);

    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }

    res.json({ message: 'Level deleted successfully' });
  } catch (error) {
    console.error('Delete level error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Test Management
export const createTest = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      level,
      questions,
      timeLimit,
      requiredCoins,
      rewardExperience,
      rewardCoins
    } = req.body;

    const test = new Test({
      title,
      description,
      level,
      questions,
      timeLimit,
      requiredCoins,
      rewardExperience,
      rewardCoins
    });

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

export const updateTest = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const test = await Test.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
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

export const deleteTest = async (req: any, res: Response) => {
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

// Proficiency Test Management
export const createProficiencyTest = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      level,
      questions,
      timeLimit,
      requiredCoins,
      rewardExperience,
      rewardCoins
    } = req.body;

    const proficiencyTest = new ProficiencyTest({
      level,
      questions,
      timeLimit,
      requiredCoins,
      rewardExperience,
      rewardCoins
    });

    await proficiencyTest.save();
    res.status(201).json({
      message: 'Proficiency test created successfully',
      proficiencyTest
    });
  } catch (error) {
    console.error('Create proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProficiencyTest = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const proficiencyTest = await ProficiencyTest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!proficiencyTest) {
      return res.status(404).json({ message: 'Proficiency test not found' });
    }

    res.json({
      message: 'Proficiency test updated successfully',
      proficiencyTest
    });
  } catch (error) {
    console.error('Update proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProficiencyTest = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const proficiencyTest = await ProficiencyTest.findByIdAndDelete(id);

    if (!proficiencyTest) {
      return res.status(404).json({ message: 'Proficiency test not found' });
    }

    res.json({ message: 'Proficiency test deleted successfully' });
  } catch (error) {
    console.error('Delete proficiency test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin Dashboard Stats
export const getAdminStats = async (req: any, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVocabulary = await Vocabulary.countDocuments();
    const totalTopics = await Topic.countDocuments();
    const totalTests = await Test.countDocuments();
    const totalProficiencyTests = await ProficiencyTest.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Calculate additional stats
    const users = await User.find().select('experience coins lastCheckIn');
    const totalExperience = users.reduce((sum, user) => sum + user.experience, 0);
    const totalCoins = users.reduce((sum, user) => sum + user.coins, 0);
    
    // Active users (logged in within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ 
      lastCheckIn: { $gte: oneDayAgo } 
    });

    // Calculate analytics data
    const completedTests = await Test.countDocuments({ completedBy: { $exists: true, $ne: [] } });
    const testCompletionRate = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
    
    const learnedVocabulary = users.reduce((sum, user) => sum + (user.learnedVocabulary?.length || 0), 0);
    const vocabularyLearningRate = totalVocabulary > 0 ? Math.round((learnedVocabulary / totalVocabulary) * 100) : 0;
    
    // Mock satisfaction rate (in real app, this would come from feedback/reviews)
    const satisfactionRate = Math.min(95, Math.max(70, 85 + Math.floor(Math.random() * 20)));

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email level experience coins createdAt');

    const recentReports = await Report.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalUsers,
        totalVocabulary,
        totalTopics,
        totalTests,
        totalProficiencyTests,
        pendingReports,
        activeUsers,
        totalExperience,
        totalCoins,
        testCompletionRate,
        vocabularyLearningRate,
        satisfactionRate
      },
      recentUsers,
      recentReports
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Recent activities (mocked for now)
export const getAdminActivities = async (_req: any, res: Response) => {
  try {
    const activities = [
      { id: '1', type: 'user_registered', description: 'Người dùng mới đăng ký', timestamp: new Date().toISOString() },
      { id: '2', type: 'vocabulary_created', description: 'Thêm từ vựng mới', timestamp: new Date(Date.now() - 3600_000).toISOString() },
      { id: '3', type: 'test_completed', description: 'Một bài test vừa được hoàn thành', timestamp: new Date(Date.now() - 7200_000).toISOString() },
      { id: '4', type: 'report_submitted', description: 'Có báo cáo mới cần duyệt', timestamp: new Date(Date.now() - 10800_000).toISOString() },
    ];
    res.json({ activities });
  } catch (error) {
    console.error('Get admin activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all data for admin management
export const getAllVocabularies = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10, search, level, topic } = req.query;
    
    let query: any = {};
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } }
      ];
    }
    if (level) query.level = level;
    if (topic) query.topics = topic;

    const vocabularies = await Vocabulary.find(query)
      .populate('topics', 'name color')
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
    console.error('Get all vocabularies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllTopics = async (req: any, res: Response) => {
  try {
    const topics = await Topic.find().sort({ name: 1 });
    res.json(topics);
  } catch (error) {
    console.error('Get all topics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllLevels = async (req: any, res: Response) => {
  try {
    const levels = await Level.find().sort({ number: 1 });
    res.json(levels);
  } catch (error) {
    console.error('Get all levels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllTests = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10, level } = req.query;
    
    let query: any = {};
    if (level) query.level = level;

    const tests = await Test.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Test.countDocuments(query);

    res.json({
      tests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllProficiencyTests = async (req: any, res: Response) => {
  try {
    const { level } = req.query;
    
    let query: any = {};
    if (level) query.level = level;

    const proficiencyTests = await ProficiencyTest.find(query).sort({ level: 1 });
    res.json(proficiencyTests);
  } catch (error) {
    console.error('Get all proficiency tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Proficiency Config Management
export const getProficiencyConfigs = async (req: any, res: Response) => {
  try {
    const configs = await ProficiencyConfig.find().sort({ createdAt: -1 });
    res.json({ configs });
  } catch (error) {
    console.error('Get proficiency configs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProficiencyConfig = async (req: any, res: Response) => {
  try {
    const { name, description, cost, initialQuestions, branches } = req.body;
    
    // Deactivate all existing configs
    await ProficiencyConfig.updateMany({}, { isActive: false });
    
    const config = new ProficiencyConfig({
      name,
      description,
      cost,
      initialQuestions,
      branches,
      isActive: true
    });
    
    await config.save();
    
    res.status(201).json({
      message: 'Proficiency config created successfully',
      config
    });
  } catch (error) {
    console.error('Create proficiency config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProficiencyConfig = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, cost, initialQuestions, branches } = req.body;
    
    const config = await ProficiencyConfig.findByIdAndUpdate(
      id,
      { name, description, cost, initialQuestions, branches },
      { new: true }
    );
    
    if (!config) {
      return res.status(404).json({ message: 'Proficiency config not found' });
    }
    
    res.json({
      message: 'Proficiency config updated successfully',
      config
    });
  } catch (error) {
    console.error('Update proficiency config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProficiencyConfig = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const config = await ProficiencyConfig.findByIdAndDelete(id);
    
    if (!config) {
      return res.status(404).json({ message: 'Proficiency config not found' });
    }
    
    res.json({ message: 'Proficiency config deleted successfully' });
  } catch (error) {
    console.error('Delete proficiency config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const activateProficiencyConfig = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    // Deactivate all configs first
    await ProficiencyConfig.updateMany({}, { isActive: false });
    
    // Activate the selected config
    const config = await ProficiencyConfig.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    
    if (!config) {
      return res.status(404).json({ message: 'Proficiency config not found' });
    }
    
    res.json({
      message: 'Proficiency config activated successfully',
      config
    });
  } catch (error) {
    console.error('Activate proficiency config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Competition Management
export const getAllCompetitions = async (req: any, res: Response) => {
  try {
    const competitions = await Competition.find().sort({ createdAt: -1 });
    res.json({ competitions });
  } catch (error) {
    console.error('Get competitions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCompetition = async (req: any, res: Response) => {
  try {
    const {
      title,
      description,
      level,
      startDate,
      endDate,
      cost,
      reward,
      prizes,
      questions
    } = req.body;

    // Validate required fields
    if (!title || !description || !level || !startDate || !endDate || !cost || !reward || !prizes || !questions) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const competition = new Competition({
      title,
      description,
      level,
      startDate: start,
      endDate: end,
      cost,
      reward,
      prizes,
      questions,
      participants: [],
      isActive: true
    });

    await competition.save();

    res.status(201).json({
      message: 'Competition created successfully',
      competition
    });
  } catch (error) {
    console.error('Create competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCompetition = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate dates if provided
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      if (start >= end) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    const competition = await Competition.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    res.json({
      message: 'Competition updated successfully',
      competition
    });
  } catch (error) {
    console.error('Update competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCompetition = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findByIdAndDelete(id);

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    console.error('Delete competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


