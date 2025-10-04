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

// Configure multer with Cloudinary storage for audio files
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chinese-learning/audio',
    resource_type: 'auto',
    allowed_formats: ['mp3', 'wav', 'm4a', 'aac']
  } as any
});

// Configure multer with Cloudinary storage for image files
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chinese-learning/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  } as any
});

// Create separate uploaders for different file types
const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for audio
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

const uploadImage = multer({
  storage: imageStorage,
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

// Combined uploader that can handle both audio and image files
const cloudinaryUpload = multer({
  storage: multer.memoryStorage(), // Use memory storage temporarily
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow both audio and image files
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and image files are allowed'));
    }
  }
});

// Custom storage that uploads to Cloudinary based on file type
const customStorage = {
  _handleFile: async (req: any, file: any, cb: any) => {
    try {
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        file.stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        file.stream.on('end', () => resolve(Buffer.concat(chunks)));
        file.stream.on('error', reject);
      });

      // Determine folder and resource type based on file type
      const isImage = file.mimetype.startsWith('image/');
      const folder = isImage ? 'chinese-learning/images' : 'chinese-learning/audio';
      const resourceType = isImage ? 'image' : 'auto';

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${buffer.toString('base64')}`,
        {
          folder: folder,
          resource_type: resourceType,
          public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`
        }
      );

      cb(null, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        path: result.secure_url,
        size: result.bytes
      });
    } catch (error) {
      cb(error);
    }
  },
  _removeFile: (req: any, file: any, cb: any) => {
    // No cleanup needed for Cloudinary
    cb(null);
  }
};

// Final uploader with custom storage
const cloudinaryUploadFinal = multer({
  storage: customStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow both audio and image files
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and image files are allowed'));
    }
  }
});

export { uploadAudio, uploadImage, cloudinaryUploadFinal as cloudinaryUpload };
