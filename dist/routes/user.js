"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const purchaseValidation = [
    (0, express_validator_1.body)('amount').isInt({ min: 1000 }),
    (0, express_validator_1.body)('paymentMethod').trim().isLength({ min: 1 })
];
// Protected routes
router.post('/checkin', auth_1.authenticate, userController_1.checkIn);
router.get('/stats', auth_1.authenticate, userController_1.getUserStats);
router.post('/purchase', auth_1.authenticate, purchaseValidation, userController_1.purchaseCoins);
router.get('/payments', auth_1.authenticate, userController_1.getPaymentHistory);
router.get('/leaderboard', auth_1.authenticate, userController_1.getLeaderboard);
router.get('/', auth_1.authenticate, userController_1.getAllUsers);
router.get('/achievements', auth_1.authenticate, userController_1.getUserAchievements);
router.get('/learning-stats', auth_1.authenticate, userController_1.getUserLearningStats);
router.get('/profile', auth_1.authenticate, userController_1.getProfile);
router.post('/recalculate-level', auth_1.authenticate, userController_1.recalculateLevel);
router.post('/force-recalculate-all-levels', auth_1.authenticate, userController_1.forceRecalculateAllLevels);
exports.default = router;
