import express from 'express';
import { body } from 'express-validator';
import {
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
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

// Validation rules
const vocabularyValidation = [
  body('word').trim().isLength({ min: 1 }),
  body('pronunciation').trim().isLength({ min: 1 }),
  body('meaning').trim().isLength({ min: 1 }),
  body('level').isInt({ min: 1, max: 6 }),
  body('topics').isArray(),
  body('partOfSpeech').trim().isLength({ min: 1 })
];

const topicValidation = [
  body('name').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
  body('color').trim().isLength({ min: 1 })
];

const levelValidation = [
  body('name').trim().isLength({ min: 1 }),
  body('number').isInt({ min: 1, max: 6 }),
  body('description').trim().isLength({ min: 1 }),
  body('requiredExperience').isInt({ min: 0 }),
  body('color').trim().isLength({ min: 1 })
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
router.post('/vocabularies', vocabularyValidation, createVocabulary);
router.put('/vocabularies/:id', vocabularyValidation, updateVocabulary);
router.delete('/vocabularies/:id', deleteVocabulary);

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

// Proficiency test management
router.get('/proficiency-tests', getAllProficiencyTests);
router.post('/proficiency-tests', proficiencyTestValidation, createProficiencyTest);
router.put('/proficiency-tests/:id', proficiencyTestValidation, updateProficiencyTest);
router.delete('/proficiency-tests/:id', deleteProficiencyTest);

export default router;


