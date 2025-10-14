import express from 'express'
import { authenticate, authorize } from '../middleware/auth'
import { 
  createReport, 
  getUserReports, 
  getAllReports, 
  updateReportStatus 
} from '../controllers/reportController'

const router = express.Router()

// User routes
router.post('/', authenticate, createReport)
// Provide default GET / to fetch current user's reports (fixes 404 on /api/reports)
router.get('/', authenticate, getUserReports)
router.get('/my-reports', authenticate, getUserReports)

// Admin routes
router.get('/admin', authenticate, authorize('admin'), getAllReports)
router.get('/admin/all', authenticate, authorize('admin'), getAllReports)
router.put('/admin/:id', authenticate, authorize('admin'), updateReportStatus)

export default router