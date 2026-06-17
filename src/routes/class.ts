import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getClassOptions,
  getClassContentOptions,
  listAdminClasses,
  listTeacherClasses,
  listMyClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassDetail,
  getClassSessions,
  createClassSession,
  updateClassSession,
  deleteClassSession,
  getSessionRoster,
  submitSessionFeedback,
  updateFeedbackStatus,
  requestLeave,
  cancelLeave,
  reviewLeave,
  submitClassWork,
  listAvailableClasses,
  requestJoinClass,
  cancelJoinRequest,
  listClassJoinRequests,
  reviewJoinRequest
} from '../controllers/classController';

const router = express.Router();

router.use(authenticate);

router.get('/options/users', getClassOptions);
router.get('/options/content', getClassContentOptions);

router.get('/admin', listAdminClasses);
router.get('/teacher', listTeacherClasses);
router.get('/my', listMyClasses);
router.get('/available', listAvailableClasses);

router.post('/', createClass);

router.get('/:id', getClassDetail);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

router.post('/:id/join', requestJoinClass);
router.delete('/:id/join', cancelJoinRequest);
router.get('/:id/join-requests', listClassJoinRequests);
router.patch('/:id/join-requests/:studentId', reviewJoinRequest);

router.get('/:id/sessions', getClassSessions);
router.post('/:id/sessions', createClassSession);
router.put('/:id/sessions/:sessionId', updateClassSession);
router.delete('/:id/sessions/:sessionId', deleteClassSession);

router.get('/:id/sessions/:sessionId/roster', getSessionRoster);
router.post('/:id/sessions/:sessionId/feedback', submitSessionFeedback);
router.patch('/:id/sessions/:sessionId/feedback/:studentId/status', updateFeedbackStatus);

router.post('/:id/sessions/:sessionId/leave', requestLeave);
router.delete('/:id/sessions/:sessionId/leave', cancelLeave);
router.patch('/:id/sessions/:sessionId/leave/:studentId', reviewLeave);

router.post('/:id/sessions/:sessionId/submissions', submitClassWork);

export default router;
