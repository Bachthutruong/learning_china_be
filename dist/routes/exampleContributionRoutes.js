"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const exampleContributionController_1 = require("../controllers/exampleContributionController");
const router = express_1.default.Router();
// Public/User endpoints
router.get('/vocabulary/:vocabularyId/examples', auth_1.authenticate, exampleContributionController_1.getApprovedExamples);
router.post('/contribute', auth_1.authenticate, exampleContributionController_1.createContribution);
// Admin / Reviewer endpoints
router.get('/admin', auth_1.authenticate, (0, auth_1.authorizeReviewerOrAdmin)(), exampleContributionController_1.getContributionsForReview);
router.put('/admin/review/:id', auth_1.authenticate, (0, auth_1.authorizeReviewerOrAdmin)(), exampleContributionController_1.reviewContribution);
router.delete('/admin/:id', auth_1.authenticate, (0, auth_1.authorizeReviewerOrAdmin)(), exampleContributionController_1.deleteContribution);
// Admin only (settings)
router.get('/admin/config', auth_1.authenticate, (0, auth_1.authorize)('admin'), exampleContributionController_1.getRewardConfig);
router.put('/admin/config', auth_1.authenticate, (0, auth_1.authorize)('admin'), exampleContributionController_1.updateRewardConfig);
exports.default = router;
