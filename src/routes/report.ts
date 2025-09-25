import express from 'express';
import { body } from 'express-validator';
import { 
  createReport, 
  getReports, 
  getReportById,
  getAdminReports,
  updateReportStatus
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const reportValidation = [
  body('type').isIn(['vocabulary', 'test', 'proficiency']),
  body('targetId').isMongoId(),
  body('category').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 })
];

const updateReportValidation = [
  body('status').isIn(['pending', 'approved', 'rejected']),
  body('rewardExperience').optional().isInt({ min: 0 }),
  body('rewardCoins').optional().isInt({ min: 0 }),
  body('adminNotes').optional().trim()
];

// Protected routes
router.post('/', authenticate, reportValidation, createReport);
router.get('/', authenticate, getReports);
router.get('/:id', authenticate, getReportById);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), getAdminReports);
router.put('/admin/:id', authenticate, authorize('admin'), updateReportValidation, updateReportStatus);

export default router;


