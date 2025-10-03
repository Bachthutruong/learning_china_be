import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import cloudinaryUpload from '../middleware/upload';
import proficiencyQuestionRoutes from './proficiencyQuestions';
import { 
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  downloadVocabularyTemplate,
  importVocabulariesExcel,
  createTopic,
  updateTopic,
  deleteTopic,
  createLevel,
  updateLevel,
  deleteLevel,
  createTest,
  updateTest,
  deleteTest,
  createProficiencyTest,
  updateProficiencyTest,
  deleteProficiencyTest,
  getProficiencyConfigs,
  getProficiencyConfig,
  createProficiencyConfig,
  updateProficiencyConfig,
  deleteProficiencyConfig,
  activateProficiencyConfig,
  getAllCompetitions,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getAdminStats,
  getAllVocabularies,
  getAllTopics,
  getAllLevels,
  getAllTests,
  getAllProficiencyTests,
  getAdminActivities
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Configure multer for handling multipart/form-data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation rules
const vocabularyValidation = [
  body('word').trim().isLength({ min: 1 }),
  body('pronunciation').trim().isLength({ min: 1 }),
  body('meaning').trim().isLength({ min: 1 }),
  body('level').isInt({ min: 1, max: 6 }),
  body('topics').custom((value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return Array.isArray(value);
  }),
  body('examples').optional().custom((value) => {
    if (!value) return true;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return Array.isArray(value);
  }),
  body('synonyms').optional().custom((value) => {
    if (!value) return true;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return Array.isArray(value);
  }),
  body('antonyms').optional().custom((value) => {
    if (!value) return true;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return Array.isArray(value);
  }),
  body('questions').optional().custom((value) => {
    if (!value) return true;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return Array.isArray(value);
  }),
  body('partOfSpeech').trim().isLength({ min: 1 })
];

const topicValidation = [
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().isString(),
  body('color').trim().isLength({ min: 1 })
];

const levelValidation = [
  body('name').trim().isLength({ min: 1 }),
  body('number').optional().isNumeric(),
  body('level').optional().isNumeric(),
  body('description').optional().isString(),
  body('requiredExperience').isNumeric(),
  body('color').trim().isLength({ min: 1 }),
  body('icon').optional().isString()
];

const testValidation = [
  body('title').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
  body('level').isInt({ min: 1, max: 6 }),
  body('questions').isArray(),
  body('timeLimit').isInt({ min: 1 }),
  body('requiredCoins').isInt({ min: 0 }),
  body('rewardExperience').isInt({ min: 0 }),
  body('rewardCoins').isInt({ min: 0 })
];

const proficiencyTestValidation = [
  body('level').isIn(['A', 'B', 'C']),
  body('questions').isArray(),
  body('timeLimit').isInt({ min: 1 }),
  body('requiredCoins').isInt({ min: 0 }),
  body('rewardExperience').isInt({ min: 0 }),
  body('rewardCoins').isInt({ min: 0 })
];


// All admin routes require authentication and admin authorization
router.use(authenticate, authorize('admin'));

// Admin dashboard
router.get('/stats', getAdminStats);
router.get('/activities', getAdminActivities);

// Vocabulary management
router.get('/vocabularies', getAllVocabularies);
router.get('/vocabularies/template', downloadVocabularyTemplate);
router.post('/vocabularies', cloudinaryUpload.single('audio'), (err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ message: 'File upload failed', error: err.message });
  }
  next();
}, vocabularyValidation, createVocabulary);

router.put('/vocabularies/:id', cloudinaryUpload.single('audio'), (err, req, res, next) => {
  if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ message: 'File upload failed', error: err.message });
  }
  next();
}, vocabularyValidation, updateVocabulary);
router.delete('/vocabularies/:id', deleteVocabulary);

// Import vocabularies via Excel (simple memory upload)
const memoryUpload = multer({ storage: multer.memoryStorage() });
router.post('/vocabularies/import', memoryUpload.single('file'), importVocabulariesExcel);

// Topic management
router.get('/topics', getAllTopics);
router.post('/topics', topicValidation, createTopic);
router.put('/topics/:id', topicValidation, updateTopic);
router.delete('/topics/:id', deleteTopic);

// Level management
router.get('/levels', getAllLevels);
router.post('/levels', levelValidation, createLevel);
router.put('/levels/:id', levelValidation, updateLevel);
router.delete('/levels/:id', deleteLevel);

// Test management
router.get('/tests', getAllTests);
router.post('/tests', testValidation, createTest);
router.put('/tests/:id', testValidation, updateTest);
router.delete('/tests/:id', deleteTest);

// Proficiency questions management
router.use('/proficiency-questions', proficiencyQuestionRoutes);
router.get('/proficiency-tests', getAllProficiencyTests);
router.post('/proficiency-tests', proficiencyTestValidation, createProficiencyTest);
router.put('/proficiency-tests/:id', proficiencyTestValidation, updateProficiencyTest);
router.delete('/proficiency-tests/:id', deleteProficiencyTest);

// Proficiency config management
router.get('/proficiency-configs', getProficiencyConfigs);
router.get('/proficiency-configs/:id', getProficiencyConfig);
router.post('/proficiency-configs', createProficiencyConfig);
router.put('/proficiency-configs/:id', updateProficiencyConfig);
router.delete('/proficiency-configs/:id', deleteProficiencyConfig);
router.post('/proficiency-configs/:id/activate', activateProficiencyConfig);

// Competition management
router.get('/competitions', getAllCompetitions);
router.post('/competitions', createCompetition);
router.put('/competitions/:id', updateCompetition);
router.delete('/competitions/:id', deleteCompetition);

// Users management
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/userController';

router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.post('/users', authenticate, authorize('admin'), createUser);
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);

// Payment configuration management
import { getAllPaymentConfigs } from '../controllers/paymentConfigController';

router.get('/payment-configs', authenticate, authorize('admin'), getAllPaymentConfigs);

export default router;


