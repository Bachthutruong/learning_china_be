"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const advancedTestController_1 = require("../controllers/advancedTestController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const createTestValidation = [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('description').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('level').isInt({ min: 1, max: 6 }),
    (0, express_validator_1.body)('questions').isArray({ min: 1 }),
    (0, express_validator_1.body)('timeLimit').isInt({ min: 1 }),
    (0, express_validator_1.body)('requiredCoins').isInt({ min: 0 }),
    (0, express_validator_1.body)('rewardExperience').isInt({ min: 0 }),
    (0, express_validator_1.body)('rewardCoins').isInt({ min: 0 })
];
const submitTestValidation = [
    (0, express_validator_1.body)('testId').isMongoId(),
    (0, express_validator_1.body)('answers').isArray()
];
// Public routes
router.get('/question-types', advancedTestController_1.getQuestionTypes);
router.get('/generate', auth_1.authenticate, advancedTestController_1.generateQuestionsByType);
// Protected routes
router.post('/create', auth_1.authenticate, (0, auth_1.authorize)('admin'), createTestValidation, advancedTestController_1.createAdvancedTest);
router.post('/submit', auth_1.authenticate, submitTestValidation, advancedTestController_1.submitAdvancedTest);
exports.default = router;
//# sourceMappingURL=advancedTest.js.map