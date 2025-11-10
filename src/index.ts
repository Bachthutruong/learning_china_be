import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import vocabularyRoutes from './routes/vocabulary';
import testRoutes from './routes/test';
import proficiencyRoutes from './routes/proficiency';
import reportRoutes from './routes/report';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import competitionRoutes from './routes/competition';
import smartVocabularyRoutes from './routes/smartVocabulary';
import advancedTestRoutes from './routes/advancedTest';
import questionRoutes from './routes/question';
import vocabularyLearningRoutes from './routes/vocabularyLearning';
// Models for index maintenance
import { UserVocabulary } from './models/UserVocabulary';
import coinPurchaseRoutes from './routes/coinPurchase';
import paymentConfigRoutes from './routes/paymentConfig';
import coinTransactionRoutes from './routes/coinTransaction';
import uploadRoutes from './routes/upload';
import checkinRoutes from './routes/checkin';
import userCompetitionRoutes from './routes/userCompetition';
import competitionRankingRoutes from './routes/competitionRanking';
import blogPostRoutes from './routes/blogPost';

// Load environment variables
dotenv.config();

// Debug: Check if JWT_SECRET is loaded
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');

const app = express();

// Security middleware
app.use(helmet());

// Removed CORS and rate limiting middleware per request

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/auth', authRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/proficiency', proficiencyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/smart-vocabulary', smartVocabularyRoutes);
app.use('/api/advanced-tests', advancedTestRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/vocabulary-learning', vocabularyLearningRoutes);
app.use('/api/coin-purchases', coinPurchaseRoutes);
app.use('/api/payment-config', paymentConfigRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/coin-transactions', coinTransactionRoutes);
app.use('/api/user-competitions', userCompetitionRoutes);
app.use('/api/competition-ranking', competitionRankingRoutes);
app.use('/api/blog-posts', blogPostRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning')
  .then(() => {
    console.log('Connected to MongoDB');

    // Safe one-time migration: drop old unique index (userId_1_vocabularyId_1)
    // so a user can add the same vocabulary to multiple personal topics.
    UserVocabulary.collection.dropIndex('userId_1_vocabularyId_1').then(() => {
      console.log('Dropped legacy index userId_1_vocabularyId_1');
    }).catch(() => {
      // Ignore if it does not exist
    });

    // Ensure new compound unique index exists
    UserVocabulary.collection.createIndex(
      { userId: 1, vocabularyId: 1, personalTopicId: 1 },
      { unique: true }
    ).then(() => {
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
