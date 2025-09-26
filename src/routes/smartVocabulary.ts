import express from 'express';
import { body } from 'express-validator';
import { 
  getUserVocabularyProgress,
  getVocabularySuggestions,
  addVocabularyToLearning,
  getNextVocabularyToLearn,
  updateVocabularyStatus,
  getVocabularyQuiz,
  completeVocabularyLearning,
  searchVocabularyByKeywords
} from '../controllers/smartVocabularyController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Validation rules
const addVocabularyValidation = [
  body('vocabularyIds').isArray({ min: 1 }),
  body('vocabularyIds.*').isMongoId(),
  body('customTopic').optional().isString()
];

const updateStatusValidation = [
  body('userVocabularyId').isMongoId(),
  body('status').isIn(['learning', 'known', 'needs-study', 'skipped'])
];

const completeLearningValidation = [
  body('userVocabularyId').isMongoId(),
  body('quizAnswers').isArray()
];

// Protected routes
router.get('/progress', authenticate, getUserVocabularyProgress);
router.get('/suggestions', authenticate, getVocabularySuggestions);
router.get('/search', authenticate, searchVocabularyByKeywords);
router.get('/next', authenticate, getNextVocabularyToLearn);
router.get('/quiz/:userVocabularyId', authenticate, getVocabularyQuiz);

router.post('/add', authenticate, addVocabularyValidation, addVocabularyToLearning);
router.put('/status', authenticate, updateStatusValidation, updateVocabularyStatus);
router.post('/complete', authenticate, completeLearningValidation, completeVocabularyLearning);

export default router;

