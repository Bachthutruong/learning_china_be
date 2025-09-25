import express from 'express';
import { body } from 'express-validator';
import { 
  getTests, 
  getTestById, 
  createTest, 
  updateTest, 
  deleteTest,
  submitTest,
  getTestByLevel,
  getTestStats
} from '../controllers/testController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const testValidation = [
  body('title').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
  body('level').isInt({ min: 1, max: 6 }),
  body('questions').isArray(),
  body('timeLimit').isInt({ min: 1 }),
  body('requiredCoins').isInt({ min: 0 }),
  body('rewardExperience').isInt({ min: 0 }),
  body('rewardCoins').isInt({ min: 0 })
];

const submitTestValidation = [
  body('testId').isMongoId(),
  body('answers').isArray(),
  body('timeSpent').isInt({ min: 0 })
];

// Protected routes
router.get('/', authenticate, getTests);
router.get('/stats', authenticate, getTestStats);
router.get('/level/:level', authenticate, getTestByLevel);
router.get('/:id', authenticate, getTestById);
router.post('/submit', authenticate, submitTestValidation, submitTest);

// Admin routes
router.post('/', authenticate, authorize('admin'), testValidation, createTest);
router.put('/:id', authenticate, authorize('admin'), testValidation, updateTest);
router.delete('/:id', authenticate, authorize('admin'), deleteTest);

export default router;
