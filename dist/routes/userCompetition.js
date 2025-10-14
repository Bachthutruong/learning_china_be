"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userCompetitionController_1 = require("../controllers/userCompetitionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes (still require auth to get user info)
router.get('/', auth_1.authenticate, userCompetitionController_1.getUserCompetitions);
router.get('/history', auth_1.authenticate, userCompetitionController_1.getUserCompetitionHistory);
router.get('/:id', auth_1.authenticate, userCompetitionController_1.getUserCompetitionById);
router.get('/:id/results', auth_1.authenticate, userCompetitionController_1.getCompetitionResults);
// User routes
router.post('/create', auth_1.authenticate, userCompetitionController_1.createUserCompetition);
router.post('/:id/request-join', auth_1.authenticate, userCompetitionController_1.requestJoinCompetition);
router.post('/:id/start', auth_1.authenticate, userCompetitionController_1.startCompetition);
router.post('/:id/submit', auth_1.authenticate, userCompetitionController_1.submitCompetitionAnswers);
// Creator routes
router.get('/:id/requests', auth_1.authenticate, userCompetitionController_1.getPendingRequests);
router.post('/requests/:requestId/process', auth_1.authenticate, userCompetitionController_1.processJoinRequest);
router.put('/:id/requests/:requestId/approve', auth_1.authenticate, userCompetitionController_1.approveJoinRequest);
router.put('/:id/requests/:requestId/reject', auth_1.authenticate, userCompetitionController_1.rejectJoinRequest);
// Admin route (optional - for manual status update)
router.post('/update-statuses', auth_1.authenticate, userCompetitionController_1.updateCompetitionStatuses);
exports.default = router;
