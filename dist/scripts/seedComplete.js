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
const Level_1 = __importDefault(require("../models/Level"));
const Test_1 = __importDefault(require("../models/Test"));
const ProficiencyTest_1 = __importDefault(require("../models/ProficiencyTest"));
const Competition_1 = __importDefault(require("../models/Competition"));
const Report_1 = __importDefault(require("../models/Report"));
const CompetitionResult_1 = __importDefault(require("../models/CompetitionResult"));
const Payment_1 = __importDefault(require("../models/Payment"));
const UserVocabulary_1 = require("../models/UserVocabulary");
const QuestionType_1 = __importDefault(require("../models/QuestionType"));
dotenv_1.default.config();
// Comprehensive data for complete system testing
const completeTopics = [
    { name: 'Gia đình', description: 'Từ vựng về gia đình và mối quan hệ', color: '#FF6B6B' },
    { name: 'Màu sắc', description: 'Từ vựng về màu sắc và sắc thái', color: '#4ECDC4' },
    { name: 'Thức ăn', description: 'Từ vựng về thức ăn và đồ uống', color: '#45B7D1' },
    { name: 'Thời tiết', description: 'Từ vựng về thời tiết và khí hậu', color: '#96CEB4' },
    { name: 'Động vật', description: 'Từ vựng về động vật và thú cưng', color: '#FFEAA7' },
    { name: 'Công việc', description: 'Từ vựng về nghề nghiệp và công việc', color: '#DDA0DD' },
    { name: 'Trường học', description: 'Từ vựng về giáo dục và học tập', color: '#98D8C8' },
    { name: 'Du lịch', description: 'Từ vựng về du lịch và giao thông', color: '#F7DC6F' },
    { name: 'Thể thao', description: 'Từ vựng về thể thao và vận động', color: '#BB8FCE' },
    { name: 'Âm nhạc', description: 'Từ vựng về âm nhạc và nghệ thuật', color: '#85C1E9' }
];
const completeLevels = [
    { name: 'Mới bắt đầu', number: 1, description: 'Cấp độ dành cho người mới học tiếng Trung', requiredExperience: 0, color: '#FF6B6B' },
    { name: 'Cơ bản', number: 2, description: 'Cấp độ cơ bản với từ vựng đơn giản', requiredExperience: 100, color: '#4ECDC4' },
    { name: 'Trung cấp', number: 3, description: 'Cấp độ trung cấp với cấu trúc phức tạp hơn', requiredExperience: 300, color: '#45B7D1' },
    { name: 'Nâng cao', number: 4, description: 'Cấp độ nâng cao với từ vựng chuyên môn', requiredExperience: 600, color: '#96CEB4' },
    { name: 'Thành thạo', number: 5, description: 'Cấp độ thành thạo với khả năng giao tiếp tốt', requiredExperience: 1000, color: '#FFEAA7' },
    { name: 'Chuyên gia', number: 6, description: 'Cấp độ chuyên gia với hiểu biết sâu sắc', requiredExperience: 1500, color: '#DDA0DD' }
];
const completeVocabularies = [
    // Level 1 - Basic
    { word: '你好', pronunciation: 'nǐhǎo', meaning: 'xin chào', level: 1, topics: ['Gia đình'], partOfSpeech: 'interjection', synonyms: [], antonyms: ['再见'], examples: ['你好，我是小明', '你好吗？'] },
    { word: '谢谢', pronunciation: 'xièxie', meaning: 'cảm ơn', level: 1, topics: ['Gia đình'], partOfSpeech: 'verb', synonyms: [], antonyms: [], examples: ['谢谢你的帮助', '不客气'] },
    { word: '再见', pronunciation: 'zàijiàn', meaning: 'tạm biệt', level: 1, topics: ['Gia đình'], partOfSpeech: 'interjection', synonyms: [], antonyms: ['你好'], examples: ['再见，明天见', '再见，保重'] },
    { word: '对不起', pronunciation: 'duìbùqǐ', meaning: 'xin lỗi', level: 1, topics: ['Gia đình'], partOfSpeech: 'interjection', synonyms: [], antonyms: [], examples: ['对不起，我迟到了', '没关系'] },
    { word: '没关系', pronunciation: 'méiguānxi', meaning: 'không sao', level: 1, topics: ['Gia đình'], partOfSpeech: 'phrase', synonyms: [], antonyms: [], examples: ['没关系，不要紧', '没关系，我理解'] },
    // Level 2 - Elementary
    { word: '学习', pronunciation: 'xuéxí', meaning: 'học tập', level: 2, topics: ['Trường học'], partOfSpeech: 'verb', synonyms: ['读书'], antonyms: ['玩耍'], examples: ['我在学习中文', '学习很重要'] },
    { word: '工作', pronunciation: 'gōngzuò', meaning: 'làm việc', level: 2, topics: ['Công việc'], partOfSpeech: 'verb', synonyms: ['上班'], antonyms: ['休息'], examples: ['我在工作', '工作很忙'] },
    { word: '睡觉', pronunciation: 'shuìjiào', meaning: 'ngủ', level: 2, topics: ['Gia đình'], partOfSpeech: 'verb', synonyms: ['休息'], antonyms: ['起床'], examples: ['我要睡觉', '睡觉很舒服'] },
    { word: '吃饭', pronunciation: 'chīfàn', meaning: 'ăn cơm', level: 2, topics: ['Thức ăn'], partOfSpeech: 'verb', synonyms: ['用餐'], antonyms: ['禁食'], examples: ['我要吃饭', '吃饭时间到了'] },
    { word: '喝水', pronunciation: 'hēshuǐ', meaning: 'uống nước', level: 2, topics: ['Thức ăn'], partOfSpeech: 'verb', synonyms: ['饮水'], antonyms: [], examples: ['我要喝水', '喝水很健康'] },
    // Level 3 - Intermediate
    { word: '医院', pronunciation: 'yīyuàn', meaning: 'bệnh viện', level: 3, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去医院', '医院很大'] },
    { word: '银行', pronunciation: 'yínháng', meaning: 'ngân hàng', level: 3, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去银行', '银行很安全'] },
    { word: '超市', pronunciation: 'chāoshì', meaning: 'siêu thị', level: 3, topics: ['Thức ăn'], partOfSpeech: 'noun', synonyms: ['商场'], antonyms: [], examples: ['我去超市', '超市很大'] },
    { word: '公园', pronunciation: 'gōngyuán', meaning: 'công viên', level: 3, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去公园', '公园很漂亮'] },
    { word: '机场', pronunciation: 'jīchǎng', meaning: 'sân bay', level: 3, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我去机场', '机场很大'] },
    // Level 4 - Advanced
    { word: '经济', pronunciation: 'jīngjì', meaning: 'kinh tế', level: 4, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['经济发展', '经济很重要'] },
    { word: '文化', pronunciation: 'wénhuà', meaning: 'văn hóa', level: 4, topics: ['Âm nhạc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['中国文化', '文化很丰富'] },
    { word: '历史', pronunciation: 'lìshǐ', meaning: 'lịch sử', level: 4, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['中国历史', '历史很悠久'] },
    { word: '艺术', pronunciation: 'yìshù', meaning: 'nghệ thuật', level: 4, topics: ['Âm nhạc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['艺术很美', '我喜欢艺术'] },
    { word: '科技', pronunciation: 'kējì', meaning: 'khoa học công nghệ', level: 4, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['科技发展', '科技很重要'] },
    // Level 5 - Proficient
    { word: '环境', pronunciation: 'huánjìng', meaning: 'môi trường', level: 5, topics: ['Thời tiết'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['环境保护', '环境很重要'] },
    { word: '社会', pronunciation: 'shèhuì', meaning: 'xã hội', level: 5, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['社会发展', '社会很复杂'] },
    { word: '政治', pronunciation: 'zhèngzhì', meaning: 'chính trị', level: 5, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['政治制度', '政治很重要'] },
    { word: '教育', pronunciation: 'jiàoyù', meaning: 'giáo dục', level: 5, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['教育很重要', '教育制度'] },
    { word: '健康', pronunciation: 'jiànkāng', meaning: 'sức khỏe', level: 5, topics: ['Thể thao'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['健康很重要', '保持健康'] },
    // Level 6 - Expert
    { word: '哲学', pronunciation: 'zhéxué', meaning: 'triết học', level: 6, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['哲学思考', '哲学很深奥'] },
    { word: '心理学', pronunciation: 'xīnlǐxué', meaning: 'tâm lý học', level: 6, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['心理学研究', '心理学很有趣'] },
    { word: '社会学', pronunciation: 'shèhuìxué', meaning: 'xã hội học', level: 6, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['社会学研究', '社会学很重要'] },
    { word: '人类学', pronunciation: 'rénlèixué', meaning: 'nhân loại học', level: 6, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['人类学研究', '人类学很广泛'] },
    { word: '考古学', pronunciation: 'kǎogǔxué', meaning: 'khảo cổ học', level: 6, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['考古学发现', '考古学很神秘'] }
];
const completeUsers = [
    // Level 1 users
    { name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', password: '123456', level: 1, experience: 50, coins: 100, streak: 3 },
    { name: 'Trần Thị Bình', email: 'binh.tran@example.com', password: '123456', level: 1, experience: 80, coins: 120, streak: 5 },
    { name: 'Lê Văn Cường', email: 'cuong.le@example.com', password: '123456', level: 1, experience: 30, coins: 80, streak: 1 },
    // Level 2 users
    { name: 'Phạm Thị Dung', email: 'dung.pham@example.com', password: '123456', level: 2, experience: 250, coins: 200, streak: 7 },
    { name: 'Hoàng Văn Em', email: 'em.hoang@example.com', password: '123456', level: 2, experience: 180, coins: 150, streak: 4 },
    { name: 'Vũ Thị Phương', email: 'phuong.vu@example.com', password: '123456', level: 2, experience: 120, coins: 100, streak: 2 },
    // Level 3 users
    { name: 'Đặng Văn Giang', email: 'giang.dang@example.com', password: '123456', level: 3, experience: 500, coins: 300, streak: 15 },
    { name: 'Bùi Thị Hoa', email: 'hoa.bui@example.com', password: '123456', level: 3, experience: 400, coins: 250, streak: 12 },
    { name: 'Ngô Văn Ích', email: 'ich.ngo@example.com', password: '123456', level: 3, experience: 350, coins: 200, streak: 8 },
    // Level 4 users
    { name: 'Đỗ Thị Kim', email: 'kim.do@example.com', password: '123456', level: 4, experience: 800, coins: 500, streak: 20 },
    { name: 'Lý Văn Minh', email: 'minh.ly@example.com', password: '123456', level: 4, experience: 700, coins: 400, streak: 18 },
    { name: 'Phan Thị Lan', email: 'lan.phan@example.com', password: '123456', level: 4, experience: 600, coins: 350, streak: 14 },
    // Level 5 users
    { name: 'Võ Văn Hùng', email: 'hung.vo@example.com', password: '123456', level: 5, experience: 1200, coins: 600, streak: 25 },
    { name: 'Đinh Thị Mai', email: 'mai.dinh@example.com', password: '123456', level: 5, experience: 1000, coins: 500, streak: 22 },
    { name: 'Lương Văn Tài', email: 'tai.luong@example.com', password: '123456', level: 5, experience: 900, coins: 450, streak: 20 },
    // Level 6 users
    { name: 'Trịnh Thị Hương', email: 'huong.trinh@example.com', password: '123456', level: 6, experience: 2000, coins: 1000, streak: 30 },
    { name: 'Ngô Văn Đức', email: 'duc.ngo@example.com', password: '123456', level: 6, experience: 1800, coins: 900, streak: 28 },
    { name: 'Lê Thị Thu', email: 'thu.le@example.com', password: '123456', level: 6, experience: 1600, coins: 800, streak: 25 },
    { name: 'Hoàng Văn Nam', email: 'nam.hoang@example.com', password: '123456', level: 6, experience: 1500, coins: 750, streak: 24 },
    { name: 'Bùi Thị Linh', email: 'linh.bui@example.com', password: '123456', level: 6, experience: 1400, coins: 700, streak: 22 }
];
const completeTests = [
    {
        title: 'Bài test từ vựng cơ bản',
        description: 'Kiểm tra từ vựng cơ bản nhất',
        level: 1,
        questions: [
            {
                question: 'Từ "你好" có nghĩa là gì?',
                options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
                correctAnswer: 0,
                explanation: '"你好" có nghĩa là "xin chào".'
            },
            {
                question: 'Từ "谢谢" có nghĩa là gì?',
                options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
                correctAnswer: 2,
                explanation: '"谢谢" có nghĩa là "cảm ơn".'
            }
        ],
        timeLimit: 10,
        requiredCoins: 5,
        rewardExperience: 20,
        rewardCoins: 10
    },
    {
        title: 'Bài test động từ cơ bản',
        description: 'Kiểm tra động từ cơ bản',
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
            }
        ],
        timeLimit: 25,
        requiredCoins: 20,
        rewardExperience: 50,
        rewardCoins: 25
    },
    {
        title: 'Bài test từ vựng chuyên môn',
        description: 'Kiểm tra từ vựng chuyên môn',
        level: 5,
        questions: [
            {
                question: 'Từ "环境" có nghĩa là gì?',
                options: ['Môi trường', 'Xã hội', 'Chính trị', 'Giáo dục'],
                correctAnswer: 0,
                explanation: '"环境" có nghĩa là "môi trường".'
            },
            {
                question: 'Từ "社会" có nghĩa là gì?',
                options: ['Môi trường', 'Xã hội', 'Chính trị', 'Giáo dục'],
                correctAnswer: 1,
                explanation: '"社会" có nghĩa là "xã hội".'
            }
        ],
        timeLimit: 30,
        requiredCoins: 25,
        rewardExperience: 60,
        rewardCoins: 30
    },
    {
        title: 'Bài test từ vựng chuyên gia',
        description: 'Kiểm tra từ vựng cấp độ chuyên gia',
        level: 6,
        questions: [
            {
                question: 'Từ "哲学" có nghĩa là gì?',
                options: ['Triết học', 'Tâm lý học', 'Xã hội học', 'Nhân loại học'],
                correctAnswer: 0,
                explanation: '"哲学" có nghĩa là "triết học".'
            },
            {
                question: 'Từ "心理学" có nghĩa là gì?',
                options: ['Triết học', 'Tâm lý học', 'Xã hội học', 'Nhân loại học'],
                correctAnswer: 1,
                explanation: '"心理学" có nghĩa là "tâm lý học".'
            }
        ],
        timeLimit: 35,
        requiredCoins: 30,
        rewardExperience: 70,
        rewardCoins: 35
    }
];
const completeProficiencyTests = [
    {
        level: 'A',
        questions: [
            {
                question: 'Từ "你好" có nghĩa là gì?',
                options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
                correctAnswer: 0,
                explanation: '"你好" có nghĩa là "xin chào".'
            },
            {
                question: 'Từ "谢谢" có nghĩa là gì?',
                options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
                correctAnswer: 2,
                explanation: '"谢谢" có nghĩa là "cảm ơn".'
            },
            {
                question: 'Từ "再见" có nghĩa là gì?',
                options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
                correctAnswer: 1,
                explanation: '"再见" có nghĩa là "tạm biệt".'
            }
        ],
        timeLimit: 15,
        requiredCoins: 10,
        rewardExperience: 50,
        rewardCoins: 25
    },
    {
        level: 'B',
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
        timeLimit: 20,
        requiredCoins: 15,
        rewardExperience: 75,
        rewardCoins: 35
    },
    {
        level: 'C',
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
        rewardExperience: 100,
        rewardCoins: 50
    }
];
const completeCompetitions = [
    {
        title: 'Cuộc thi từ vựng cơ bản',
        description: 'Thi đấu từ vựng cơ bản cho người mới bắt đầu',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        cost: 10,
        reward: { xp: 100, coins: 50 },
        level: 'Beginner',
        maxParticipants: 50,
        rules: ['Thời gian: 30 phút', 'Không được tra cứu', 'Trả lời đúng nhiều nhất sẽ thắng'],
        prizes: {
            first: { xp: 200, coins: 100 },
            second: { xp: 150, coins: 75 },
            third: { xp: 100, coins: 50 }
        }
    },
    {
        title: 'Cuộc thi từ vựng trung cấp',
        description: 'Thi đấu từ vựng trung cấp cho người có kinh nghiệm',
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // Next week + 2 days
        cost: 20,
        reward: { xp: 200, coins: 100 },
        level: 'Intermediate',
        maxParticipants: 30,
        rules: ['Thời gian: 45 phút', 'Không được tra cứu', 'Trả lời đúng nhiều nhất sẽ thắng'],
        prizes: {
            first: { xp: 400, coins: 200 },
            second: { xp: 300, coins: 150 },
            third: { xp: 200, coins: 100 }
        }
    },
    {
        title: 'Cuộc thi từ vựng nâng cao',
        description: 'Thi đấu từ vựng nâng cao cho người thành thạo',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Next week + 3 days
        cost: 30,
        reward: { xp: 300, coins: 150 },
        level: 'Advanced',
        maxParticipants: 20,
        rules: ['Thời gian: 60 phút', 'Không được tra cứu', 'Trả lời đúng nhiều nhất sẽ thắng'],
        prizes: {
            first: { xp: 600, coins: 300 },
            second: { xp: 450, coins: 225 },
            third: { xp: 300, coins: 150 }
        }
    }
];
async function seedCompleteData() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
        await mongoose_1.default.connect(uri);
        console.log('Connected to MongoDB');
        // Clear existing data
        console.log('Clearing existing data...');
        await User_1.default.deleteMany({});
        await Vocabulary_1.default.deleteMany({});
        await Topic_1.default.deleteMany({});
        await Level_1.default.deleteMany({});
        await Test_1.default.deleteMany({});
        await ProficiencyTest_1.default.deleteMany({});
        await Competition_1.default.deleteMany({});
        await Report_1.default.deleteMany({});
        await CompetitionResult_1.default.deleteMany({});
        await Payment_1.default.deleteMany({});
        await UserVocabulary_1.UserVocabulary.deleteMany({});
        await QuestionType_1.default.deleteMany({});
        // Seed Topics
        console.log('Seeding topics...');
        const createdTopics = await Topic_1.default.insertMany(completeTopics);
        console.log(`Created ${createdTopics.length} topics`);
        // Seed Levels
        console.log('Seeding levels...');
        const createdLevels = await Level_1.default.insertMany(completeLevels);
        console.log(`Created ${createdLevels.length} levels`);
        // Seed Users
        console.log('Seeding users...');
        const createdUsers = await User_1.default.insertMany(completeUsers);
        console.log(`Created ${createdUsers.length} users`);
        // Seed Vocabularies
        console.log('Seeding vocabularies...');
        const createdVocabularies = await Vocabulary_1.default.insertMany(completeVocabularies);
        console.log(`Created ${createdVocabularies.length} vocabularies`);
        // Seed Tests
        console.log('Seeding tests...');
        const createdTests = await Test_1.default.insertMany(completeTests);
        console.log(`Created ${createdTests.length} tests`);
        // Seed Proficiency Tests
        console.log('Seeding proficiency tests...');
        const createdProficiencyTests = await ProficiencyTest_1.default.insertMany(completeProficiencyTests);
        console.log(`Created ${createdProficiencyTests.length} proficiency tests`);
        // Seed Competitions
        console.log('Seeding competitions...');
        const createdCompetitions = await Competition_1.default.insertMany(completeCompetitions);
        console.log(`Created ${createdCompetitions.length} competitions`);
        // Seed Competition Results
        console.log('Seeding competition results...');
        const competitionResultsData = [];
        for (let i = 0; i < createdCompetitions.length; i++) {
            const competition = createdCompetitions[i];
            const participants = createdUsers.sort(() => 0.5 - Math.random()).slice(0, 10);
            for (let j = 0; j < participants.length; j++) {
                const score = Math.floor(Math.random() * 40) + 60; // 60-100
                const timeSpent = Math.floor(Math.random() * 1200) + 600; // 10-30 minutes
                competitionResultsData.push({
                    competitionId: competition._id,
                    userId: participants[j]._id,
                    score,
                    timeSpent,
                    rank: j + 1,
                    rewards: {
                        xp: Math.floor(score / 10) * 10,
                        coins: Math.floor(score / 20) * 5
                    },
                    answers: [
                        { questionId: 'q1', userAnswer: Math.floor(Math.random() * 4), isCorrect: Math.random() > 0.3, timeSpent: 30 },
                        { questionId: 'q2', userAnswer: Math.floor(Math.random() * 4), isCorrect: Math.random() > 0.3, timeSpent: 25 },
                        { questionId: 'q3', userAnswer: Math.floor(Math.random() * 4), isCorrect: Math.random() > 0.3, timeSpent: 35 }
                    ]
                });
            }
        }
        const createdCompetitionResults = await CompetitionResult_1.default.insertMany(competitionResultsData);
        console.log(`Created ${createdCompetitionResults.length} competition results`);
        // Seed Reports
        console.log('Seeding reports...');
        const reportData = [
            {
                type: 'vocabulary',
                targetId: 'vocab1',
                category: 'Lỗi chính tả',
                description: 'Từ vựng có lỗi chính tả trong phần phát âm',
                status: 'pending'
            },
            {
                type: 'test',
                targetId: 'test1',
                category: 'Câu hỏi sai',
                description: 'Câu hỏi có đáp án không chính xác',
                status: 'pending'
            },
            {
                type: 'vocabulary',
                targetId: 'vocab2',
                category: 'Nghĩa không đúng',
                description: 'Nghĩa của từ không chính xác',
                status: 'approved'
            },
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
        ].map(report => ({
            ...report,
            userId: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id
        }));
        const createdReports = await Report_1.default.insertMany(reportData);
        console.log(`Created ${createdReports.length} reports`);
        // Seed Payment History
        console.log('Seeding payment history...');
        const paymentData = [];
        for (let i = 0; i < Math.min(createdUsers.length, 10); i++) {
            const amounts = [50000, 100000, 200000, 300000, 500000];
            const amount = amounts[Math.floor(Math.random() * amounts.length)];
            const coins = Math.floor(amount / 1000);
            paymentData.push({
                userId: createdUsers[i]._id,
                amount,
                currency: 'VND',
                coins,
                paymentMethod: ['credit_card', 'bank_transfer', 'wallet'][Math.floor(Math.random() * 3)],
                paymentStatus: 'completed',
                transactionId: `txn_${Date.now()}_${i}`,
                paymentProvider: 'vnpay'
            });
        }
        const createdPayments = await Payment_1.default.insertMany(paymentData);
        console.log(`Created ${createdPayments.length} payments`);
        // Seed Question Types
        console.log('Seeding question types...');
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
                description: 'Đọc đoạn văn và trảlời câu hỏi',
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
        const createdQuestionTypes = await QuestionType_1.default.insertMany(questionTypes);
        console.log(`Created ${createdQuestionTypes.length} question types`);
        // Seed User Vocabulary (sample learning progress)
        console.log('Seeding user vocabulary progress...');
        const userVocabularyData = [];
        for (let i = 0; i < Math.min(createdUsers.length, 5); i++) {
            const user = createdUsers[i];
            const userVocabularies = createdVocabularies.slice(0, Math.floor(Math.random() * 10) + 5);
            for (const vocabulary of userVocabularies) {
                const statuses = ['learning', 'known', 'needs-study', 'skipped'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                userVocabularyData.push({
                    userId: user._id,
                    vocabularyId: vocabulary._id,
                    status,
                    studyCount: Math.floor(Math.random() * 5),
                    isCustom: Math.random() > 0.8,
                    customTopic: Math.random() > 0.8 ? 'Tùy chỉnh' : undefined
                });
            }
        }
        const createdUserVocabularies = await UserVocabulary_1.UserVocabulary.insertMany(userVocabularyData);
        console.log(`Created ${createdUserVocabularies.length} user vocabulary records`);
        // Create admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
        const adminName = process.env.ADMIN_NAME || 'Administrator';
        const admin = new User_1.default({
            email: adminEmail,
            password: adminPassword,
            name: adminName,
            role: 'admin',
            level: 6,
            experience: 3000,
            coins: 2000,
            streak: 50
        });
        await admin.save();
        console.log(`Created admin user: ${adminEmail}`);
        console.log('✅ Complete database seeded successfully!');
        console.log(`📊 Complete Summary:`);
        console.log(`   - Topics: ${createdTopics.length}`);
        console.log(`   - Levels: ${createdLevels.length}`);
        console.log(`   - Users: ${createdUsers.length + 1} (including admin)`);
        console.log(`   - Vocabularies: ${createdVocabularies.length}`);
        console.log(`   - Tests: ${createdTests.length}`);
        console.log(`   - Proficiency Tests: ${createdProficiencyTests.length}`);
        console.log(`   - Competitions: ${createdCompetitions.length}`);
        console.log(`   - Competition Results: ${createdCompetitionResults.length}`);
        console.log(`   - Reports: ${createdReports.length}`);
        console.log(`   - Payments: ${createdPayments.length}`);
        console.log(`   - Question Types: ${createdQuestionTypes.length}`);
        console.log(`   - User Vocabulary: ${createdUserVocabularies.length}`);
        console.log('\n🎯 System is now fully populated with realistic data!');
        console.log('🔗 Admin Login: admin@example.com / Admin@123456');
        console.log('👥 Test Users: Various levels from 1-6 with different progress');
        console.log('📚 Content: Comprehensive vocabulary, tests, and competitions');
        console.log('🏆 Analytics: Real data for dashboard and reporting');
    }
    catch (error) {
        console.error('❌ Error seeding complete database:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('Database connection closed');
    }
}
// Run the complete seed function
seedCompleteData();
//# sourceMappingURL=seedComplete.js.map