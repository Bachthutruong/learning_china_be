"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const cloudinaryUpload_1 = require("../middleware/cloudinaryUpload");
const proficiencyQuestions_1 = __importDefault(require("./proficiencyQuestions"));
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const TestHistory_1 = __importDefault(require("../models/TestHistory"));
const router = express_1.default.Router();
// Configure multer for handling multipart/form-data
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});
// Validation rules
const vocabularyValidation = [
    (0, express_validator_1.body)('word').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('pinyin').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('zhuyin').optional().trim(),
    (0, express_validator_1.body)('meaning').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('level').isInt({ min: 1, max: 6 }),
    (0, express_validator_1.body)('topics').custom((value) => {
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed);
            }
            catch {
                return false;
            }
        }
        return Array.isArray(value);
    }),
    (0, express_validator_1.body)('examples').optional().custom((value) => {
        if (!value)
            return true;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed);
            }
            catch {
                return false;
            }
        }
        return Array.isArray(value);
    }),
    (0, express_validator_1.body)('synonyms').optional().custom((value) => {
        if (!value)
            return true;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed);
            }
            catch {
                return false;
            }
        }
        return Array.isArray(value);
    }),
    (0, express_validator_1.body)('antonyms').optional().custom((value) => {
        if (!value)
            return true;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed);
            }
            catch {
                return false;
            }
        }
        return Array.isArray(value);
    }),
    (0, express_validator_1.body)('questions').optional().custom((value) => {
        if (!value)
            return true;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed);
            }
            catch {
                return false;
            }
        }
        return Array.isArray(value);
    }),
    (0, express_validator_1.body)('partOfSpeech').trim().isLength({ min: 1 })
];
const topicValidation = [
    (0, express_validator_1.body)('name').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('color').trim().isLength({ min: 1 })
];
const levelValidation = [
    (0, express_validator_1.body)('name').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('number').optional().isNumeric(),
    (0, express_validator_1.body)('level').optional().isNumeric(),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('requiredExperience').isNumeric(),
    (0, express_validator_1.body)('color').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('icon').optional().isString()
];
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
const proficiencyTestValidation = [
    (0, express_validator_1.body)('level').isIn(['A', 'B', 'C']),
    (0, express_validator_1.body)('questions').isArray(),
    (0, express_validator_1.body)('timeLimit').isInt({ min: 1 }),
    (0, express_validator_1.body)('requiredCoins').isInt({ min: 0 }),
    (0, express_validator_1.body)('rewardExperience').isInt({ min: 0 }),
    (0, express_validator_1.body)('rewardCoins').isInt({ min: 0 })
];
// All admin routes require authentication and admin authorization
router.use(auth_1.authenticate, (0, auth_1.authorize)('admin'));
// Admin dashboard
router.get('/stats', adminController_1.getAdminStats);
router.get('/activities', adminController_1.getAdminActivities);
// Vocabulary management
router.get('/vocabularies', adminController_1.getAllVocabularies);
router.get('/vocabularies/template', adminController_1.downloadVocabularyTemplate);
router.post('/vocabularies', cloudinaryUpload_1.cloudinaryUpload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), (err, req, res, next) => {
    if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: 'File upload failed', error: err.message });
    }
    next();
}, vocabularyValidation, adminController_1.createVocabulary);
router.put('/vocabularies/:id', cloudinaryUpload_1.cloudinaryUpload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
]), (err, req, res, next) => {
    if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: 'File upload failed', error: err.message });
    }
    next();
}, vocabularyValidation, adminController_1.updateVocabulary);
router.delete('/vocabularies/:id', adminController_1.deleteVocabulary);
// Import vocabularies via Excel (simple memory upload)
const memoryUpload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/vocabularies/import', memoryUpload.single('file'), adminController_1.importVocabulariesExcel);
// Topic management
router.get('/topics', adminController_1.getAllTopics);
router.post('/topics', topicValidation, adminController_1.createTopic);
router.put('/topics/:id', topicValidation, adminController_1.updateTopic);
router.delete('/topics/:id', adminController_1.deleteTopic);
// Level management
router.get('/levels', adminController_1.getAllLevels);
router.post('/levels', levelValidation, adminController_1.createLevel);
router.put('/levels/:id', levelValidation, adminController_1.updateLevel);
router.delete('/levels/:id', adminController_1.deleteLevel);
// Test management
router.get('/tests', adminController_1.getAllTests);
router.post('/tests', testValidation, adminController_1.createTest);
router.put('/tests/:id', testValidation, adminController_1.updateTest);
router.delete('/tests/:id', adminController_1.deleteTest);
// Proficiency questions management
router.use('/proficiency-questions', proficiencyQuestions_1.default);
router.get('/proficiency-tests', adminController_1.getAllProficiencyTests);
router.post('/proficiency-tests', proficiencyTestValidation, adminController_1.createProficiencyTest);
router.put('/proficiency-tests/:id', proficiencyTestValidation, adminController_1.updateProficiencyTest);
router.delete('/proficiency-tests/:id', adminController_1.deleteProficiencyTest);
// Proficiency config management
router.get('/proficiency-configs', adminController_1.getProficiencyConfigs);
router.get('/proficiency-configs/:id', adminController_1.getProficiencyConfig);
router.post('/proficiency-configs', adminController_1.createProficiencyConfig);
router.put('/proficiency-configs/:id', adminController_1.updateProficiencyConfig);
router.delete('/proficiency-configs/:id', adminController_1.deleteProficiencyConfig);
router.post('/proficiency-configs/:id/activate', adminController_1.activateProficiencyConfig);
// Competition management
router.get('/competitions', adminController_1.getAllCompetitions);
router.post('/competitions', adminController_1.createCompetition);
router.put('/competitions/:id', adminController_1.updateCompetition);
router.delete('/competitions/:id', adminController_1.deleteCompetition);
// Users management
const userController_1 = require("../controllers/userController");
router.get('/users', auth_1.authenticate, (0, auth_1.authorize)('admin'), userController_1.getAllUsers);
router.post('/users', auth_1.authenticate, (0, auth_1.authorize)('admin'), userController_1.createUser);
router.put('/users/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), userController_1.updateUser);
router.delete('/users/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), userController_1.deleteUser);
router.get('/level/:level/experience-range', auth_1.authenticate, (0, auth_1.authorize)('admin'), userController_1.getLevelExperienceRange);
// Payment configuration management
const paymentConfigController_1 = require("../controllers/paymentConfigController");
router.get('/payment-configs', auth_1.authenticate, (0, auth_1.authorize)('admin'), paymentConfigController_1.getAllPaymentConfigs);
// Test history (admin)
router.get('/test-histories', async (req, res) => {
    try {
        const { userId, page = 1, limit = 20 } = req.query;
        const query = {};
        if (userId)
            query.userId = userId;
        const items = await TestHistory_1.default.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const total = await TestHistory_1.default.countDocuments(query);
        res.json({ items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
    }
    catch (e) {
        console.error('List test histories error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
