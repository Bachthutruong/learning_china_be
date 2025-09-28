import express from 'express';
import { body } from 'express-validator';
import { 
  getProficiencyConfig,
  startProficiencyTest,
  submitProficiencyTest,
  getProficiencyHistory
} from '../controllers/proficiencyController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const submitProficiencyTestValidation = [
  body('answers').isArray(),
  body('questionIds').isArray(),
  body('phase').optional().isIn(['initial', 'followup', 'final']),
  body('configId').isString()
];

// Protected routes
router.get('/config', authenticate, getProficiencyConfig);
router.post('/start', authenticate, startProficiencyTest);
router.post('/submit', authenticate, submitProficiencyTestValidation, submitProficiencyTest);
router.get('/history', authenticate, getProficiencyHistory);

export default router;
