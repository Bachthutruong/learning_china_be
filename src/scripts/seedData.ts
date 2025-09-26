import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import Vocabulary from '../models/Vocabulary';
import Topic from '../models/Topic';
import Level from '../models/Level';
import Test from '../models/Test';
import ProficiencyTest from '../models/ProficiencyTest';
import Competition from '../models/Competition';
import Report from '../models/Report';

dotenv.config();

// Sample data
const topics = [
  { name: 'Gia đình', description: 'Từ vựng về gia đình', color: '#FF6B6B' },
  { name: 'Màu sắc', description: 'Từ vựng về màu sắc', color: '#4ECDC4' },
  { name: 'Thức ăn', description: 'Từ vựng về thức ăn', color: '#45B7D1' },
  { name: 'Thời tiết', description: 'Từ vựng về thời tiết', color: '#96CEB4' },
  { name: 'Động vật', description: 'Từ vựng về động vật', color: '#FFEAA7' },
  { name: 'Công việc', description: 'Từ vựng về công việc', color: '#DDA0DD' },
  { name: 'Trường học', description: 'Từ vựng về trường học', color: '#98D8C8' },
  { name: 'Du lịch', description: 'Từ vựng về du lịch', color: '#F7DC6F' }
];

const levels = [
  { name: 'Mới bắt đầu', number: 1, description: 'Cấp độ dành cho người mới học', requiredExperience: 0, color: '#FF6B6B' },
  { name: 'Cơ bản', number: 2, description: 'Cấp độ cơ bản', requiredExperience: 100, color: '#4ECDC4' },
  { name: 'Trung cấp', number: 3, description: 'Cấp độ trung cấp', requiredExperience: 300, color: '#45B7D1' },
  { name: 'Nâng cao', number: 4, description: 'Cấp độ nâng cao', requiredExperience: 600, color: '#96CEB4' },
  { name: 'Thành thạo', number: 5, description: 'Cấp độ thành thạo', requiredExperience: 1000, color: '#FFEAA7' },
  { name: 'Chuyên gia', number: 6, description: 'Cấp độ chuyên gia', requiredExperience: 1500, color: '#DDA0DD' }
];

const vocabularies = [
  // Gia đình
  { word: '爸爸', pronunciation: 'bàba', meaning: 'bố', level: 1, topics: ['Gia đình'], partOfSpeech: 'noun', synonyms: ['父亲'], antonyms: [], examples: ['我的爸爸很忙', '爸爸在上班'] },
  { word: '妈妈', pronunciation: 'māma', meaning: 'mẹ', level: 1, topics: ['Gia đình'], partOfSpeech: 'noun', synonyms: ['母亲'], antonyms: [], examples: ['妈妈在做饭', '我爱妈妈'] },
  { word: '哥哥', pronunciation: 'gēge', meaning: 'anh trai', level: 1, topics: ['Gia đình'], partOfSpeech: 'noun', synonyms: [], antonyms: ['弟弟'], examples: ['我有一个哥哥', '哥哥很聪明'] },
  { word: '姐姐', pronunciation: 'jiějie', meaning: 'chị gái', level: 1, topics: ['Gia đình'], partOfSpeech: 'noun', synonyms: [], antonyms: ['妹妹'], examples: ['姐姐很漂亮', '姐姐在读书'] },
  { word: '弟弟', pronunciation: 'dìdi', meaning: 'em trai', level: 1, topics: ['Gia đình'], partOfSpeech: 'noun', synonyms: [], antonyms: ['哥哥'], examples: ['弟弟在玩', '弟弟很可爱'] },
  { word: '妹妹', pronunciation: 'mèimei', meaning: 'em gái', level: 1, topics: ['Gia đình'], partOfSpeech: 'noun', synonyms: [], antonyms: ['姐姐'], examples: ['妹妹很可爱', '妹妹在睡觉'] },
  { word: '爷爷', pronunciation: 'yéye', meaning: 'ông nội', level: 1, topics: ['Gia đình'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['爷爷在看书', '爷爷很健康'] },
  { word: '奶奶', pronunciation: 'nǎinai', meaning: 'bà nội', level: 1, topics: ['Gia đình'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['奶奶在做饭', '奶奶很慈祥'] },
  
  // Màu sắc
  { word: '红色', pronunciation: 'hóngsè', meaning: 'màu đỏ', level: 1, topics: ['Màu sắc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我喜欢红色', '红色的花很漂亮'] },
  { word: '蓝色', pronunciation: 'lánsè', meaning: 'màu xanh dương', level: 1, topics: ['Màu sắc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['天空是蓝色的', '蓝色的衣服'] },
  { word: '绿色', pronunciation: 'lǜsè', meaning: 'màu xanh lá', level: 1, topics: ['Màu sắc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['草是绿色的', '绿色的树'] },
  { word: '黄色', pronunciation: 'huángsè', meaning: 'màu vàng', level: 1, topics: ['Màu sắc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['太阳是黄色的', '黄色的香蕉'] },
  { word: '黑色', pronunciation: 'hēisè', meaning: 'màu đen', level: 1, topics: ['Màu sắc'], partOfSpeech: 'noun', synonyms: [], antonyms: ['白色'], examples: ['头发是黑色的', '黑色的车'] },
  { word: '白色', pronunciation: 'báisè', meaning: 'màu trắng', level: 1, topics: ['Màu sắc'], partOfSpeech: 'noun', synonyms: [], antonyms: ['黑色'], examples: ['雪是白色的', '白色的云'] },
  
  // Thức ăn
  { word: '米饭', pronunciation: 'mǐfàn', meaning: 'cơm', level: 1, topics: ['Thức ăn'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我吃米饭', '米饭很香'] },
  { word: '面条', pronunciation: 'miàntiáo', meaning: 'mì', level: 1, topics: ['Thức ăn'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['我喜欢吃面条', '面条很好吃'] },
  { word: '包子', pronunciation: 'bāozi', meaning: 'bánh bao', level: 1, topics: ['Thức ăn'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['包子很好吃', '我买包子'] },
  { word: '饺子', pronunciation: 'jiǎozi', meaning: 'bánh chẻo', level: 1, topics: ['Thức ăn'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['饺子是传统食物', '我喜欢吃饺子'] },
  { word: '汤', pronunciation: 'tāng', meaning: 'canh', level: 1, topics: ['Thức ăn'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['汤很热', '我喝汤'] },
  { word: '菜', pronunciation: 'cài', meaning: 'rau', level: 1, topics: ['Thức ăn'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['菜很新鲜', '我吃菜'] },
  
  // Động vật
  { word: '猫', pronunciation: 'māo', meaning: 'mèo', level: 2, topics: ['Động vật'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['猫很可爱', '我有一只猫'] },
  { word: '狗', pronunciation: 'gǒu', meaning: 'chó', level: 2, topics: ['Động vật'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['狗很忠诚', '我有一只狗'] },
  { word: '鸟', pronunciation: 'niǎo', meaning: 'chim', level: 2, topics: ['Động vật'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['鸟会飞', '我听到鸟叫'] },
  { word: '鱼', pronunciation: 'yú', meaning: 'cá', level: 2, topics: ['Động vật'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['鱼在水里游泳', '我吃鱼'] },
  
  // Công việc
  { word: '老师', pronunciation: 'lǎoshī', meaning: 'giáo viên', level: 2, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['老师很严格', '我是老师'] },
  { word: '医生', pronunciation: 'yīshēng', meaning: 'bác sĩ', level: 2, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['医生很忙', '我去看医生'] },
  { word: '学生', pronunciation: 'xuésheng', meaning: 'học sinh', level: 2, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['学生很聪明', '我是学生'] },
  { word: '工人', pronunciation: 'gōngrén', meaning: 'công nhân', level: 2, topics: ['Công việc'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['工人很辛苦', '工人建房子'] },
  
  // Trường học
  { word: '学校', pronunciation: 'xuéxiào', meaning: 'trường học', level: 2, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['学校很大', '我去学校'] },
  { word: '教室', pronunciation: 'jiàoshì', meaning: 'lớp học', level: 2, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['教室很安静', '我在教室里'] },
  { word: '图书馆', pronunciation: 'túshūguǎn', meaning: 'thư viện', level: 2, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['图书馆很安静', '我去图书馆看书'] },
  { word: '操场', pronunciation: 'cāochǎng', meaning: 'sân vận động', level: 2, topics: ['Trường học'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['操场很大', '我在操场跑步'] },
  
  // Du lịch
  { word: '旅游', pronunciation: 'lǚyóu', meaning: 'du lịch', level: 3, topics: ['Du lịch'], partOfSpeech: 'verb', synonyms: [], antonyms: [], examples: ['我喜欢旅游', '我去旅游'] },
  { word: '酒店', pronunciation: 'jiǔdiàn', meaning: 'khách sạn', level: 3, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['酒店很舒服', '我住酒店'] },
  { word: '飞机', pronunciation: 'fēijī', meaning: 'máy bay', level: 3, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['飞机很快', '我坐飞机'] },
  { word: '火车', pronunciation: 'huǒchē', meaning: 'tàu hỏa', level: 3, topics: ['Du lịch'], partOfSpeech: 'noun', synonyms: [], antonyms: [], examples: ['火车很安全', '我坐火车'] }
];

const users = [
  { name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', password: '123456', level: 1, experience: 50, coins: 100, streak: 3 },
  { name: 'Trần Thị Bình', email: 'binh.tran@example.com', password: '123456', level: 2, experience: 250, coins: 200, streak: 7 },
  { name: 'Lê Văn Cường', email: 'cuong.le@example.com', password: '123456', level: 1, experience: 80, coins: 150, streak: 1 },
  { name: 'Phạm Thị Dung', email: 'dung.pham@example.com', password: '123456', level: 3, experience: 500, coins: 300, streak: 15 },
  { name: 'Hoàng Văn Em', email: 'em.hoang@example.com', password: '123456', level: 2, experience: 180, coins: 120, streak: 5 },
  { name: 'Vũ Thị Phương', email: 'phuong.vu@example.com', password: '123456', level: 1, experience: 30, coins: 80, streak: 0 },
  { name: 'Đặng Văn Giang', email: 'giang.dang@example.com', password: '123456', level: 4, experience: 800, coins: 500, streak: 20 },
  { name: 'Bùi Thị Hoa', email: 'hoa.bui@example.com', password: '123456', level: 2, experience: 200, coins: 180, streak: 8 },
  { name: 'Ngô Văn Ích', email: 'ich.ngo@example.com', password: '123456', level: 1, experience: 60, coins: 90, streak: 2 },
  { name: 'Đỗ Thị Kim', email: 'kim.do@example.com', password: '123456', level: 3, experience: 450, coins: 280, streak: 12 }
];

const tests = [
  {
    title: 'Bài test từ vựng gia đình',
    description: 'Kiểm tra từ vựng về gia đình',
    level: 1,
    questions: [
      {
        question: 'Từ "爸爸" có nghĩa là gì?',
        options: ['Bố', 'Mẹ', 'Anh trai', 'Em gái'],
        correctAnswer: 0,
        explanation: '"爸爸" có nghĩa là "bố" trong tiếng Việt.'
      },
      {
        question: 'Từ "妈妈" có nghĩa là gì?',
        options: ['Bố', 'Mẹ', 'Anh trai', 'Em gái'],
        correctAnswer: 1,
        explanation: '"妈妈" có nghĩa là "mẹ" trong tiếng Việt.'
      }
    ],
    timeLimit: 10,
    requiredCoins: 5,
    rewardExperience: 20,
    rewardCoins: 10
  },
  {
    title: 'Bài test màu sắc',
    description: 'Kiểm tra từ vựng về màu sắc',
    level: 1,
    questions: [
      {
        question: 'Từ "红色" có nghĩa là gì?',
        options: ['Màu đỏ', 'Màu xanh', 'Màu vàng', 'Màu đen'],
        correctAnswer: 0,
        explanation: '"红色" có nghĩa là "màu đỏ".'
      },
      {
        question: 'Từ "蓝色" có nghĩa là gì?',
        options: ['Màu đỏ', 'Màu xanh dương', 'Màu vàng', 'Màu đen'],
        correctAnswer: 1,
        explanation: '"蓝色" có nghĩa là "màu xanh dương".'
      }
    ],
    timeLimit: 10,
    requiredCoins: 5,
    rewardExperience: 20,
    rewardCoins: 10
  },
  {
    title: 'Bài test thức ăn',
    description: 'Kiểm tra từ vựng về thức ăn',
    level: 1,
    questions: [
      {
        question: 'Từ "米饭" có nghĩa là gì?',
        options: ['Cơm', 'Mì', 'Bánh bao', 'Canh'],
        correctAnswer: 0,
        explanation: '"米饭" có nghĩa là "cơm".'
      },
      {
        question: 'Từ "面条" có nghĩa là gì?',
        options: ['Cơm', 'Mì', 'Bánh bao', 'Canh'],
        correctAnswer: 1,
        explanation: '"面条" có nghĩa là "mì".'
      }
    ],
    timeLimit: 10,
    requiredCoins: 5,
    rewardExperience: 20,
    rewardCoins: 10
  }
];

const proficiencyTests = [
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
        question: 'Từ "学校" có nghĩa là gì?',
        options: ['Trường học', 'Bệnh viện', 'Công viên', 'Siêu thị'],
        correctAnswer: 0,
        explanation: '"学校" có nghĩa là "trường học".'
      },
      {
        question: 'Từ "医生" có nghĩa là gì?',
        options: ['Giáo viên', 'Bác sĩ', 'Kỹ sư', 'Luật sư'],
        correctAnswer: 1,
        explanation: '"医生" có nghĩa là "bác sĩ".'
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
        question: 'Từ "旅游" có nghĩa là gì?',
        options: ['Du lịch', 'Công việc', 'Học tập', 'Thể thao'],
        correctAnswer: 0,
        explanation: '"旅游" có nghĩa là "du lịch".'
      },
      {
        question: 'Từ "酒店" có nghĩa là gì?',
        options: ['Nhà hàng', 'Khách sạn', 'Bệnh viện', 'Trường học'],
        correctAnswer: 1,
        explanation: '"酒店" có nghĩa là "khách sạn".'
      }
    ],
    timeLimit: 25,
    requiredCoins: 20,
    rewardExperience: 100,
    rewardCoins: 50
  }
];

const competitions = [
  {
    title: 'Cuộc thi từ vựng gia đình',
    description: 'Thi đấu từ vựng về chủ đề gia đình',
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
    title: 'Cuộc thi màu sắc',
    description: 'Thi đấu từ vựng về màu sắc',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
    endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // Next week + 2 days
    cost: 15,
    reward: { xp: 150, coins: 75 },
    level: 'Beginner',
    maxParticipants: 30,
    rules: ['Thời gian: 25 phút', 'Không được tra cứu', 'Trả lời đúng nhiều nhất sẽ thắng'],
    prizes: {
      first: { xp: 300, coins: 150 },
      second: { xp: 200, coins: 100 },
      third: { xp: 150, coins: 75 }
    }
  }
];

const reports = [
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
  }
];

async function seedData() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Vocabulary.deleteMany({});
    await Topic.deleteMany({});
    await Level.deleteMany({});
    await Test.deleteMany({});
    await ProficiencyTest.deleteMany({});
    await Competition.deleteMany({});
    await Report.deleteMany({});

    // Seed Topics
    console.log('Seeding topics...');
    const createdTopics = await Topic.insertMany(topics);
    console.log(`Created ${createdTopics.length} topics`);

    // Seed Levels
    console.log('Seeding levels...');
    const createdLevels = await Level.insertMany(levels);
    console.log(`Created ${createdLevels.length} levels`);

    // Seed Users
    console.log('Seeding users...');
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Seed Vocabularies
    console.log('Seeding vocabularies...');
    const createdVocabularies = await Vocabulary.insertMany(vocabularies);
    console.log(`Created ${createdVocabularies.length} vocabularies`);

    // Seed Tests
    console.log('Seeding tests...');
    const createdTests = await Test.insertMany(tests);
    console.log(`Created ${createdTests.length} tests`);

    // Seed Proficiency Tests
    console.log('Seeding proficiency tests...');
    const createdProficiencyTests = await ProficiencyTest.insertMany(proficiencyTests);
    console.log(`Created ${createdProficiencyTests.length} proficiency tests`);

    // Seed Competitions
    console.log('Seeding competitions...');
    const createdCompetitions = await Competition.insertMany(competitions);
    console.log(`Created ${createdCompetitions.length} competitions`);

    // Seed Reports
    console.log('Seeding reports...');
    const reportData = reports.map(report => ({
      ...report,
      userId: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id
    }));
    const createdReports = await Report.insertMany(reportData);
    console.log(`Created ${createdReports.length} reports`);

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        email: adminEmail,
        password: adminPassword,
        name: adminName,
        role: 'admin',
        level: 6,
        experience: 2000,
        coins: 1000,
        streak: 30
      });
      await admin.save();
      console.log(`Created admin user: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Topics: ${createdTopics.length}`);
    console.log(`   - Levels: ${createdLevels.length}`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Vocabularies: ${createdVocabularies.length}`);
    console.log(`   - Tests: ${createdTests.length}`);
    console.log(`   - Proficiency Tests: ${createdProficiencyTests.length}`);
    console.log(`   - Competitions: ${createdCompetitions.length}`);
    console.log(`   - Reports: ${createdReports.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedData();

