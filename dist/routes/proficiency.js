"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const proficiencyController_1 = require("../controllers/proficiencyController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation rules
const submitProficiencyTestValidation = [
    (0, express_validator_1.body)('answers').isArray(),
    (0, express_validator_1.body)('questionIds').isArray(),
    (0, express_validator_1.body)('phase').optional().isIn(['initial', 'followup', 'final']),
    (0, express_validator_1.body)('configId').isString()
];
// Protected routes
router.get('/config', auth_1.authenticate, proficiencyController_1.getProficiencyConfig);
router.post('/start', auth_1.authenticate, proficiencyController_1.startProficiencyTest);
router.post('/submit', auth_1.authenticate, submitProficiencyTestValidation, proficiencyController_1.submitProficiencyTest);
router.get('/history', auth_1.authenticate, proficiencyController_1.getProficiencyHistory);
exports.default = router;
//# sourceMappingURL=proficiency.js.map