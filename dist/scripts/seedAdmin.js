"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
    const adminEmail = 'admin@gmail.com';
    const adminPassword = '123456789';
    const adminName = process.env.ADMIN_NAME || 'Administrator';
    try {
        await mongoose_1.default.connect(uri);
        console.log('Connected to MongoDB');
        const existing = await User_1.default.findOne({ email: adminEmail });
        if (existing) {
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
                console.log(`Updated existing user to admin: ${adminEmail}`);
            }
            else {
                console.log(`Admin already exists: ${adminEmail}`);
            }
        }
        else {
            const admin = new User_1.default({
                email: adminEmail,
                password: adminPassword,
                name: adminName,
                role: 'admin'
            });
            await admin.save();
            console.log(`Created admin user: ${adminEmail}`);
        }
    }
    catch (err) {
        console.error('Seed admin error:', err);
        process.exitCode = 1;
    }
    finally {
        await mongoose_1.default.connection.close();
    }
}
run();
//# sourceMappingURL=seedAdmin.js.map