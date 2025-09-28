import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dycxmy3tq',
  api_key: process.env.CLOUDINARY_API_KEY || '728763913524778',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'S6hvz7VYYQ81LFkctZacoWXer7E',
  timeout: 30000, // 30 seconds timeout
  secure: true
};

cloudinary.config(cloudinaryConfig);

// Configure multer with Cloudinary storage for images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chinese-learning/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  } as any
});

const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export default uploadImage;
