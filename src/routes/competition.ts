import express from 'express';
import { body } from 'express-validator';
import { 
  getCompetitions, 
  getCompetitionById, 
  joinCompetition, 
  getCompetitionQuestions,
  submitCompetition,
  getCompetitionLeaderboard,
  getGlobalLeaderboard,
  getCompetitionStats
} from '../controllers/competitionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Validation rules
const joinCompetitionValidation = [
  body('competitionId').isMongoId().withMessage('Valid competition ID is required')
];

// Public routes
router.get('/', getCompetitions);
router.get('/:id', getCompetitionById);
router.get('/leaderboard', getGlobalLeaderboard);
router.get('/:competitionId/leaderboard', getCompetitionLeaderboard);

// Protected routes
router.post('/join', authenticate, joinCompetitionValidation, joinCompetition);
router.get('/:competitionId/questions', authenticate, getCompetitionQuestions);
router.post('/submit', authenticate, submitCompetition);
router.get('/stats', authenticate, getCompetitionStats);

export default router;


