import dotenv from 'dotenv';
import mongoose from 'mongoose';
import QuestionType from '../models/QuestionType';

dotenv.config();

const questionTypes = [
  {
    type: 'multiple-choice',
    name: 'Trắc nghiệm',
    description: 'Chọn một đáp án đúng từ các lựa chọn',
    icon: '📝',
    isActive: true
  },
  {
    type: 'fill-blank',
    name: 'Điền từ',
    description: 'Điền từ vào chỗ trống',
    icon: '✏️',
    isActive: true
  },
  {
    type: 'reading-comprehension',
    name: 'Đọc hiểu',
    description: 'Đọc đoạn văn và trả lời câu hỏi',
    icon: '📖',
    isActive: true
  },
  {
    type: 'sentence-order',
    name: 'Sắp xếp câu',
    description: 'Sắp xếp các từ thành câu hoàn chỉnh',
    icon: '🔤',
    isActive: true
  },
  {
    type: 'matching',
    name: 'Ghép cặp',
    description: 'Ghép các từ/cụm từ với nghĩa tương ứng',
    icon: '🔗',
    isActive: true
  },
  {
    type: 'true-false',
    name: 'Đúng/Sai',
    description: 'Chọn đúng hoặc sai cho câu phát biểu',
    icon: '✅',
    isActive: true
  }
];

async function seedQuestionTypes() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing question types
    console.log('Clearing existing question types...');
    await QuestionType.deleteMany({});

    // Seed question types
    console.log('Seeding question types...');
    const createdQuestionTypes = await QuestionType.insertMany(questionTypes);
    console.log(`Created ${createdQuestionTypes.length} question types`);

    console.log('✅ Question types seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Question Types: ${createdQuestionTypes.length}`);

  } catch (error) {
    console.error('❌ Error seeding question types:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedQuestionTypes();

