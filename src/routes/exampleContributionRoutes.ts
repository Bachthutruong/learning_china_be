import express from 'express';
import { authenticate, authorize, authorizeReviewerOrAdmin } from '../middleware/auth';
import {
  createContribution,
  getApprovedExamples,
  getContributionsForReview,
  reviewContribution,
  deleteContribution,
  getRewardConfig,
  updateRewardConfig
} from '../controllers/exampleContributionController';

const router = express.Router();

// Public/User endpoints
router.get('/vocabulary/:vocabularyId/examples', authenticate, getApprovedExamples);
router.post('/contribute', authenticate, createContribution);

// Admin / Reviewer endpoints
router.get('/admin', authenticate, authorizeReviewerOrAdmin(), getContributionsForReview);
router.put('/admin/review/:id', authenticate, authorizeReviewerOrAdmin(), reviewContribution);
router.delete('/admin/:id', authenticate, authorizeReviewerOrAdmin(), deleteContribution);

// Admin only (settings)
router.get('/admin/config', authenticate, authorize('admin'), getRewardConfig);
router.put('/admin/config', authenticate, authorize('admin'), updateRewardConfig);

export default router;
