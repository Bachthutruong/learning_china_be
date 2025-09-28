import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import Vocabulary, { IVocabulary } from '../models/Vocabulary'
import { PersonalTopic, IPersonalTopic } from '../models/PersonalTopic'
import { UserVocabulary, IUserVocabulary } from '../models/UserVocabulary'
import User, { IUser } from '../models/User'
import { checkAndUpdateUserLevel } from '../utils/levelUtils'

// Get vocabularies with search and topic filters
export const getVocabularies = async (req: Request, res: Response) => {
  try {
    const { search, topic, limit = 50, page = 1 } = req.query
    const userId = (req as any).user?._id

    let query: any = {}

    // Search filter
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } },
        { pronunciation: { $regex: search, $options: 'i' } }
      ]
    }

    // Topic filter
    if (topic && topic !== 'all') {
      query.topics = { $in: [topic] }
    }

    const skip = (Number(page) - 1) * Number(limit)
    const vocabularies = await Vocabulary.find(query)
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 })

    // Get total count
    const total = await Vocabulary.countDocuments(query)

    res.json({
      vocabularies,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    })
  } catch (error) {
    console.error('Error fetching vocabularies:', error)
    res.status(500).json({ message: 'Không thể tải danh sách từ vựng' })
  }
}

// Get personal topics for user
export const getPersonalTopics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id

    const topics = await PersonalTopic.find({ userId })
      .sort({ createdAt: -1 })

    // Get vocabulary count for each topic
    const topicsWithCount = await Promise.all(
      topics.map(async (topic: any) => {
        const count = await UserVocabulary.countDocuments({
          userId,
          personalTopicId: topic._id
        })
        return {
          ...topic.toObject(),
          vocabularyCount: count
        }
      })
    )

    res.json({ topics: topicsWithCount })
  } catch (error) {
    console.error('Error fetching personal topics:', error)
    res.status(500).json({ message: 'Không thể tải danh sách chủ đề cá nhân' })
  }
}

// Create personal topic
export const createPersonalTopic = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = (req as any).user?._id
    const { name, description } = req.body

    // Check if topic with same name already exists for user
    const existingTopic = await PersonalTopic.findOne({ userId, name })
    if (existingTopic) {
      return res.status(400).json({ message: 'Chủ đề với tên này đã tồn tại' })
    }

    const topic = new PersonalTopic({
      name,
      description,
      userId
    })

    await topic.save()

    res.status(201).json({
      message: 'Tạo chủ đề cá nhân thành công',
      topic
    })
  } catch (error) {
    console.error('Error creating personal topic:', error)
    res.status(500).json({ message: 'Không thể tạo chủ đề cá nhân' })
  }
}

// Get user vocabularies with filters
export const getUserVocabularies = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id
    const { status, personalTopicId } = req.query

    let query: any = { userId }

    if (status && status !== 'all') {
      query.status = status
    }

    if (personalTopicId && personalTopicId !== 'all') {
      query.personalTopicId = personalTopicId
    }

    const userVocabularies = await UserVocabulary.find(query)
      .populate('vocabularyId', 'word pronunciation meaning partOfSpeech level topics examples synonyms antonyms audio audioUrl questions')
      .populate('personalTopicId', 'name description')
      .sort({ updatedAt: -1 })

    res.json({ userVocabularies })
  } catch (error) {
    console.error('Error fetching user vocabularies:', error)
    res.status(500).json({ message: 'Không thể tải danh sách từ vựng của người dùng' })
  }
}

// Add vocabulary to user's list
export const addUserVocabulary = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = (req as any).user?._id
    const { vocabularyId, status, personalTopicId } = req.body

    // Check if vocabulary exists
    const vocabulary = await Vocabulary.findById(vocabularyId)
    if (!vocabulary) {
      return res.status(404).json({ message: 'Từ vựng không tồn tại' })
    }

    // Check if personal topic exists (if provided)
    if (personalTopicId) {
      const personalTopic = await PersonalTopic.findOne({ _id: personalTopicId, userId })
      if (!personalTopic) {
        return res.status(404).json({ message: 'Chủ đề cá nhân không tồn tại' })
      }
    }

    // Check if user vocabulary already exists
    const existingUserVocab = await UserVocabulary.findOne({ userId, vocabularyId })
    if (existingUserVocab) {
      // Update existing
      existingUserVocab.status = status
      existingUserVocab.personalTopicId = personalTopicId
      if (status === 'learned') {
        existingUserVocab.learnedAt = new Date()
      }
      await existingUserVocab.save()
    } else {
      // Create new
      const userVocabulary = new UserVocabulary({
        userId,
        vocabularyId,
        status,
        personalTopicId,
        learnedAt: status === 'learned' ? new Date() : undefined
      })
      await userVocabulary.save()
    }

    res.json({
      message: 'Đã thêm từ vựng vào danh sách',
      status
    })
  } catch (error) {
    console.error('Error adding user vocabulary:', error)
    res.status(500).json({ message: 'Không thể thêm từ vựng' })
  }
}

// Get quiz questions for vocabulary
export const getVocabularyQuiz = async (req: Request, res: Response) => {
  try {
    const { vocabularyId } = req.params

    const vocabulary = await Vocabulary.findById(vocabularyId)
    if (!vocabulary) {
      return res.status(404).json({ message: 'Từ vựng không tồn tại' })
    }

    const questions = vocabulary.questions || []
    
    res.json({ questions })
  } catch (error) {
    console.error('Error fetching vocabulary quiz:', error)
    res.status(500).json({ message: 'Không thể tải câu hỏi khảo bài' })
  }
}

// Complete vocabulary learning (with rewards)
export const completeVocabularyLearning = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const userId = (req as any).user?._id
    const { vocabularyId, personalTopicId, quizScore } = req.body

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' })
    }

    // Check if vocabulary exists
    const vocabulary = await Vocabulary.findById(vocabularyId)
    if (!vocabulary) {
      return res.status(404).json({ message: 'Từ vựng không tồn tại' })
    }

    // Update or create user vocabulary
    const userVocabulary = await UserVocabulary.findOneAndUpdate(
      { userId, vocabularyId },
      {
        status: 'learned',
        personalTopicId,
        learnedAt: new Date()
      },
      { upsert: true, new: true }
    )

    // Check if vocabulary was already learned before
    const wasAlreadyLearned = userVocabulary.status === 'learned' && userVocabulary.learnedAt;
    
    let rewards = { experience: 0, coins: 0 };
    
    if (wasAlreadyLearned) {
      // Already learned vocabulary: 1 XP, 1 coin
      rewards = { experience: 1, coins: 1 };
    } else {
      // New vocabulary: 10 XP, 10 coins
      rewards = { experience: 10, coins: 10 };
    }
    
    user.experience += rewards.experience;
    user.coins += rewards.coins;
    await user.save();

    // Check for level up
    const levelResult = await checkAndUpdateUserLevel((user._id as any).toString());

    res.json({
      message: wasAlreadyLearned 
        ? `Ôn tập từ vựng thành công! Nhận được ${rewards.experience} XP + ${rewards.coins} xu!`
        : `Học từ vựng mới thành công! Nhận được ${rewards.experience} XP + ${rewards.coins} xu!`,
      rewards,
      levelResult,
      userVocabulary,
      isNewVocabulary: !wasAlreadyLearned
    })
  } catch (error) {
    console.error('Error completing vocabulary learning:', error)
    res.status(500).json({ message: 'Không thể hoàn thành học từ vựng' })
  }
}

// Get vocabulary suggestions based on topic
export const getVocabularySuggestions = async (req: Request, res: Response) => {
  try {
    const { topic, limit = 10 } = req.query
    const userId = (req as any).user?._id

    let query: any = {}

    if (topic && topic !== 'all') {
      query.topics = { $in: [topic] }
    }

    // Get vocabularies user hasn't learned yet
    const userVocabularies = await UserVocabulary.find({ userId }).select('vocabularyId')
    const learnedVocabularyIds = userVocabularies.map((uv: any) => uv.vocabularyId)
    
    if (learnedVocabularyIds.length > 0) {
      query._id = { $nin: learnedVocabularyIds }
    }

    const vocabularies = await Vocabulary.find(query)
      .limit(Number(limit))
      .sort({ createdAt: -1 })

    res.json({ vocabularies })
  } catch (error) {
    console.error('Error fetching vocabulary suggestions:', error)
    res.status(500).json({ message: 'Không thể tải gợi ý từ vựng' })
  }
}

// Validation rules
export const personalTopicValidation = [
  body('name').trim().notEmpty().withMessage('Tên chủ đề là bắt buộc'),
  body('description').optional().trim()
]

export const userVocabularyValidation = [
  body('vocabularyId').notEmpty().withMessage('ID từ vựng là bắt buộc'),
  body('status').isIn(['learned', 'studying', 'skipped']).withMessage('Trạng thái không hợp lệ'),
  body('personalTopicId').optional().isMongoId().withMessage('ID chủ đề cá nhân không hợp lệ')
]

export const completeLearningValidation = [
  body('vocabularyId').notEmpty().withMessage('ID từ vựng là bắt buộc'),
  body('quizScore').isNumeric().withMessage('Điểm khảo bài phải là số'),
  body('personalTopicId').optional().isMongoId().withMessage('ID chủ đề cá nhân không hợp lệ')
]
