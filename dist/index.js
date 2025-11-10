"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const vocabulary_1 = __importDefault(require("./routes/vocabulary"));
const test_1 = __importDefault(require("./routes/test"));
const proficiency_1 = __importDefault(require("./routes/proficiency"));
const report_1 = __importDefault(require("./routes/report"));
const user_1 = __importDefault(require("./routes/user"));
const admin_1 = __importDefault(require("./routes/admin"));
const competition_1 = __importDefault(require("./routes/competition"));
const smartVocabulary_1 = __importDefault(require("./routes/smartVocabulary"));
const advancedTest_1 = __importDefault(require("./routes/advancedTest"));
const question_1 = __importDefault(require("./routes/question"));
const vocabularyLearning_1 = __importDefault(require("./routes/vocabularyLearning"));
// Models for index maintenance
const UserVocabulary_1 = require("./models/UserVocabulary");
const coinPurchase_1 = __importDefault(require("./routes/coinPurchase"));
const paymentConfig_1 = __importDefault(require("./routes/paymentConfig"));
const coinTransaction_1 = __importDefault(require("./routes/coinTransaction"));
const upload_1 = __importDefault(require("./routes/upload"));
const checkin_1 = __importDefault(require("./routes/checkin"));
const userCompetition_1 = __importDefault(require("./routes/userCompetition"));
const competitionRanking_1 = __importDefault(require("./routes/competitionRanking"));
const blogPost_1 = __importDefault(require("./routes/blogPost"));
// Load environment variables
dotenv_1.default.config();
// Debug: Check if JWT_SECRET is loaded
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// Removed CORS and rate limiting middleware per request
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Timeout middleware
app.use((req, res, next) => {
    req.setTimeout(30000); // 30 seconds timeout
    res.setTimeout(30000);
    next();
});
// Permissive CORS headers without external middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/vocabulary', vocabulary_1.default);
app.use('/api/tests', test_1.default);
app.use('/api/proficiency', proficiency_1.default);
app.use('/api/reports', report_1.default);
app.use('/api/users', user_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/competitions', competition_1.default);
app.use('/api/smart-vocabulary', smartVocabulary_1.default);
app.use('/api/advanced-tests', advancedTest_1.default);
app.use('/api/questions', question_1.default);
app.use('/api/vocabulary-learning', vocabularyLearning_1.default);
app.use('/api/coin-purchases', coinPurchase_1.default);
app.use('/api/payment-config', paymentConfig_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/checkin', checkin_1.default);
app.use('/api/coin-transactions', coinTransaction_1.default);
app.use('/api/user-competitions', userCompetition_1.default);
app.use('/api/competition-ranking', competitionRanking_1.default);
app.use('/api/blog-posts', blogPost_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Database connection
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning')
    .then(() => {
    console.log('Connected to MongoDB');
    // Safe one-time migration: drop old unique index (userId_1_vocabularyId_1)
    // so a user can add the same vocabulary to multiple personal topics.
    UserVocabulary_1.UserVocabulary.collection.dropIndex('userId_1_vocabularyId_1').then(() => {
        console.log('Dropped legacy index userId_1_vocabularyId_1');
    }).catch(() => {
        // Ignore if it does not exist
    });
    // Ensure new compound unique index exists
    UserVocabulary_1.UserVocabulary.collection.createIndex({ userId: 1, vocabularyId: 1, personalTopicId: 1 }, { unique: true }).then(() => {
        console.log('Ensured index userId_1_vocabularyId_1_personalTopicId_1');
    }).catch((err) => {
        console.error('Error ensuring UserVocabulary index:', err);
    });
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
