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

console.log('Cloudinary config:', {
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key ? '***' : 'MISSING',
  api_secret: cloudinaryConfig.api_secret ? '***' : 'MISSING'
});

cloudinary.config(cloudinaryConfig);

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chinese-learning/audio',
    resource_type: 'auto',
    allowed_formats: ['mp3', 'wav', 'm4a', 'aac']
  } as any
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export default upload;
