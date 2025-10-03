"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const reportController_1 = require("../controllers/reportController");
const router = express_1.default.Router();
// User routes
router.post('/', auth_1.authenticate, reportController_1.createReport);
router.get('/my-reports', auth_1.authenticate, reportController_1.getUserReports);
// Admin routes
router.get('/admin', auth_1.authenticate, (0, auth_1.authorize)('admin'), reportController_1.getAllReports);
router.get('/admin/all', auth_1.authenticate, (0, auth_1.authorize)('admin'), reportController_1.getAllReports);
router.put('/admin/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), reportController_1.updateReportStatus);
exports.default = router;
