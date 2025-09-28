"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const proficiencyQuestionController_1 = require("../controllers/proficiencyQuestionController");
const router = express_1.default.Router();
// Validation middleware
const proficiencyQuestionValidation = [
    (0, express_validator_1.body)('question').trim().notEmpty().withMessage('Câu hỏi là bắt buộc'),
    (0, express_validator_1.body)('options').isArray({ min: 2 }).withMessage('Cần ít nhất 2 phương án'),
    (0, express_validator_1.body)('options.*').trim().notEmpty().withMessage('Phương án không được để trống'),
    (0, express_validator_1.body)('correctAnswer').isArray({ min: 1 }).withMessage('Cần ít nhất một đáp án đúng'),
    (0, express_validator_1.body)('correctAnswer.*').isInt({ min: 0 }).withMessage('Đáp án đúng phải là số nguyên dương'),
    (0, express_validator_1.body)('level').isInt({ min: 1 }).withMessage('Cấp độ phải là số nguyên dương'),
    (0, express_validator_1.body)('questionType').isIn(['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order'])
        .withMessage('Loại câu hỏi không hợp lệ'),
    (0, express_validator_1.body)('explanation').optional().trim()
];
// Public routes (for getting questions)
router.get('/', proficiencyQuestionController_1.getAllProficiencyQuestions);
router.get('/random', proficiencyQuestionController_1.getRandomProficiencyQuestions);
router.get('/:id', proficiencyQuestionController_1.getProficiencyQuestionById);
// Admin routes (require authentication and admin role)
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), proficiencyQuestionValidation, proficiencyQuestionController_1.createProficiencyQuestion);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), proficiencyQuestionValidation, proficiencyQuestionController_1.updateProficiencyQuestion);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), proficiencyQuestionController_1.deleteProficiencyQuestion);
exports.default = router;
