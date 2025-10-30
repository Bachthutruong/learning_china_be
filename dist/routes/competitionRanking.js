"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const competitionRankingController_1 = require("../controllers/competitionRankingController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes - Get global ranking
router.get('/global-ranking', auth_1.authenticate, competitionRankingController_1.getGlobalRanking);
router.get('/global-ranking/active-config', competitionRankingController_1.getActiveScoringConfig);
router.get('/scoring-configs-public', competitionRankingController_1.getScoringConfigsPublic);
// Admin routes - Scoring config
router.get('/admin/scoring-configs', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.getScoringConfigs);
router.get('/admin/scoring-configs/active', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.getActiveScoringConfig);
router.get('/admin/scoring-configs/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.getScoringConfig);
router.post('/admin/scoring-configs', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.createScoringConfig);
router.put('/admin/scoring-configs/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.updateScoringConfig);
router.post('/admin/scoring-configs/:id/activate', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.activateScoringConfig);
router.delete('/admin/scoring-configs/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.deleteScoringConfig);
// Admin routes - Rewards config
router.get('/admin/rewards-configs', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.getRewardsConfigs);
router.get('/admin/rewards-configs/active', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.getActiveRewardsConfig);
router.get('/admin/rewards-configs/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.getRewardsConfig);
router.post('/admin/rewards-configs', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.createRewardsConfig);
router.put('/admin/rewards-configs/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.updateRewardsConfig);
router.post('/admin/rewards-configs/:id/activate', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.activateRewardsConfig);
router.delete('/admin/rewards-configs/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.deleteRewardsConfig);
// Admin routes - Distribute rewards
router.post('/admin/distribute-rewards', auth_1.authenticate, (0, auth_1.authorize)('admin'), competitionRankingController_1.distributeGlobalRankingRewards);
exports.default = router;
