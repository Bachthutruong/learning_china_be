"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
cloudinary_1.v2.config(cloudinaryConfig);
// Configure multer with Cloudinary storage for images
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'chinese-learning/images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }
});
const uploadImage = (0, multer_1.default)({
    storage: storage,
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
exports.default = uploadImage;
