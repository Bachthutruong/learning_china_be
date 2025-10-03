"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const vocabularyController_1 = require("../controllers/vocabularyController");
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
// Validation rules
const vocabularyValidation = [
    (0, express_validator_1.body)('word').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('pronunciation').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('meaning').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('level').isInt({ min: 1, max: 6 }),
    (0, express_validator_1.body)('topics').isArray(),
    (0, express_validator_1.body)('partOfSpeech').trim().isLength({ min: 1 })
];
const topicValidation = [
    (0, express_validator_1.body)('name').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('description').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('color').trim().isLength({ min: 1 })
];
// Public routes
router.get('/topics', vocabularyController_1.getTopics);
// Public routes (must be before /:id routes)
router.get('/categories', vocabularyController_1.getCategories);
router.get('/by-categories', auth_1.authenticate, vocabularyController_1.getVocabulariesByCategories);
// Protected routes
router.get('/', auth_1.authenticate, vocabularyController_1.getVocabularies);
router.get('/suggested', auth_1.authenticate, vocabularyController_1.getSuggestedVocabularies);
router.get('/:id', auth_1.authenticate, vocabularyController_1.getVocabularyById);
router.get('/:id/quiz', auth_1.authenticate, vocabularyController_1.getVocabularyQuiz);
router.post('/complete', auth_1.authenticate, vocabularyController_1.completeVocabulary);
router.post('/ai-suggestions', auth_1.authenticate, vocabularyController_1.getAISuggestions);
// Admin routes
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), vocabularyValidation, vocabularyController_1.createVocabulary);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), vocabularyValidation, vocabularyController_1.updateVocabulary);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), vocabularyController_1.deleteVocabulary);
router.post('/topics', auth_1.authenticate, (0, auth_1.authorize)('admin'), topicValidation, vocabularyController_1.createTopic);
// Upload audio route
router.post('/upload-audio', auth_1.authenticate, (0, auth_1.authorize)('admin'), upload_1.default.single('audio'), (req, res) => {
    res.json({
        message: 'Audio uploaded successfully',
        audioUrl: req.file?.path
    });
});
exports.default = router;
