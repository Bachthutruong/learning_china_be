import express from 'express';
import { body } from 'express-validator';
import { 
  getProficiencyTests, 
  getProficiencyTestByLevel, 
  createProficiencyTest,
  submitProficiencyTest,
  getInitialProficiencyTest
} from '../controllers/proficiencyController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const proficiencyTestValidation = [
  body('level').isIn(['A', 'B', 'C']),
  body('questions').isArray(),
  body('timeLimit').isInt({ min: 1 }),
  body('requiredCoins').isInt({ min: 0 }),
  body('rewardExperience').isInt({ min: 0 }),
  body('rewardCoins').isInt({ min: 0 })
];

const submitProficiencyTestValidation = [
  body('level').isIn(['A', 'B', 'C']),
  body('answers').isArray(),
  body('timeSpent').isInt({ min: 0 })
];

// Protected routes
router.get('/', authenticate, getProficiencyTests);
router.get('/initial', authenticate, getInitialProficiencyTest);
router.get('/:level', authenticate, getProficiencyTestByLevel);
router.post('/submit', authenticate, submitProficiencyTestValidation, submitProficiencyTest);

// Admin routes
router.post('/', authenticate, authorize('admin'), proficiencyTestValidation, createProficiencyTest);

export default router;
