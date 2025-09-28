"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const Topic_1 = __importDefault(require("../models/Topic"));
const Test_1 = __importDefault(require("../models/Test"));
const Competition_1 = __importDefault(require("../models/Competition"));
const Report_1 = __importDefault(require("../models/Report"));
const CompetitionResult_1 = __importDefault(require("../models/CompetitionResult"));
const Payment_1 = __importDefault(require("../models/Payment"));
dotenv_1.default.config();
// Advanced vocabulary data with more levels and topics
const advancedVocabularies = [
    // Level 3-4 vocabularies
    { word: '学习', pronunciation: 'xuéxí', meaning: 'học tập', level: 3, topics: ['Trường học'], partOfSpeech: 'verb', synonyms: ['读书'], antonyms: ['玩耍'], examples: ['我在学习中文', '学习很重要'] },
    { word: '工作', pronunciation: 'gōngzuò', meaning: 'làm việc', level: 3, topics: ['Công việc'], partOfSpeech: 'verb', synonyms: ['上班'], antonyms: ['休息'], examples: ['我在工作', '工作很忙'] },
    { word: '睡觉', pronunciation: 'shuìjiào', meaning: 'ngủ', level: 3, topics: ['Gia đình'], partOfSpeech: 'verb', synonyms: ['休息'], antonyms: ['起床'], examples: ['我要睡觉', '睡觉很舒服'] },
    { word: '吃饭', pronunciation: 'chīfàn', meaning: 'ăn cơm', level: 3, topics: ['Thức ăn'], partOfSpeech: 'verb', synonyms: ['用餐'], antonyms: ['禁食'], examples: ['我要吃饭', '吃饭时间到了'] },
    { word: '喝水', pronunciation: 'hēshuǐ', meaning: 'uống nước', level: 3, topics: ['Thức ăn'], partOfSpeech: 'verb', synonyms: ['饮水'], antonyms: [], examples: ['我要喝水', '喝水很健康'] },
    { word: '看书', pronunciation: 'kànshū', meaning: 'đọc sách', level: 3, topics: ['Trường học'], partOfSpeech: 'verb', synonyms: ['阅读'], antonyms: [], examples: ['我喜欢看书', '看书很有趣'] },
    { word: '听音乐', pronunciation: 'tīngyīnyuè', meaning: 'nghe nhạc', level: 3, topics: ['Gia đình'], partOfSpeech: 'verb', synonyms: ['听歌'], antonyms: [], examples: ['我喜欢听音乐', '音乐很好听'] },
    { word: '看电影', pronunciation: 'kàndiànyǐng', meaning: 'xem phim', level: 3, topics: ['Gia đình'], partOfSpeech: 'verb', synonyms: ['观影'], antonyms: [], examples: ['我喜欢看电影', '电影很有趣'] },
    { word: '运动', pronunciation: 'yùndòng', meaning: 'tập thể dục', level: 3, topics: ['Gia đình'], partOfSpeech: 'verb', synonyms: ['锻炼'], antonyms: ['休息'], examples: ['我喜欢运动', '运动很健康'] },
    { word: '旅游', pronunciation: 'lǚyóu', meaning: 'du lịch', level: 3, topics: ['Du lịch'], partOfSpeech: 'verb', synonyms: ['旅行'], antonyms: [], examples: ['我喜欢旅游', '旅游很有趣'] },
    // Level 4-5 vocabularies
    { word: '医院', pronunciation: 'yīyuàn', meaning: 'bệnh viện', level: 4, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去医院', '医院很大'] },
    { word: '银行', pronunciation: 'yínháng', meaning: 'ngân hàng', level: 4, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去银行', '银行很安全'] },
    { word: '超市', pronunciation: 'chāoshì', meaning: 'siêu thị', level: 4, topics: ['Thức ăn'], partOfSpeech: 'noun', synonyms: ['商场'], antonyms: [], examples: ['我去超市', '超市很大'] },
    { word: '公园', pronunciation: 'gōngyuán', meaning: 'công viên', level: 4, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去公园', '公园很漂亮'] },
    { word: '机场', pronunciation: 'jīchǎng', meaning: 'sân bay', level: 4, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去机场', '机场很大'] },
    { word: '车站', pronunciation: 'chēzhàn', meaning: 'bến xe', level: 4, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去车站', '车站很忙'] },
    { word: '地铁', pronunciation: 'dìtiě', meaning: 'tàu điện ngầm', level: 4, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我坐地铁', '地铁很快'] },
    { word: '出租车', pronunciation: 'chūzūchē', meaning: 'taxi', level: 4, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: ['的士'], antonyms: [], examples: ['我坐出租车', '出租车很方便'] },
    // Level 5-6 vocabularies
    { word: '经济', pronunciation: 'jīngjì', meaning: 'kinh tế', level: 5, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['经济发展', '经济很重要'] },
    { word: '文化', pronunciation: 'wénhuà', meaning: 'văn hóa', level: 5, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['中国文化', '文化很丰富'] },
    { word: '历史', pronunciation: 'lìshǐ', meaning: 'lịch sử', level: 5, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['中国历史', '历史很悠久'] },
    { word: '艺术', pronunciation: 'yìshù', meaning: 'nghệ thuật', level: 5, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['艺术很美', '我喜欢艺术'] },
    { word: '科技', pronunciation: 'kējì', meaning: 'khoa học công nghệ', level: 5, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['科技发展', '科技很重要'] },
    { word: '环境', pronunciation: 'huánjìng', meaning: 'môi trường', level: 5, topics: ['Thời tiết'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['环境保护', '环境很重要'] },
    { word: '社会', pronunciation: 'shèhuì', meaning: 'xã hội', level: 5, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['社会发展', '社会很复杂'] },
    { word: '政治', pronunciation: 'zhèngzhì', meaning: 'chính trị', level: 5, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['政治制度', '政治很重要'] }
];
// More advanced tests
const advancedTests = [
    {
        title: 'Bài test động từ cơ bản',
        description: 'Kiểm tra động từ cơ bản trong tiếng Trung',
        level: 2,
        questions: [
            {
                question: 'Từ "学习" có nghĩa là gì?',
                options: ['Học tập', 'Làm việc', 'Ngủ', 'Ăn'],
                correctAnswer: 0,
                explanation: '"学习" có nghĩa là "học tập".'
            },
            {
                question: 'Từ "工作" có nghĩa là gì?',
                options: ['Học tập', 'Làm việc', 'Ngủ', 'Ăn'],
                correctAnswer: 1,
                explanation: '"工作" có nghĩa là "làm việc".'
            },
            {
                question: 'Từ "睡觉" có nghĩa là gì?',
                options: ['Học tập', 'Làm việc', 'Ngủ', 'Ăn'],
                correctAnswer: 2,
                explanation: '"睡觉" có nghĩa là "ngủ".'
            }
        ],
        timeLimit: 15,
        requiredCoins: 10,
        rewardExperience: 30,
        rewardCoins: 15
    },
    {
        title: 'Bài test danh từ nơi chốn',
        description: 'Kiểm tra từ vựng về nơi chốn',
        level: 3,
        questions: [
            {
                question: 'Từ "医院" có nghĩa là gì?',
                options: ['Bệnh viện', 'Ngân hàng', 'Siêu thị', 'Công viên'],
                correctAnswer: 0,
                explanation: '"医院" có nghĩa là "bệnh viện".'
            },
            {
                question: 'Từ "银行" có nghĩa là gì?',
                options: ['Bệnh viện', 'Ngân hàng', 'Siêu thị', 'Công viên'],
                correctAnswer: 1,
                explanation: '"银行" có nghĩa là "ngân hàng".'
            },
            {
                question: 'Từ "超市" có nghĩa là gì?',
                options: ['Bệnh viện', 'Ngân hàng', 'Siêu thị', 'Công viên'],
                correctAnswer: 2,
                explanation: '"超市" có nghĩa là "siêu thị".'
            }
        ],
        timeLimit: 20,
        requiredCoins: 15,
        rewardExperience: 40,
        rewardCoins: 20
    },
    {
        title: 'Bài test từ vựng nâng cao',
        description: 'Kiểm tra từ vựng nâng cao',
        level: 4,
        questions: [
            {
                question: 'Từ "经济" có nghĩa là gì?',
                options: ['Kinh tế', 'Văn hóa', 'Lịch sử', 'Nghệ thuật'],
                correctAnswer: 0,
                explanation: '"经济" có nghĩa là "kinh tế".'
            },
            {
                question: 'Từ "文化" có nghĩa là gì?',
                options: ['Kinh tế', 'Văn hóa', 'Lịch sử', 'Nghệ thuật'],
                correctAnswer: 1,
                explanation: '"文化" có nghĩa là "văn hóa".'
            },
            {
                question: 'Từ "历史" có nghĩa là gì?',
                options: ['Kinh tế', 'Văn hóa', 'Lịch sử', 'Nghệ thuật'],
                correctAnswer: 2,
                explanation: '"历史" có nghĩa là "lịch sử".'
            }
        ],
        timeLimit: 25,
        requiredCoins: 20,
        rewardExperience: 50,
        rewardCoins: 25
    }
];
// More users with different levels
const additionalUsers = [
    { name: 'Lý Văn Minh', email: 'minh.ly@example.com', password: '123456', level: 4, experience: 700, coins: 350, streak: 18 },
    { name: 'Phan Thị Lan', email: 'lan.phan@example.com', password: '123456', level: 3, experience: 400, coins: 200, streak: 10 },
    { name: 'Võ Văn Hùng', email: 'hung.vo@example.com', password: '123456', level: 5, experience: 1200, coins: 600, streak: 25 },
    { name: 'Đinh Thị Mai', email: 'mai.dinh@example.com', password: '123456', level: 2, experience: 150, coins: 75, streak: 4 },
    { name: 'Lương Văn Tài', email: 'tai.luong@example.com', password: '123456', level: 6, experience: 2000, coins: 1000, streak: 30 },
    { name: 'Trịnh Thị Hương', email: 'huong.trinh@example.com', password: '123456', level: 3, experience: 350, coins: 175, streak: 8 },
    { name: 'Ngô Văn Đức', email: 'duc.ngo@example.com', password: '123456', level: 4, experience: 600, coins: 300, streak: 15 },
    { name: 'Lê Thị Thu', email: 'thu.le@example.com', password: '123456', level: 2, experience: 120, coins: 60, streak: 3 },
    { name: 'Hoàng Văn Nam', email: 'nam.hoang@example.com', password: '123456', level: 5, experience: 1000, coins: 500, streak: 22 },
    { name: 'Bùi Thị Linh', email: 'linh.bui@example.com', password: '123456', level: 1, experience: 40, coins: 20, streak: 1 }
];
// Competition results
const competitionResults = [
    {
        score: 95,
        timeSpent: 1200,
        rewards: { xp: 200, coins: 100 },
        answers: [
            { questionId: 'q1', userAnswer: 0, isCorrect: true, timeSpent: 30 },
            { questionId: 'q2', userAnswer: 1, isCorrect: true, timeSpent: 25 },
            { questionId: 'q3', userAnswer: 2, isCorrect: true, timeSpent: 35 }
        ]
    },
    {
        score: 87,
        timeSpent: 1350,
        rewards: { xp: 150, coins: 75 },
        answers: [
            { questionId: 'q1', userAnswer: 0, isCorrect: true, timeSpent: 30 },
            { questionId: 'q2', userAnswer: 0, isCorrect: false, timeSpent: 25 },
            { questionId: 'q3', userAnswer: 2, isCorrect: true, timeSpent: 35 }
        ]
    },
    {
        score: 92,
        timeSpent: 1280,
        rewards: { xp: 180, coins: 90 },
        answers: [
            { questionId: 'q1', userAnswer: 0, isCorrect: true, timeSpent: 30 },
            { questionId: 'q2', userAnswer: 1, isCorrect: true, timeSpent: 25 },
            { questionId: 'q3', userAnswer: 1, isCorrect: false, timeSpent: 35 }
        ]
    }
];
// Payment history
const payments = [
    { amount: 50000, currency: 'VND', coins: 50, paymentMethod: 'credit_card', paymentStatus: 'completed' },
    { amount: 100000, currency: 'VND', coins: 100, paymentMethod: 'bank_transfer', paymentStatus: 'completed' },
    { amount: 200000, currency: 'VND', coins: 200, paymentMethod: 'wallet', paymentStatus: 'completed' },
    { amount: 300000, currency: 'VND', coins: 300, paymentMethod: 'credit_card', paymentStatus: 'completed' },
    { amount: 150000, currency: 'VND', coins: 150, paymentMethod: 'bank_transfer', paymentStatus: 'completed' }
];
async function seedAdvancedData() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
        await mongoose_1.default.connect(uri);
        console.log('Connected to MongoDB');
        // Get existing data
        const users = await User_1.default.find();
        const competitions = await Competition_1.default.find();
        const topics = await Topic_1.default.find();
        // Seed advanced vocabularies
        console.log('Seeding advanced vocabularies...');
        const createdAdvancedVocabularies = await Vocabulary_1.default.insertMany(advancedVocabularies);
        console.log(`Created ${createdAdvancedVocabularies.length} advanced vocabularies`);
        // Seed additional users
        console.log('Seeding additional users...');
        const createdAdditionalUsers = await User_1.default.insertMany(additionalUsers);
        console.log(`Created ${createdAdditionalUsers.length} additional users`);
        // Seed advanced tests
        console.log('Seeding advanced tests...');
        const createdAdvancedTests = await Test_1.default.insertMany(advancedTests);
        console.log(`Created ${createdAdvancedTests.length} advanced tests`);
        // Seed competition results
        console.log('Seeding competition results...');
        const allUsers = [...users, ...createdAdditionalUsers];
        const competitionResultsData = [];
        for (let i = 0; i < Math.min(competitions.length, 3); i++) {
            const competition = competitions[i];
            const randomUsers = allUsers.sort(() => 0.5 - Math.random()).slice(0, 5);
            for (let j = 0; j < randomUsers.length; j++) {
                const result = competitionResults[j % competitionResults.length];
                competitionResultsData.push({
                    competitionId: competition._id,
                    userId: randomUsers[j]._id,
                    score: result.score,
                    timeSpent: result.timeSpent,
                    rank: j + 1,
                    rewards: result.rewards,
                    answers: result.answers
                });
            }
        }
        const createdCompetitionResults = await CompetitionResult_1.default.insertMany(competitionResultsData);
        console.log(`Created ${createdCompetitionResults.length} competition results`);
        // Seed payment history
        console.log('Seeding payment history...');
        const paymentData = [];
        for (let i = 0; i < Math.min(allUsers.length, 5); i++) {
            const payment = payments[i % payments.length];
            paymentData.push({
                userId: allUsers[i]._id,
                amount: payment.amount,
                currency: payment.currency,
                coins: payment.coins,
                paymentMethod: payment.paymentMethod,
                paymentStatus: payment.paymentStatus,
                transactionId: `txn_${Date.now()}_${i}`,
                paymentProvider: 'vnpay'
            });
        }
        const createdPayments = await Payment_1.default.insertMany(paymentData);
        console.log(`Created ${createdPayments.length} payments`);
        // Seed more reports
        console.log('Seeding additional reports...');
        const additionalReports = [
            {
                type: 'proficiency',
                targetId: 'prof1',
                category: 'Câu hỏi khó',
                description: 'Câu hỏi quá khó so với trình độ',
                status: 'pending'
            },
            {
                type: 'vocabulary',
                targetId: 'vocab3',
                category: 'Phát âm sai',
                description: 'Phát âm không chính xác',
                status: 'approved'
            },
            {
                type: 'test',
                targetId: 'test2',
                category: 'Thời gian không đủ',
                description: 'Thời gian làm bài quá ít',
                status: 'rejected'
            }
        ];
        const reportData = additionalReports.map(report => ({
            ...report,
            userId: allUsers[Math.floor(Math.random() * allUsers.length)]._id
        }));
        const createdAdditionalReports = await Report_1.default.insertMany(reportData);
        console.log(`Created ${createdAdditionalReports.length} additional reports`);
        console.log('✅ Advanced data seeded successfully!');
        console.log(`📊 Advanced Summary:`);
        console.log(`   - Advanced Vocabularies: ${createdAdvancedVocabularies.length}`);
        console.log(`   - Additional Users: ${createdAdditionalUsers.length}`);
        console.log(`   - Advanced Tests: ${createdAdvancedTests.length}`);
        console.log(`   - Competition Results: ${createdCompetitionResults.length}`);
        console.log(`   - Payments: ${createdPayments.length}`);
        console.log(`   - Additional Reports: ${createdAdditionalReports.length}`);
    }
    catch (error) {
        console.error('❌ Error seeding advanced data:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('Database connection closed');
    }
}
// Run the advanced seed function
seedAdvancedData();
