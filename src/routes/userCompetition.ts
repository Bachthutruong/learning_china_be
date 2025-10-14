import express from 'express';
import {
  createUserCompetition,
  getUserCompetitions,
  getUserCompetitionById,
  requestJoinCompetition,
  getPendingRequests,
  processJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  startCompetition,
  submitCompetitionAnswers,
  getCompetitionResults,
  getUserCompetitionHistory,
  updateCompetitionStatuses
} from '../controllers/userCompetitionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes (still require auth to get user info)
router.get('/', authenticate, getUserCompetitions);
router.get('/history', authenticate, getUserCompetitionHistory);
router.get('/:id', authenticate, getUserCompetitionById);
router.get('/:id/results', authenticate, getCompetitionResults);

// User routes
router.post('/create', authenticate , createUserCompetition);
router.post('/:id/request-join', authenticate, requestJoinCompetition);
router.post('/:id/start', authenticate  , startCompetition);
router.post('/:id/submit', authenticate, submitCompetitionAnswers);

// Creator routes
router.get('/:id/requests', authenticate, getPendingRequests);
router.post('/requests/:requestId/process', authenticate, processJoinRequest);
router.put('/:id/requests/:requestId/approve', authenticate, approveJoinRequest);
router.put('/:id/requests/:requestId/reject', authenticate, rejectJoinRequest);

// Admin route (optional - for manual status update)
router.post('/update-statuses', authenticate, updateCompetitionStatuses);

export default router;
