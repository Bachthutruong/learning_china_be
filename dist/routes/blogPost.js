"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const cloudinaryUpload_1 = require("../middleware/cloudinaryUpload");
const blogPostController_1 = require("../controllers/blogPostController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const blogPostValidation = [
    (0, express_validator_1.body)('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
    (0, express_validator_1.body)('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
    (0, express_validator_1.body)('excerpt').optional().trim(),
    (0, express_validator_1.body)('status').optional().isIn(['draft', 'published']),
    (0, express_validator_1.body)('tags').optional().custom((value) => {
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed);
            }
            catch {
                return false;
            }
        }
        return Array.isArray(value);
    })
];
// Public routes
router.get('/', blogPostController_1.getBlogPosts);
router.get('/:id', blogPostController_1.getBlogPost);
// Admin routes (require authentication and admin authorization)
router.use('/admin', auth_1.authenticate, (0, auth_1.authorize)('admin'));
router.get('/admin/all', blogPostController_1.getAllBlogPosts);
router.get('/admin/:id', blogPostController_1.getBlogPostById);
router.post('/admin', cloudinaryUpload_1.cloudinaryUpload.fields([{ name: 'image', maxCount: 1 }]), (err, req, res, next) => {
    if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: 'File upload failed', error: err.message });
    }
    next();
}, blogPostValidation, blogPostController_1.createBlogPost);
router.put('/admin/:id', cloudinaryUpload_1.cloudinaryUpload.fields([{ name: 'image', maxCount: 1 }]), (err, req, res, next) => {
    if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ message: 'File upload failed', error: err.message });
    }
    next();
}, blogPostValidation, blogPostController_1.updateBlogPost);
router.delete('/admin/:id', blogPostController_1.deleteBlogPost);
exports.default = router;
