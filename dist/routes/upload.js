"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadController_1 = require("../controllers/uploadController");
const uploadImage_1 = __importDefault(require("../middleware/uploadImage"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Upload single image (authenticated users)
router.post('/image', auth_1.authenticate, uploadImage_1.default.single('image'), uploadController_1.uploadImage);
// Upload multiple images (authenticated users)
router.post('/images', auth_1.authenticate, uploadImage_1.default.array('images', 5), uploadController_1.uploadMultipleImages);
// Upload QR code image (admin only)
router.post('/qr-code', auth_1.authenticate, (0, auth_1.authorize)('admin'), uploadImage_1.default.single('image'), uploadController_1.uploadImage);
// Upload receipt image (authenticated users)
router.post('/receipt', auth_1.authenticate, uploadImage_1.default.single('image'), uploadController_1.uploadImage);
exports.default = router;
