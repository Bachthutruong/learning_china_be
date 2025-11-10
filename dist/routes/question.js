"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const questionController_1 = require("../controllers/questionController");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
router.get('/next', auth_1.authenticate, (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }), questionController_1.getNextQuestions);
router.get('/all', auth_1.authenticate, (0, express_validator_1.query)('level').optional().isInt({ min: 1, max: 10 }), questionController_1.getAllQuestionsByLevel);
router.get('/progress', auth_1.authenticate, questionController_1.getProgressSummary);
router.post('/submit', auth_1.authenticate, (0, express_validator_1.body)('questionId').isMongoId(), (0, express_validator_1.body)('answer').exists(), questionController_1.submitAnswer);
// Admin CRUD
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), questionController_1.listQuestions);
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.body)('level').isNumeric(), (0, express_validator_1.body)('questionType').isIn(['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order']), (0, express_validator_1.body)('question').trim().isLength({ min: 1 }), questionController_1.createQuestion);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), (0, express_validator_1.body)('level').optional().isNumeric(), (0, express_validator_1.body)('questionType').optional().isIn(['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order']), (0, express_validator_1.body)('question').optional().trim().isLength({ min: 1 }), questionController_1.updateQuestion);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), questionController_1.deleteQuestion);
// Admin: Import/Template download for question bank
const memoryUpload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.get('/template', auth_1.authenticate, (0, auth_1.authorize)('admin'), questionController_1.downloadQuestionTemplate);
router.post('/import', auth_1.authenticate, (0, auth_1.authorize)('admin'), memoryUpload.single('file'), questionController_1.importQuestionsExcel);
router.get('/:id/history', auth_1.authenticate, (0, auth_1.authorize)('admin'), questionController_1.getQuestionAttemptHistory);
exports.default = router;
