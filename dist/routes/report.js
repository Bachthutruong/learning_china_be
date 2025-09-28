"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const reportValidation = [
    (0, express_validator_1.body)('type').isIn(['vocabulary', 'test', 'proficiency']),
    (0, express_validator_1.body)('targetId').isMongoId(),
    (0, express_validator_1.body)('category').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('description').trim().isLength({ min: 1 })
];
const updateReportValidation = [
    (0, express_validator_1.body)('status').isIn(['pending', 'approved', 'rejected']),
    (0, express_validator_1.body)('rewardExperience').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('rewardCoins').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('adminNotes').optional().trim()
];
// Protected routes
router.post('/', auth_1.authenticate, reportValidation, reportController_1.createReport);
router.get('/', auth_1.authenticate, reportController_1.getReports);
router.get('/:id', auth_1.authenticate, reportController_1.getReportById);
// Admin routes
router.get('/admin/all', auth_1.authenticate, (0, auth_1.authorize)('admin'), reportController_1.getAdminReports);
router.put('/admin/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), updateReportValidation, reportController_1.updateReportStatus);
exports.default = router;
//# sourceMappingURL=report.js.map