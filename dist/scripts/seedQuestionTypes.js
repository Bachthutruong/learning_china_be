"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const QuestionType_1 = __importDefault(require("../models/QuestionType"));
dotenv_1.default.config();
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
        await mongoose_1.default.connect(uri);
        console.log('Connected to MongoDB');
        // Clear existing question types
        console.log('Clearing existing question types...');
        await QuestionType_1.default.deleteMany({});
        // Seed question types
        console.log('Seeding question types...');
        const createdQuestionTypes = await QuestionType_1.default.insertMany(questionTypes);
        console.log(`Created ${createdQuestionTypes.length} question types`);
        console.log('✅ Question types seeded successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Question Types: ${createdQuestionTypes.length}`);
    }
    catch (error) {
        console.error('❌ Error seeding question types:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('Database connection closed');
    }
}
// Run the seed function
seedQuestionTypes();
//# sourceMappingURL=seedQuestionTypes.js.map