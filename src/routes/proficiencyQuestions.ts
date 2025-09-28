import express from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllProficiencyQuestions,
  getProficiencyQuestionById,
  createProficiencyQuestion,
  updateProficiencyQuestion,
  deleteProficiencyQuestion,
  getRandomProficiencyQuestions
} from '../controllers/proficiencyQuestionController';

const router = express.Router();

// Validation middleware
const proficiencyQuestionValidation = [
  body('question').trim().notEmpty().withMessage('Câu hỏi là bắt buộc'),
  body('options').isArray({ min: 2 }).withMessage('Cần ít nhất 2 phương án'),
  body('options.*').trim().notEmpty().withMessage('Phương án không được để trống'),
  body('correctAnswer').isArray({ min: 1 }).withMessage('Cần ít nhất một đáp án đúng'),
  body('correctAnswer.*').isInt({ min: 0 }).withMessage('Đáp án đúng phải là số nguyên dương'),
  body('level').isInt({ min: 1 }).withMessage('Cấp độ phải là số nguyên dương'),
  body('questionType').isIn(['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order'])
    .withMessage('Loại câu hỏi không hợp lệ'),
  body('explanation').optional().trim()
];

// Public routes (for getting questions)
router.get('/', getAllProficiencyQuestions);
router.get('/random', getRandomProficiencyQuestions);
router.get('/:id', getProficiencyQuestionById);

// Admin routes (require authentication and admin role)
router.post('/', authenticate, authorize('admin'), proficiencyQuestionValidation, createProficiencyQuestion);
router.put('/:id', authenticate, authorize('admin'), proficiencyQuestionValidation, updateProficiencyQuestion);
router.delete('/:id', authenticate, authorize('admin'), deleteProficiencyQuestion);

export default router;
