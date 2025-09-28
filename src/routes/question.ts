import express from 'express';
import { body, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { getNextQuestions, submitAnswer, getProgressSummary, listQuestions, createQuestion, updateQuestion, deleteQuestion } from '../controllers/questionController';

const router = express.Router();

router.get('/next', authenticate, query('limit').optional().isInt({ min: 1, max: 50 }), getNextQuestions);
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

export default router;


