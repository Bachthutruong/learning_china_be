"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const testController_1 = require("../controllers/testController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const testValidation = [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('description').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('level').isInt({ min: 1, max: 6 }),
    (0, express_validator_1.body)('questions').isArray(),
    (0, express_validator_1.body)('timeLimit').isInt({ min: 1 }),
    (0, express_validator_1.body)('requiredCoins').isInt({ min: 0 }),
    (0, express_validator_1.body)('rewardExperience').isInt({ min: 0 }),
    (0, express_validator_1.body)('rewardCoins').isInt({ min: 0 })
];
const submitTestValidation = [
    (0, express_validator_1.body)('answers').isArray(),
    (0, express_validator_1.body)('questionIds').isArray()
];
// Protected routes
router.get('/', auth_1.authenticate, testController_1.getTests);
router.get('/stats', auth_1.authenticate, testController_1.getTestStats);
router.get('/level/:level', auth_1.authenticate, testController_1.getTestByLevel);
router.get('/:id', auth_1.authenticate, testController_1.getTestById);
router.post('/start', auth_1.authenticate, testController_1.startTest);
router.get('/questions/random', auth_1.authenticate, testController_1.getRandomQuestions);
router.post('/submit', auth_1.authenticate, submitTestValidation, testController_1.submitTest);
// Admin routes
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), testValidation, testController_1.createTest);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), testValidation, testController_1.updateTest);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), testController_1.deleteTest);
exports.default = router;
