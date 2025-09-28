"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const competitionController_1 = require("../controllers/competitionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const joinCompetitionValidation = [
    (0, express_validator_1.body)('competitionId').isMongoId().withMessage('Valid competition ID is required')
];
// Public routes
router.get('/', competitionController_1.getCompetitions);
router.get('/leaderboard', competitionController_1.getGlobalLeaderboard);
router.get('/:competitionId/leaderboard', competitionController_1.getCompetitionLeaderboard);
router.get('/:id', competitionController_1.getCompetitionById);
// Protected routes
router.post('/join', auth_1.authenticate, joinCompetitionValidation, competitionController_1.joinCompetition);
router.get('/:competitionId/questions', auth_1.authenticate, competitionController_1.getCompetitionQuestions);
router.post('/submit', auth_1.authenticate, competitionController_1.submitCompetition);
router.get('/stats', auth_1.authenticate, competitionController_1.getCompetitionStats);
exports.default = router;
