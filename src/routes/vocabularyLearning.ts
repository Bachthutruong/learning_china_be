import express from 'express'
import { authenticate } from '../middleware/auth'
import {
  getVocabularies,
  getPersonalTopics,
  createPersonalTopic,
  getUserVocabularies,
  addUserVocabulary,
  getVocabularyQuiz,
  completeVocabularyLearning,
  getVocabularySuggestions,
  personalTopicValidation,
  userVocabularyValidation,
  completeLearningValidation
} from '../controllers/vocabularyLearningController'

const router = express.Router()

// Auth required to personalize list (exclude learned)
router.get('/vocabularies', authenticate, getVocabularies)
router.get('/vocabularies/:vocabularyId/quiz', getVocabularyQuiz)

// Protected routes (require authentication)
router.get('/user/personal-topics', authenticate, getPersonalTopics)
router.post('/user/personal-topics', authenticate, personalTopicValidation, createPersonalTopic)
router.get('/user/vocabularies', authenticate, getUserVocabularies)
router.post('/user/vocabularies', authenticate, userVocabularyValidation, addUserVocabulary)
router.post('/user/vocabularies/complete', authenticate, completeLearningValidation, completeVocabularyLearning)
router.get('/user/vocabularies/suggestions', authenticate, getVocabularySuggestions)

export default router

