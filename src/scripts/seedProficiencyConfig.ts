import mongoose from 'mongoose';
import ProficiencyConfig from '../models/ProficiencyConfig';
import dotenv from 'dotenv';

dotenv.config();

const defaultConfig = {
  name: 'Cấu hình Test Năng lực Mặc định',
  description: 'Cấu hình test năng lực mặc định với logic phân nhánh dựa trên cấp độ',
  cost: 50000,
  initialQuestions: [
    { level: 1, count: 2 },
    { level: 2, count: 3 },
    { level: 3, count: 3 }
  ],
  branches: [
    {
      name: 'Đúng 1-4 câu (Cấp thấp)',
      condition: {
        correctRange: [1, 4],
        fromPhase: 'initial'
      },
      nextQuestions: [
        { level: 1, count: 8 }
      ],
      nextPhase: 'followup'
    },
    {
      name: 'Đúng 5-6 câu (Cấp trung bình)',
      condition: {
        correctRange: [5, 6],
        fromPhase: 'initial'
      },
      nextQuestions: [
        { level: 2, count: 8 }
      ],
      nextPhase: 'followup'
    },
    {
      name: 'Đúng 7-8 câu (Cấp cao)',
      condition: {
        correctRange: [7, 8],
        fromPhase: 'initial'
      },
      nextQuestions: [
        { level: 3, count: 14 }
      ],
      nextPhase: 'final'
    },
    {
      name: 'Đúng 0 câu (Cấp mới bắt đầu)',
      condition: {
        correctRange: [0, 0],
        fromPhase: 'initial'
      },
      nextQuestions: [
        { level: 1, count: 14 }
      ],
      nextPhase: 'final'
    },
    // Followup branches
    {
      name: 'Đúng 1-6 câu A (A1)',
      condition: {
        correctRange: [1, 6],
        fromPhase: 'followup'
      },
      nextQuestions: [],
      resultLevel: 1,
      nextPhase: 'final'
    },
    {
      name: 'Đúng 7-14 câu A (A2)',
      condition: {
        correctRange: [7, 14],
        fromPhase: 'followup'
      },
      nextQuestions: [],
      resultLevel: 2,
      nextPhase: 'final'
    },
    {
      name: 'Đúng 1-6 câu B (B1)',
      condition: {
        correctRange: [1, 6],
        fromPhase: 'followup'
      },
      nextQuestions: [],
      resultLevel: 3,
      nextPhase: 'final'
    },
    {
      name: 'Đúng 7-14 câu B (B2)',
      condition: {
        correctRange: [7, 14],
        fromPhase: 'followup'
      },
      nextQuestions: [],
      resultLevel: 4,
      nextPhase: 'final'
    },
    {
      name: 'Đúng 1-9 câu C (C1)',
      condition: {
        correctRange: [1, 9],
        fromPhase: 'final'
      },
      nextQuestions: [],
      resultLevel: 5,
      nextPhase: 'final'
    },
    {
      name: 'Đúng 10-14 câu C (C2)',
      condition: {
        correctRange: [10, 14],
        fromPhase: 'final'
      },
      nextQuestions: [],
      resultLevel: 6,
      nextPhase: 'final'
    }
  ],
  isActive: true
};

const seedProficiencyConfig = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning_china');
    console.log('Connected to MongoDB');

    // Delete existing configs
    await ProficiencyConfig.deleteMany({});
    console.log('Deleted existing proficiency configs');

    // Create new config
    const config = new ProficiencyConfig(defaultConfig);
    await config.save();
    console.log('Created default proficiency config:', config._id);

    console.log('Proficiency config seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding proficiency config:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding function
seedProficiencyConfig();
