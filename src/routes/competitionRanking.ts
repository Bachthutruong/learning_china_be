import express from 'express';
import {
  // Scoring config
  getScoringConfigs,
  getActiveScoringConfig,
  getScoringConfig,
  createScoringConfig,
  updateScoringConfig,
  activateScoringConfig,
  deleteScoringConfig,
  // Rewards config
  getRewardsConfigs,
  getActiveRewardsConfig,
  getRewardsConfig,
  createRewardsConfig,
  updateRewardsConfig,
  activateRewardsConfig,
  deleteRewardsConfig,
  // Global ranking
  getGlobalRanking,
  distributeGlobalRankingRewards,
  getScoringConfigsPublic
} from '../controllers/competitionRankingController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes - Get global ranking
router.get('/global-ranking', authenticate, getGlobalRanking);
router.get('/global-ranking/active-config', getActiveScoringConfig);
router.get('/scoring-configs-public', getScoringConfigsPublic);

// Admin routes - Scoring config
router.get('/admin/scoring-configs', authenticate, authorize('admin'), getScoringConfigs);
router.get('/admin/scoring-configs/active', authenticate, authorize('admin'), getActiveScoringConfig);
router.get('/admin/scoring-configs/:id', authenticate, authorize('admin'), getScoringConfig);
router.post('/admin/scoring-configs', authenticate, authorize('admin'), createScoringConfig);
router.put('/admin/scoring-configs/:id', authenticate, authorize('admin'), updateScoringConfig);
router.post('/admin/scoring-configs/:id/activate', authenticate, authorize('admin'), activateScoringConfig);
router.delete('/admin/scoring-configs/:id', authenticate, authorize('admin'), deleteScoringConfig);

// Admin routes - Rewards config
router.get('/admin/rewards-configs', authenticate, authorize('admin'), getRewardsConfigs);
router.get('/admin/rewards-configs/active', authenticate, authorize('admin'), getActiveRewardsConfig);
router.get('/admin/rewards-configs/:id', authenticate, authorize('admin'), getRewardsConfig);
router.post('/admin/rewards-configs', authenticate, authorize('admin'), createRewardsConfig);
router.put('/admin/rewards-configs/:id', authenticate, authorize('admin'), updateRewardsConfig);
router.post('/admin/rewards-configs/:id/activate', authenticate, authorize('admin'), activateRewardsConfig);
router.delete('/admin/rewards-configs/:id', authenticate, authorize('admin'), deleteRewardsConfig);

// Admin routes - Distribute rewards
router.post('/admin/distribute-rewards', authenticate, authorize('admin'), distributeGlobalRankingRewards);

export default router;

