import express from 'express';
import { body, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { getNextQuestions, getAllQuestionsByLevel, submitAnswer, getProgressSummary, listQuestions, createQuestion, updateQuestion, deleteQuestion, downloadQuestionTemplate, importQuestionsExcel, getQuestionAttemptHistory } from '../controllers/questionController';
import multer from 'multer';

const router = express.Router();

router.get('/next', authenticate, query('limit').optional().isInt({ min: 1, max: 50 }), getNextQuestions);
router.get('/all', authenticate, query('level').optional().isInt({ min: 1, max: 10 }), getAllQuestionsByLevel);
router.get('/progress', authenticate, getProgressSummary);
router.post('/submit', authenticate, body('questionId').isMongoId(), body('answer').exists(), submitAnswer);

// Admin CRUD
router.get('/', authenticate, authorize('admin'), listQuestions);
router.post('/', authenticate, authorize('admin'),
  body('level').isNumeric(),
  body('questionType').isIn(['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order']),
  body('question').trim().isLength({ min: 1 }),
  createQuestion
);
router.put('/:id', authenticate, authorize('admin'),
  body('level').optional().isNumeric(),
  body('questionType').optional().isIn(['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order']),
  body('question').optional().trim().isLength({ min: 1 }),
  updateQuestion
);
router.delete('/:id', authenticate, authorize('admin'), deleteQuestion);

// Admin: Import/Template download for question bank
const memoryUpload = multer({ storage: multer.memoryStorage() });
router.get('/template', authenticate, authorize('admin'), downloadQuestionTemplate);
router.post('/import', authenticate, authorize('admin'), memoryUpload.single('file'), importQuestionsExcel);
router.get('/:id/history', authenticate, authorize('admin'), getQuestionAttemptHistory);

export default router;


