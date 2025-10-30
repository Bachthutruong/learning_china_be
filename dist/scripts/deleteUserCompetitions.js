"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const UserCompetition_1 = __importDefault(require("../models/UserCompetition"));
const UserCompetitionRequest_1 = __importDefault(require("../models/UserCompetitionRequest"));
const UserCompetitionResult_1 = __importDefault(require("../models/UserCompetitionResult"));
dotenv_1.default.config();
async function deleteUserCompetitions() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
        await mongoose_1.default.connect(uri);
        console.log('Connected to MongoDB');
        // Count before deletion
        const competitionCount = await UserCompetition_1.default.countDocuments();
        const requestCount = await UserCompetitionRequest_1.default.countDocuments();
        const resultCount = await UserCompetitionResult_1.default.countDocuments();
        console.log(`\nFound ${competitionCount} user competitions`);
        console.log(`Found ${requestCount} join requests`);
        console.log(`Found ${resultCount} competition results`);
        // Delete related data first
        console.log('\nDeleting competition results...');
        await UserCompetitionResult_1.default.deleteMany({});
        console.log(`Deleted ${resultCount} competition results`);
        console.log('Deleting join requests...');
        await UserCompetitionRequest_1.default.deleteMany({});
        console.log(`Deleted ${requestCount} join requests`);
        // Delete competitions
        console.log('Deleting user competitions...');
        await UserCompetition_1.default.deleteMany({});
        console.log(`Deleted ${competitionCount} user competitions`);
        console.log('\n✅ All user competitions and related data have been deleted successfully!');
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error('Error deleting user competitions:', error);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
// Run the script
deleteUserCompetitions();
