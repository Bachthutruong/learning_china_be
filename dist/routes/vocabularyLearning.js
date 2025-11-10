"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const vocabularyLearningController_1 = require("../controllers/vocabularyLearningController");
const router = express_1.default.Router();
// Auth required to personalize list (exclude learned)
router.get('/vocabularies', auth_1.authenticate, vocabularyLearningController_1.getVocabularies);
router.get('/vocabularies/:vocabularyId/quiz', vocabularyLearningController_1.getVocabularyQuiz);
// Protected routes (require authentication)
router.get('/user/personal-topics', auth_1.authenticate, vocabularyLearningController_1.getPersonalTopics);
router.post('/user/personal-topics', auth_1.authenticate, vocabularyLearningController_1.personalTopicValidation, vocabularyLearningController_1.createPersonalTopic);
router.post('/personal-topics', auth_1.authenticate, vocabularyLearningController_1.personalTopicValidation, vocabularyLearningController_1.createPersonalTopic);
router.get('/user/vocabularies', auth_1.authenticate, vocabularyLearningController_1.getUserVocabularies);
router.post('/user/vocabularies', auth_1.authenticate, vocabularyLearningController_1.userVocabularyValidation, vocabularyLearningController_1.addUserVocabulary);
router.post('/user/vocabularies/complete', auth_1.authenticate, vocabularyLearningController_1.completeLearningValidation, vocabularyLearningController_1.completeVocabularyLearning);
router.get('/user/vocabularies/suggestions', auth_1.authenticate, vocabularyLearningController_1.getVocabularySuggestions);
// New routes for simplified vocabulary learning
router.get('/vocabulary/available', auth_1.authenticate, vocabularyLearningController_1.getAvailableVocabularies);
router.get('/vocabulary/by-topic', auth_1.authenticate, vocabularyLearningController_1.getVocabulariesByTopic);
router.post('/personal-topics/add-vocabularies', auth_1.authenticate, vocabularyLearningController_1.addVocabulariesToTopic);
router.get('/vocabulary/learned-for-quiz', auth_1.authenticate, vocabularyLearningController_1.getLearnedVocabulariesForQuiz);
// Stats
router.get('/stats/learners-by-vocabulary', auth_1.authenticate, vocabularyLearningController_1.getLearnersByVocabularyStats);
router.get('/stats/monthly', auth_1.authenticate, vocabularyLearningController_1.getMonthlyVocabularyLearners);
exports.default = router;
