import express from 'express';
import { body } from 'express-validator';
import { 
  getQuestionTypes,
  createAdvancedTest,
  submitAdvancedTest,
  generateQuestionsByType
} from '../controllers/advancedTestController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const createTestValidation = [
  body('title').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
  body('level').isInt({ min: 1, max: 6 }),
  body('questions').isArray({ min: 1 }),
  body('timeLimit').isInt({ min: 1 }),
  body('requiredCoins').isInt({ min: 0 }),
  body('rewardExperience').isInt({ min: 0 }),
  body('rewardCoins').isInt({ min: 0 })
];

const submitTestValidation = [
  body('testId').isMongoId(),
  body('answers').isArray()
];

// Public routes
router.get('/question-types', getQuestionTypes);
router.get('/generate', authenticate, generateQuestionsByType);

// Protected routes
router.post('/create', authenticate, authorize('admin'), createTestValidation, createAdvancedTest);
router.post('/submit', authenticate, submitTestValidation, submitAdvancedTest);

export default router;

