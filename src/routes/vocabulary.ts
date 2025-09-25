import express from 'express';
import { body } from 'express-validator';
import { 
  getVocabularies, 
  getVocabularyById, 
  createVocabulary, 
  updateVocabulary, 
  deleteVocabulary,
  getTopics,
  createTopic,
  getSuggestedVocabularies,
  completeVocabulary,
  getVocabularyQuiz,
  getAISuggestions
} from '../controllers/vocabularyController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// Validation rules
const vocabularyValidation = [
  body('word').trim().isLength({ min: 1 }),
  body('pronunciation').trim().isLength({ min: 1 }),
  body('meaning').trim().isLength({ min: 1 }),
  body('level').isInt({ min: 1, max: 6 }),
  body('topics').isArray(),
  body('partOfSpeech').trim().isLength({ min: 1 })
];

const topicValidation = [
  body('name').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
  body('color').trim().isLength({ min: 1 })
];

// Public routes
router.get('/topics', getTopics);

// Protected routes
router.get('/', authenticate, getVocabularies);
router.get('/suggested', authenticate, getSuggestedVocabularies);
router.get('/:id', authenticate, getVocabularyById);
router.get('/:id/quiz', authenticate, getVocabularyQuiz);
router.post('/complete', authenticate, completeVocabulary);
router.post('/ai-suggestions', authenticate, getAISuggestions);

// Admin routes
router.post('/', authenticate, authorize('admin'), vocabularyValidation, createVocabulary);
router.put('/:id', authenticate, authorize('admin'), vocabularyValidation, updateVocabulary);
router.delete('/:id', authenticate, authorize('admin'), deleteVocabulary);
router.post('/topics', authenticate, authorize('admin'), topicValidation, createTopic);

// Upload audio route
router.post('/upload-audio', authenticate, authorize('admin'), upload.single('audio'), (req, res) => {
  res.json({
    message: 'Audio uploaded successfully',
    audioUrl: req.file?.path
  });
});

export default router;
