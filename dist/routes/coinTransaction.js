"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const coinTransactionController_1 = require("../controllers/coinTransactionController");
const router = express_1.default.Router();
router.get('/me', auth_1.authenticate, coinTransactionController_1.getMyCoinTransactions);
router.get('/admin', auth_1.authenticate, (0, auth_1.authorize)('admin'), coinTransactionController_1.adminListCoinTransactions);
exports.default = router;
