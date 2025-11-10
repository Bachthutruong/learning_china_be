import express from 'express';
import { body } from 'express-validator';
import { cloudinaryUpload } from '../middleware/cloudinaryUpload';
import {
  getBlogPosts,
  getBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
} from '../controllers/blogPostController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Validation rules
const blogPostValidation = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('excerpt').optional().trim(),
  body('status').optional().isIn(['draft', 'published']),
  body('tags').optional().custom((value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    }
    return Array.isArray(value);
  })
];

// Public routes
router.get('/', getBlogPosts);
router.get('/:id', getBlogPost);

// Admin routes (require authentication and admin authorization)
router.use('/admin', authenticate, authorize('admin'));

router.get('/admin/all', getAllBlogPosts);
router.get('/admin/:id', getBlogPostById);
router.post(
  '/admin',
  cloudinaryUpload.fields([{ name: 'image', maxCount: 1 }]),
  (err: any, req: any, res: any, next: any) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: 'File upload failed', error: err.message });
    }
    next();
  },
  blogPostValidation,
  createBlogPost
);
router.put(
  '/admin/:id',
  cloudinaryUpload.fields([{ name: 'image', maxCount: 1 }]),
  (err: any, req: any, res: any, next: any) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: 'File upload failed', error: err.message });
    }
    next();
  },
  blogPostValidation,
  updateBlogPost
);
router.delete('/admin/:id', deleteBlogPost);

export default router;

