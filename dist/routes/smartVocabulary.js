"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const smartVocabularyController_1 = require("../controllers/smartVocabularyController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const addVocabularyValidation = [
    (0, express_validator_1.body)('vocabularyIds').isArray({ min: 1 }),
    (0, express_validator_1.body)('vocabularyIds.*').isMongoId(),
    (0, express_validator_1.body)('customTopic').optional().isString()
];
const updateStatusValidation = [
    (0, express_validator_1.body)('userVocabularyId').isMongoId(),
    (0, express_validator_1.body)('status').isIn(['learning', 'known', 'needs-study', 'skipped'])
];
const completeLearningValidation = [
    (0, express_validator_1.body)('userVocabularyId').isMongoId(),
    (0, express_validator_1.body)('quizAnswers').isArray()
];
// Protected routes
router.get('/progress', auth_1.authenticate, smartVocabularyController_1.getUserVocabularyProgress);
router.get('/suggestions', auth_1.authenticate, smartVocabularyController_1.getVocabularySuggestions);
router.get('/search', auth_1.authenticate, smartVocabularyController_1.searchVocabularyByKeywords);
router.get('/next', auth_1.authenticate, smartVocabularyController_1.getNextVocabularyToLearn);
router.get('/quiz/:userVocabularyId', auth_1.authenticate, smartVocabularyController_1.getVocabularyQuiz);
router.post('/add', auth_1.authenticate, addVocabularyValidation, smartVocabularyController_1.addVocabularyToLearning);
router.put('/status', auth_1.authenticate, updateStatusValidation, smartVocabularyController_1.updateVocabularyStatus);
router.post('/complete', auth_1.authenticate, completeLearningValidation, smartVocabularyController_1.completeVocabularyLearning);
exports.default = router;
