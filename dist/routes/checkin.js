"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const checkinController_1 = require("../controllers/checkinController");
const router = express_1.default.Router();
router.get('/status', auth_1.authenticate, checkinController_1.getCheckinStatus);
router.post('/', auth_1.authenticate, checkinController_1.performCheckin);
exports.default = router;
