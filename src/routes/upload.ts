import express from 'express';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadController';
import uploadImageMiddleware from '../middleware/uploadImage';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Upload single image (authenticated users)
router.post('/image', authenticate, uploadImageMiddleware.single('image'), uploadImage);

// Upload multiple images (authenticated users)
router.post('/images', authenticate, uploadImageMiddleware.array('images', 5), uploadMultipleImages);

// Upload QR code image (admin only)
router.post('/qr-code', authenticate, authorize('admin'), uploadImageMiddleware.single('image'), uploadImage);

// Upload receipt image (authenticated users)
router.post('/receipt', authenticate, uploadImageMiddleware.single('image'), uploadImage);

export default router;
