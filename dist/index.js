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
const coinPurchase_1 = __importDefault(require("./routes/coinPurchase"));
const paymentConfig_1 = __importDefault(require("./routes/paymentConfig"));
const upload_1 = __importDefault(require("./routes/upload"));
// Load environment variables
dotenv_1.default.config();
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
})
    .catch((error) => {
    console.error('MongoDB connection error:', error);
});
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
