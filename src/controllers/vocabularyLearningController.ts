import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import Vocabulary, { IVocabulary } from '../models/Vocabulary'
import { PersonalTopic, IPersonalTopic } from '../models/PersonalTopic'
import { UserVocabulary, IUserVocabulary } from '../models/UserVocabulary'
import User, { IUser } from '../models/User'
import { checkAndUpdateUserLevel } from '../utils/levelUtils'
import mongoose from 'mongoose'

// Get vocabularies with search and topic filters
export const getVocabularies = async (req: Request, res: Response) => {
  try {
    const { search, topic, limit = 50, page = 1, excludeLearned = 'true' } = req.query as any
    const userId = (req as any).user?._id

    let query: any = {}

    // Search filter
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } },
        { pinyin: { $regex: search, $options: 'i' } },
        { zhuyin: { $regex: search, $options: 'i' } }
      ]
    }

    // Topic filter
    if (topic && topic !== 'all') {
      query.topics = { $in: [topic] }
    }

    // Exclude vocabularies that the user already learned (optional)
    if (excludeLearned !== 'false' && userId) {
      const learnedDocs = await UserVocabulary.find({ userId, status: 'learned' }).select('vocabularyId')
      const learnedIds = learnedDocs.map((d: any) => d.vocabularyId)
      if (learnedIds.length > 0) {
        query._id = { $nin: learnedIds }
      }
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

        // Count learned vocabularies in this topic that have at least 1 question
        const learnedMappings = await UserVocabulary.find({
          userId,
          personalTopicId: topic._id,
          status: 'learned'
        }).select('vocabularyId')

        const learnedIds = learnedMappings.map((m: any) => m.vocabularyId)
        let learnedCount = 0
        if (learnedIds.length > 0) {
          learnedCount = await Vocabulary.countDocuments({
            _id: { $in: learnedIds },
            'questions.0': { $exists: true }
          })
        }

        return {
          ...topic.toObject(),
          vocabularyCount: count,
          learnedCount
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
    let { vocabularyId, status, personalTopicId } = req.body

    // Check if vocabulary exists
    const vocabulary = await Vocabulary.findById(vocabularyId)
    if (!vocabulary) {
      return res.status(404).json({ message: 'Từ vựng không tồn tại' })
    }

    // If personalTopicId missing, infer the most recent mapping for this user+vocab
    if (!personalTopicId) {
      const latestMapping = await UserVocabulary.findOne({ userId, vocabularyId })
        .sort({ updatedAt: -1 })
        .select('personalTopicId')
      if (latestMapping?.personalTopicId) {
        personalTopicId = latestMapping.personalTopicId
      }
    }

    // Check if personal topic exists (if provided or inferred)
    if (personalTopicId) {
      const personalTopic = await PersonalTopic.findOne({ _id: personalTopicId, userId })
      if (!personalTopic) {
        return res.status(404).json({ message: 'Chủ đề cá nhân không tồn tại' })
      }
    }

    // Only update the document within the SAME topic if it exists.
    // This avoids moving a vocabulary from another topic into this one and
    // accidentally violating the unique (userId, vocabularyId, personalTopicId) index.
    let isNewlyLearned = false

    // Always update the mapping within the provided personalTopicId
    const existingInThisTopic = await UserVocabulary.findOne({ userId, vocabularyId, personalTopicId })

    if (existingInThisTopic) {
      const wasLearned = existingInThisTopic.status === 'learned'
      existingInThisTopic.status = status
      if (status === 'learned' && !wasLearned) {
        existingInThisTopic.learnedAt = new Date()
        isNewlyLearned = true
      }
      await existingInThisTopic.save()
    } else {
      // Create a new mapping for this topic only
      const userVocabulary = new UserVocabulary({
        userId,
        vocabularyId,
        status,
        personalTopicId,
        learnedAt: status === 'learned' ? new Date() : undefined
      })
      await userVocabulary.save()
      if (status === 'learned') {
        isNewlyLearned = true
      }
    }

    // Cộng xu và exp nếu học thuộc thành công
    if (status === 'learned') {
      const user = await User.findById(userId)
      if (user) {
        let expGain, coinGain
        
        if (isNewlyLearned) {
          // Từ mới chưa thuộc lần nào: +10 EXP, +10 xu
          expGain = 10
          coinGain = 10
        } else {
          // Từ đã thuộc rồi, học lại: +1 EXP, +1 xu
          expGain = 1
          coinGain = 1
        }
        
        user.experience += expGain
        user.coins += coinGain
        
        // Kiểm tra và cập nhật level
        const levelUpResult = await checkAndUpdateUserLevel(userId)
        
        await user.save()
        
        res.json({
          message: 'Đã học thuộc từ vựng thành công!',
          status,
          rewards: {
            exp: expGain,
            coins: coinGain,
            levelUp: levelUpResult.leveledUp,
            newLevel: levelUpResult.newLevel,
            isNewlyLearned
          }
        })
        return
      }
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

    // Check prior state before updating to avoid always treating as already learned
    const existingUserVocab = await UserVocabulary.findOne({ userId, vocabularyId })
    const wasAlreadyLearned = !!(existingUserVocab && existingUserVocab.status === 'learned' && existingUserVocab.learnedAt)

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
    try {
      const CoinTransaction = (await import('../models/CoinTransaction')).default;
      await CoinTransaction.create({
        userId: user._id,
        amount: rewards.coins,
        type: 'earn',
        category: 'vocabulary',
        description: wasAlreadyLearned ? 'Ôn lại từ vựng' : 'Học từ vựng mới',
        balanceAfter: user.coins,
        metadata: { vocabularyId, personalTopicId, quizScore }
      });
    } catch (e) {
      console.error('Failed to record coin transaction (vocabulary):', e);
    }

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
  body('personalTopicId').notEmpty().withMessage('ID chủ đề cá nhân là bắt buộc').isMongoId().withMessage('ID chủ đề cá nhân không hợp lệ')
]

export const completeLearningValidation = [
  body('vocabularyId').notEmpty().withMessage('ID từ vựng là bắt buộc'),
  body('quizScore').isNumeric().withMessage('Điểm khảo bài phải là số'),
  body('personalTopicId').optional().isMongoId().withMessage('ID chủ đề cá nhân không hợp lệ')
]

// Get available vocabularies for personal topics
export const getAvailableVocabularies = async (req: Request, res: Response) => {
  try {
    const { topics, search, limit = 20 } = req.query as any
    const userId = (req as any).user?._id

    if (!topics) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một chủ đề' })
    }

    // Get user's current level
    const user = await User.findById(userId).select('level')
    const userLevel = user?.level || 1

    let query: any = {
      // Filter by user level (show vocabularies within 2 levels of user's level)
      level: { $gte: Math.max(1, userLevel - 1), $lte: userLevel + 1 }
    }

    // Search filter
    if (search) {
      query.$or = [
        { word: { $regex: search, $options: 'i' } },
        { meaning: { $regex: search, $options: 'i' } },
        { pinyin: { $regex: search, $options: 'i' } },
        { zhuyin: { $regex: search, $options: 'i' } }
      ]
    }

    // Topic filter - get vocabularies that match any of the selected topics
    const topicArray = topics.split(',').map((t: string) => t.trim())
    query.topics = { $in: topicArray }

    // Exclude vocabularies that the user already has in any personal topic
    const existingUserVocabularies = await UserVocabulary.find({ userId }).select('vocabularyId')
    const existingIds = existingUserVocabularies.map((d: any) => d.vocabularyId)
    if (existingIds.length > 0) {
      query._id = { $nin: existingIds }
    }

    const vocabularies = await Vocabulary.find(query)
      .limit(Number(limit))
      .sort({ level: 1, createdAt: -1 })

    res.json(vocabularies)
  } catch (error) {
    console.error('Error fetching available vocabularies:', error)
    res.status(500).json({ message: 'Không thể tải danh sách từ vựng có sẵn' })
  }
}

// Add vocabularies to personal topic
export const addVocabulariesToTopic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id
    const { topicId, vocabularyIds } = req.body

    if (!topicId || !vocabularyIds || !Array.isArray(vocabularyIds) || vocabularyIds.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp chủ đề và danh sách từ vựng' })
    }

    // Check if topic exists and belongs to user
    const topic = await PersonalTopic.findOne({ _id: topicId, userId })
    if (!topic) {
      return res.status(404).json({ message: 'Chủ đề không tồn tại' })
    }

    // Check if vocabularies exist
    const vocabularies = await Vocabulary.find({ _id: { $in: vocabularyIds } })
    if (vocabularies.length !== vocabularyIds.length) {
      return res.status(400).json({ message: 'Một số từ vựng không tồn tại' })
    }

    // Check which vocabularies already exist for this user in THIS specific topic
    const existingUserVocabularies = await UserVocabulary.find({
      userId,
      vocabularyId: { $in: vocabularyIds },
      personalTopicId: topicId
    }).select('vocabularyId')

    const existingVocabularyIds = existingUserVocabularies.map(uv => uv.vocabularyId.toString())
    const newVocabularyIds = vocabularyIds.filter(id => !existingVocabularyIds.includes(id))

    if (newVocabularyIds.length === 0) {
      return res.json({ 
        message: 'Tất cả từ vựng đã tồn tại trong chủ đề này',
        added: 0,
        skipped: vocabularyIds.length
      })
    }

    // Add only new vocabularies to topic
    const userVocabularies = newVocabularyIds.map((vocabularyId: string) => ({
      userId,
      vocabularyId,
      personalTopicId: topicId,
      status: 'studying',
      addedAt: new Date()
    }))

    try {
      await UserVocabulary.insertMany(userVocabularies, { ordered: false })
    } catch (error: any) {
      // Handle duplicate key errors gracefully
      if (error.code === 11000) {
        // Some documents were inserted, some failed due to duplicates
        const insertedCount = error.result?.insertedCount || 0
        const duplicateCount = newVocabularyIds.length - insertedCount
        
        res.json({ 
          message: `Thêm ${insertedCount} từ vựng mới, ${duplicateCount} từ đã tồn tại`,
          added: insertedCount,
          skipped: duplicateCount
        })
        return
      }
      throw error
    }

    res.json({ 
      message: `Thêm ${newVocabularyIds.length} từ vựng vào chủ đề thành công`,
      added: newVocabularyIds.length,
      skipped: existingVocabularyIds.length
    })
  } catch (error) {
    console.error('Error adding vocabularies to topic:', error)
    res.status(500).json({ message: 'Không thể thêm từ vựng vào chủ đề' })
  }
}

export const getLearnedVocabulariesForQuiz = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id
    const { personalTopicId } = req.query as any

    if (!personalTopicId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp chủ đề' })
    }

    // Bước 1: Lấy tất cả vocabularyIds thuộc chủ đề này của người dùng
    const topicMappings = await UserVocabulary.find({ userId, personalTopicId }).select('vocabularyId')
    const topicVocabularyIds = topicMappings.map(m => m.vocabularyId)

    if (topicVocabularyIds.length === 0) {
      return res.json({ vocabularies: [], count: 0 })
    }

    // Bước 2: Với các vocabularyIds trên, chọn những từ mà user đã "learned" ở bất kỳ chủ đề nào
    const learnedMappings = await UserVocabulary.find({
      userId,
      vocabularyId: { $in: topicVocabularyIds },
      status: 'learned'
    }).select('vocabularyId')

    const learnedIds = Array.from(new Set(learnedMappings.map(m => String(m.vocabularyId))))

    if (learnedIds.length === 0) {
      return res.json({ vocabularies: [], count: 0 })
    }

    // Bước 3: Lấy dữ liệu từ vựng có câu hỏi cho các id đã học
    const vocabularies = await Vocabulary.find({
      _id: { $in: learnedIds },
      'questions.0': { $exists: true }
    })

    res.json({
      vocabularies,
      count: vocabularies.length
    })
  } catch (error) {
    console.error('Error fetching learned vocabularies for quiz:', error)
    res.status(500).json({ message: 'Không thể tải từ vựng đã học cho khảo bài' })
  }
}

// Get vocabularies by personal topic
export const getVocabulariesByTopic = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id
    const { personalTopicId, search, limit = 20 } = req.query as any

    if (!personalTopicId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp chủ đề' })
    }

    // Lấy từ vựng trong chủ đề cá nhân
    const userVocabularies = await UserVocabulary.find({
      userId,
      personalTopicId
    })
      .populate('vocabularyId')
      .populate('personalTopicId')

    // Lọc bỏ những từ không tồn tại
    const validVocabularies = userVocabularies.filter(uv => uv.vocabularyId)

    // Build items with status
    let items = validVocabularies.map(uv => ({ vocabulary: (uv as any).vocabularyId, status: uv.status }))
    // Apply search filter if provided
    let filteredItems = items
    
    if (search) {
      const s = String(search).toLowerCase()
      filteredItems = items.filter(({ vocabulary }: any) => 
        vocabulary.word.toLowerCase().includes(s) ||
        vocabulary.meaning.toLowerCase().includes(s) ||
        vocabulary.pronunciation.toLowerCase().includes(s)
      )
    }

    // Apply limit
    if (limit) {
      filteredItems = filteredItems.slice(0, Number(limit))
    }

    const vocabularies = filteredItems.map(i => i.vocabulary)
    const statuses: Record<string, string> = {}
    filteredItems.forEach(i => { statuses[String((i as any).vocabulary._id)] = i.status })

    res.json({ vocabularies, statuses, count: vocabularies.length })
  } catch (error) {
    console.error('Error fetching vocabularies by topic:', error)
    res.status(500).json({ message: 'Không thể tải từ vựng theo chủ đề' })
  }
}

// Get monthly vocabulary learners statistics
// GET /vocabulary-learning/stats/monthly?month=YYYY-MM
export const getMonthlyVocabularyLearners = async (req: Request, res: Response) => {
  try {
    const { month } = req.query as { month?: string }
    // Determine time window
    let start: Date
    let end: Date
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map((v) => parseInt(v, 10))
      // JS month is 0-based
      start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0))
      end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0))
    } else {
      // Default to current month (UTC boundary)
      const now = new Date()
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
      end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))
    }

    // Aggregate by user to get statistics
    const agg = await UserVocabulary.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lt: end },
          status: { $in: ['learned', 'studying'] }
        } 
      },
      {
        $group: {
          _id: '$userId',
          learnedCount: { 
            $sum: { $cond: [{ $eq: ['$status', 'learned'] }, 1, 0] } 
          },
          studyingCount: { 
            $sum: { $cond: [{ $eq: ['$status', 'studying'] }, 1, 0] } 
          },
          totalVocabularies: { $sum: 1 }
        }
      },
      { $sort: { totalVocabularies: -1, learnedCount: -1 } }
    ])

    // Hydrate user info
    const results = await Promise.all(
      agg.map(async (r: any) => {
        // userId is stored as String in UserVocabulary, convert to ObjectId for User query
        const userIdObj = mongoose.Types.ObjectId.isValid(r._id) 
          ? new mongoose.Types.ObjectId(r._id) 
          : r._id
        const u = await User.findById(userIdObj).select('name email level')
        return {
          userId: String(r._id),
          name: u?.name || 'Unknown',
          email: u?.email || '',
          level: u?.level ?? null,
          learnedCount: r.learnedCount,
          studyingCount: r.studyingCount,
          totalVocabularies: r.totalVocabularies
        }
      })
    )

    res.json({
      month: month || null,
      start,
      end,
      results
    })
  } catch (error) {
    console.error('Get monthly vocabulary learners stats error:', error)
    res.status(500).json({ message: 'Không thể tải thống kê người học từ vựng' })
  }
}

// Stats: learners by vocabulary for a given month
export const getLearnersByVocabularyStats = async (req: Request, res: Response) => {
  try {
    const { month, vocabularyIds } = req.query as any
    // month: 'YYYY-MM'; default to current month
    const now = new Date()
    let year = now.getUTCFullYear()
    let monthIdx = now.getUTCMonth() // 0-11
    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map((n: string) => Number(n))
      year = y
      monthIdx = m - 1
    }
    const monthStart = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0))
    const monthEnd = new Date(Date.UTC(year, monthIdx + 1, 1, 0, 0, 0))

    const match: any = {
      status: 'learned',
      learnedAt: { $gte: monthStart, $lt: monthEnd }
    }
    if (vocabularyIds) {
      const ids = String(vocabularyIds)
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      if (ids.length > 0) {
        match.vocabularyId = { $in: ids }
      }
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$vocabularyId',
          learnedCount: { $sum: 1 },
          uniqueLearners: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          _id: 0,
          vocabularyId: '$_id',
          learnedCount: 1,
          uniqueLearnersCount: { $size: '$uniqueLearners' }
        }
      }
    ] as any[]

    const results = await UserVocabulary.aggregate(pipeline)

    // Join vocabulary info
    const vocabIds = results.map((r: any) => r.vocabularyId)
    const vocabDocs = await Vocabulary.find({ _id: { $in: vocabIds } }).select(
      'word pinyin zhuyin meaning'
    )
    const idToVocab = new Map<string, any>()
    vocabDocs.forEach((v: any) => idToVocab.set(String(v._id), v))

    const stats = results.map((r: any) => {
      const v = idToVocab.get(String(r.vocabularyId))
      return {
        vocabularyId: r.vocabularyId,
        word: v?.word || '',
        pinyin: v?.pinyin || v?.pronunciation || '',
        meaning: v?.meaning || '',
        learnedCount: r.learnedCount,
        uniqueLearners: r.uniqueLearnersCount
      }
    })

    // If client passed vocabularyIds but some have zero for this month, include zeros
    if (vocabularyIds) {
      const requested = String(vocabularyIds)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      const existingSet = new Set(stats.map(s => String(s.vocabularyId)))
      if (requested.length > 0) {
        const missingIds = requested.filter(id => !existingSet.has(id))
        if (missingIds.length > 0) {
          const missingVocabDocs = await Vocabulary.find({ _id: { $in: missingIds } }).select(
            'word pinyin zhuyin meaning'
          )
          const missingMap = new Map<string, any>()
          missingVocabDocs.forEach((v: any) => missingMap.set(String(v._id), v))
          missingIds.forEach(id => {
            const v = missingMap.get(id)
            stats.push({
              vocabularyId: id,
              word: v?.word || '',
              pinyin: v?.pinyin || v?.pronunciation || '',
              meaning: v?.meaning || '',
              learnedCount: 0,
              uniqueLearners: 0
            })
          })
        }
      }
    }

    // Sort by learnedCount desc then word asc
    stats.sort((a, b) => {
      if (b.learnedCount !== a.learnedCount) return b.learnedCount - a.learnedCount
      return String(a.word).localeCompare(String(b.word))
    })

    res.json({
      month: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
      stats,
      count: stats.length
    })
  } catch (error) {
    console.error('Error fetching learners-by-vocabulary stats:', error)
    res.status(500).json({ message: 'Không thể tải thống kê người học theo từ vựng' })
  }
}