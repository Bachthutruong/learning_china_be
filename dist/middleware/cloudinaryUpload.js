"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryUpload = exports.uploadImage = exports.uploadAudio = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
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
cloudinary_1.v2.config(cloudinaryConfig);
// Configure multer with Cloudinary storage for audio files
const audioStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'chinese-learning/audio',
        resource_type: 'auto',
        allowed_formats: ['mp3', 'wav', 'm4a', 'aac']
    }
});
// Configure multer with Cloudinary storage for image files
const imageStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'chinese-learning/images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }
});
// Create separate uploaders for different file types
const uploadAudio = (0, multer_1.default)({
    storage: audioStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for audio
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});
exports.uploadAudio = uploadAudio;
const uploadImage = (0, multer_1.default)({
    storage: imageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for images
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
exports.uploadImage = uploadImage;
// Combined uploader that can handle both audio and image files
const cloudinaryUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // Use memory storage temporarily
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow both audio and image files
        if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only audio and image files are allowed'));
        }
    }
});
// Custom storage that uploads to Cloudinary based on file type
const customStorage = {
    _handleFile: async (req, file, cb) => {
        try {
            const buffer = await new Promise((resolve, reject) => {
                const chunks = [];
                file.stream.on('data', (chunk) => chunks.push(chunk));
                file.stream.on('end', () => resolve(Buffer.concat(chunks)));
                file.stream.on('error', reject);
            });
            // Determine folder and resource type based on file type
            const isImage = file.mimetype.startsWith('image/');
            const folder = isImage ? 'chinese-learning/images' : 'chinese-learning/audio';
            const resourceType = isImage ? 'image' : 'auto';
            // Upload to Cloudinary
            const result = await cloudinary_1.v2.uploader.upload(`data:${file.mimetype};base64,${buffer.toString('base64')}`, {
                folder: folder,
                resource_type: resourceType,
                public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`
            });
            cb(null, {
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
                path: result.secure_url,
                size: result.bytes
            });
        }
        catch (error) {
            cb(error);
        }
    },
    _removeFile: (req, file, cb) => {
        // No cleanup needed for Cloudinary
        cb(null);
    }
};
// Final uploader with custom storage
const cloudinaryUploadFinal = (0, multer_1.default)({
    storage: customStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow both audio and image files
        if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only audio and image files are allowed'));
        }
    }
});
exports.cloudinaryUpload = cloudinaryUploadFinal;
