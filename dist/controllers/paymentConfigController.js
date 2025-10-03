"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPaymentConfigs = exports.createOrUpdatePaymentConfig = exports.getPaymentConfig = void 0;
const PaymentConfig_1 = __importDefault(require("../models/PaymentConfig"));
const express_validator_1 = require("express-validator");
// Get payment configuration
const getPaymentConfig = async (req, res) => {
    try {
        const config = await PaymentConfig_1.default.findOne({ isActive: true });
        if (!config) {
            return res.status(404).json({ message: 'Payment configuration not found' });
        }
        res.json({ config });
    }
    catch (error) {
        console.error('Get payment config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPaymentConfig = getPaymentConfig;
// Create or update payment configuration (admin only)
const createOrUpdatePaymentConfig = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { tw, vn } = req.body;
        // Deactivate current config if exists
        await PaymentConfig_1.default.updateMany({ isActive: true }, { isActive: false });
        // Create new config
        const config = new PaymentConfig_1.default({ tw, vn, isActive: true });
        await config.save();
        res.json({
            message: 'Payment configuration updated successfully',
            config
        });
    }
    catch (error) {
        console.error('Create/update payment config error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createOrUpdatePaymentConfig = createOrUpdatePaymentConfig;
// Get all payment configurations (admin only)
const getAllPaymentConfigs = async (req, res) => {
    try {
        const configs = await PaymentConfig_1.default.find().sort({ createdAt: -1 });
        res.json({ configs });
    }
    catch (error) {
        console.error('Get all payment configs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllPaymentConfigs = getAllPaymentConfigs;
