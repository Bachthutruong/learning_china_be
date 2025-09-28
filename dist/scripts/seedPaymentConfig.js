"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PaymentConfig_1 = __importDefault(require("../models/PaymentConfig"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const seedPaymentConfig = async () => {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning');
        console.log('Connected to MongoDB');
        // Clear existing payment configs
        await PaymentConfig_1.default.deleteMany({});
        console.log('Cleared existing payment configs');
        // Create default payment config
        const defaultConfig = new PaymentConfig_1.default({
            qrCodeImage: 'https://via.placeholder.com/200x200/000000/FFFFFF?text=QR+Code',
            exchangeRate: 10, // 1 TWD = 10 coins
            bankAccount: '1234567890',
            bankName: 'Taiwan Bank',
            accountHolder: 'Learning China Admin',
            isActive: true
        });
        await defaultConfig.save();
        console.log('Payment config seeded successfully:', defaultConfig);
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding payment config:', error);
        process.exit(1);
    }
};
seedPaymentConfig();
