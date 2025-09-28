"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = exports.uploadImage = void 0;
// Upload single image
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const file = req.file;
        console.log('Uploaded file info:', {
            path: file.path,
            secure_url: file.secure_url,
            public_id: file.public_id,
            originalname: file.originalname
        });
        // Use path as it contains the correct Cloudinary URL
        const imageUrl = file.path;
        console.log('Using imageUrl:', imageUrl);
        res.json({
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
            publicId: file.public_id,
            secureUrl: file.secure_url
        });
    }
    catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.uploadImage = uploadImage;
// Upload multiple images
const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        const files = req.files;
        const imageUrls = files.map(file => ({
            imageUrl: file.path,
            publicId: file.public_id,
            secureUrl: file.secure_url
        }));
        res.json({
            message: 'Images uploaded successfully',
            images: imageUrls
        });
    }
    catch (error) {
        console.error('Upload multiple images error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.uploadMultipleImages = uploadMultipleImages;
