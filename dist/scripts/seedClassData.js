"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Seed demo data for the Class Management feature.
 * Idempotent: re-running replaces previous demo data (tagged with [Demo]).
 *
 *   npx ts-node src/scripts/seedClassData.ts
 */
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const Test_1 = __importDefault(require("../models/Test"));
const LearningClass_1 = __importDefault(require("../models/LearningClass"));
const ClassSession_1 = __importDefault(require("../models/ClassSession"));
const ClassFeedback_1 = __importDefault(require("../models/ClassFeedback"));
const ClassSubmission_1 = __importDefault(require("../models/ClassSubmission"));
const ClassLeaveRequest_1 = __importDefault(require("../models/ClassLeaveRequest"));
dotenv_1.default.config();
const DEMO = '[Demo]';
const DEMO_DOMAIN = '@demo.jiudi';
const PASSWORD = '123456789';
const daysFromNow = (d, hour = 20, min = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(hour, min, 0, 0);
    return date;
};
const endOfDay = (date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };
const TEACHERS = [
    { name: 'Cô Lan Anh', email: `gv.lananh${DEMO_DOMAIN}` },
    { name: 'Thầy Minh Quân', email: `gv.minhquan${DEMO_DOMAIN}` },
    { name: 'Cô Thu Hà', email: `gv.thuha${DEMO_DOMAIN}` }
];
const STUDENT_NAMES = [
    'Nguyễn An', 'Trần Bình', 'Lê Châu', 'Phạm Dũng', 'Hoàng Giang', 'Vũ Hương',
    'Đỗ Khánh', 'Bùi Linh', 'Ngô Minh', 'Đặng Nam', 'Lý Oanh', 'Hồ Phúc',
    'Mai Quỳnh', 'Tô Sơn', 'Đinh Trang', 'Lưu Vy'
];
async function upsertUser(name, email, role) {
    let user = await User_1.default.findOne({ email });
    if (!user) {
        user = new User_1.default({ name, email, password: PASSWORD, role });
        await user.save();
    }
    else if (user.role !== role) {
        user.role = role;
        await user.save();
    }
    return user;
}
const mcq = (question, options, correctAnswer) => ({
    question, questionType: 'multiple-choice', options, correctAnswer, explanation: ''
});
async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chinese-learning';
    await mongoose_1.default.connect(uri);
    console.log('Connected to MongoDB');
    const admin = await User_1.default.findOne({ role: 'admin' });
    if (!admin) {
        console.error('Chưa có admin. Chạy seed:admin trước.');
        process.exit(1);
    }
    const adminId = admin._id;
    // 1. Clean previous demo data (keep demo users, refresh everything else)
    const oldClasses = await LearningClass_1.default.find({ name: { $regex: '^\\[Demo\\]' } }).select('_id');
    const oldClassIds = oldClasses.map(c => c._id);
    await Promise.all([
        ClassSession_1.default.deleteMany({ classId: { $in: oldClassIds } }),
        ClassFeedback_1.default.deleteMany({ classId: { $in: oldClassIds } }),
        ClassSubmission_1.default.deleteMany({ classId: { $in: oldClassIds } }),
        ClassLeaveRequest_1.default.deleteMany({ classId: { $in: oldClassIds } }),
        LearningClass_1.default.deleteMany({ _id: { $in: oldClassIds } }),
        Test_1.default.deleteMany({ title: { $regex: '^\\[Demo\\]' } })
    ]);
    console.log('Đã dọn dữ liệu demo cũ');
    // 2. Users
    const teachers = [];
    for (const t of TEACHERS)
        teachers.push(await upsertUser(t.name, t.email, 'teacher'));
    const students = [];
    for (let i = 0; i < STUDENT_NAMES.length; i++) {
        students.push(await upsertUser(STUDENT_NAMES[i], `hv.${i + 1}${DEMO_DOMAIN}`, 'user'));
    }
    console.log(`Users: ${teachers.length} giáo viên, ${students.length} học viên`);
    // 3. Tests (exercise bank)
    const test1 = await Test_1.default.create({
        title: `${DEMO} Ngữ pháp HSK1`, description: 'Đề luyện ngữ pháp cơ bản', level: 1,
        timeLimit: 20, requiredCoins: 0, rewardExperience: 50, rewardCoins: 10,
        questions: [
            mcq('我___学生。', ['是', '在', '有', '不'], 0),
            mcq('他每天___七点起床。', ['在', '是', '都', '从'], 0),
            mcq('这是___书？', ['谁的', '什么的', '哪里', '怎么'], 0),
            mcq('我有___个朋友。', ['三', '三个', '个三', '第三'], 0),
            mcq('___去学校？', ['你怎么', '怎么你', '你什么', '什么你'], 0)
        ]
    });
    const test2 = await Test_1.default.create({
        title: `${DEMO} Từ vựng HSK2`, description: 'Đề luyện từ vựng', level: 2,
        timeLimit: 20, requiredCoins: 0, rewardExperience: 50, rewardCoins: 10,
        questions: [
            mcq('“高兴” nghĩa là gì?', ['vui vẻ', 'buồn bã', 'tức giận', 'mệt mỏi'], 0),
            mcq('“便宜” nghĩa là gì?', ['rẻ', 'đắt', 'đẹp', 'mới'], 0),
            mcq('“认识” nghĩa là gì?', ['quen biết', 'quên', 'học', 'gặp'], 0),
            mcq('“帮助” nghĩa là gì?', ['giúp đỡ', 'làm phiền', 'từ chối', 'hỏi'], 0)
        ]
    });
    const buildExercises = (test, count) => (test.questions || []).slice(0, count).map((q) => ({
        questionId: `${test._id}:${q._id}`,
        sourceTestId: test._id,
        testTitle: test.title,
        level: test.level,
        questionType: q.questionType,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        passage: '', sentences: [], correctOrder: [], subQuestions: []
    }));
    console.log('Đã tạo 2 đề thi (ngân hàng bài tập)');
    // 4. Vocabulary with questions (for "khảo từ vựng")
    const vocabPool = await Vocabulary_1.default.find({ 'questions.0': { $exists: true } }).select('_id word').limit(60);
    if (vocabPool.length < 10)
        console.warn('Cảnh báo: ít từ vựng có câu khảo.');
    const pickVocab = (offset, n) => vocabPool.slice(offset, offset + n).map((v) => v._id);
    // 5. Classes + sessions
    const classDefs = [
        { name: `${DEMO} Lớp HSK1 - Tối 2-4-6`, fee: 1500000, teacher: teachers[0], studentSlice: [0, 8] },
        { name: `${DEMO} Lớp HSK2 - Tối 3-5-7`, fee: 1800000, teacher: teachers[1], studentSlice: [6, 14] },
        { name: `${DEMO} Lớp Giao tiếp - Cuối tuần`, fee: 1200000, teacher: teachers[2], studentSlice: [10, 16] }
    ];
    let totalSessions = 0, totalFeedback = 0, totalSubmissions = 0;
    for (let ci = 0; ci < classDefs.length; ci++) {
        const def = classDefs[ci];
        const classStudents = students.slice(def.studentSlice[0], def.studentSlice[1]);
        const klass = await LearningClass_1.default.create({
            name: def.name,
            description: 'Lớp học demo phục vụ kiểm thử tính năng quản lý lớp học.',
            capacity: 20, tuitionFee: def.fee, groupLink: 'https://zalo.me/g/demo',
            teacherIds: [def.teacher._id], studentIds: classStudents.map(s => s._id),
            status: 'active', createdBy: adminId
        });
        // Session timeline: 2 past, 1 happening today, 1 future, + recurring future slots
        const plan = [
            { title: 'Buổi 1 - Nhập môn', start: daysFromNow(-10), withContent: true },
            { title: 'Buổi 2 - Chào hỏi', start: daysFromNow(-6), withContent: true },
            { title: 'Buổi 3 - Ôn tập', start: daysFromNow(-2), withContent: true },
            { title: 'Buổi 4 - Bài mới', start: daysFromNow(2), withContent: true }
        ];
        const createdSessions = [];
        for (let si = 0; si < plan.length; si++) {
            const p = plan[si];
            const next = plan[si + 1];
            const endAt = new Date(p.start.getTime() + 90 * 60 * 1000);
            const session = await ClassSession_1.default.create({
                classId: klass._id,
                title: p.title,
                startAt: p.start,
                endAt,
                durationMinutes: 90,
                googleMeetLink: 'https://meet.google.com/demo-' + ci + '-' + si,
                content: p.withContent ? 'Nội dung buổi học: học từ vựng, luyện ngữ pháp và làm bài tập về nhà.' : '',
                vocabularyIds: pickVocab(si * 5, 5),
                exercises: buildExercises(si % 2 === 0 ? test1 : test2, 4),
                vocabularyDeadline: p.start,
                exerciseDeadline: next ? next.start : new Date(p.start.getTime() + 7 * 24 * 60 * 60 * 1000),
                feedbackDeadline: endOfDay(p.start),
                recurringDays: [],
                createdBy: def.teacher._id
            });
            createdSessions.push(session);
            totalSessions++;
        }
        // Recurring future slots (empty), to showcase the recurring flow + pagination
        const recDays = ci === 2 ? [6, 7] : [1, 3, 5];
        const recStartBase = daysFromNow(7, 20, 0);
        for (let w = 0; w < 2; w++) {
            for (const dow of recDays) {
                const start = new Date(recStartBase);
                // move to the desired ISO weekday within week w
                const cur = start.getDay() === 0 ? 7 : start.getDay();
                start.setDate(start.getDate() + (dow - cur) + w * 7);
                if (start < new Date())
                    continue;
                const endAt = new Date(start.getTime() + 90 * 60 * 1000);
                await ClassSession_1.default.create({
                    classId: klass._id,
                    title: `Buổi lặp ${w * recDays.length + recDays.indexOf(dow) + 5}`,
                    startAt: start, endAt, durationMinutes: 90,
                    googleMeetLink: '', content: '', vocabularyIds: [], exercises: [],
                    vocabularyDeadline: start,
                    exerciseDeadline: new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000),
                    feedbackDeadline: endOfDay(start),
                    recurringDays: recDays,
                    scheduleLabel: recDays.map(d => ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][d]).join(', ') + ' lúc 20:00',
                    createdBy: def.teacher._id
                });
                totalSessions++;
            }
        }
        // 6. Feedback + submissions for PAST sessions (varied, realistic)
        const pastSessions = createdSessions.filter(s => new Date(s.endAt) < new Date());
        for (const session of pastSessions) {
            for (let sIdx = 0; sIdx < classStudents.length; sIdx++) {
                const student = classStudents[sIdx];
                // ~70% submit feedback
                if (sIdx % 10 < 7) {
                    const understanding = [100, 80, 60, 40, 20][sIdx % 5];
                    const lowUnderstanding = understanding <= 40;
                    await ClassFeedback_1.default.create({
                        classId: klass._id, sessionId: session._id, studentId: student._id,
                        attendanceChoice: sIdx % 8 === 0 ? 'partial' : 'full',
                        attendanceReason: sIdx % 8 === 0 ? 'Vào muộn 10 phút do kẹt xe' : '',
                        understandingPercent: understanding,
                        lessonDifficulty: ['just_right', 'a_bit_hard', 'too_easy', 'very_hard'][sIdx % 4],
                        vocabularyMemory: ['good', 'partial', 'weak', 'need_review'][sIdx % 4],
                        grammarUnderstanding: ['clear', 'partial', 'unclear', 'need_reteach'][sIdx % 4],
                        teacherRating: 5 - (sIdx % 3),
                        unansweredQuestions: lowUnderstanding ? 'Em chưa hiểu cách dùng 了 trong câu hôm nay.' : '',
                        satisfactionRating: 5 - (sIdx % 2),
                        additionalComment: sIdx % 5 === 0 ? 'Mong thầy cô cho thêm bài tập về nhà.' : '',
                        status: lowUnderstanding ? 'needs_action' : 'submitted',
                        submittedByStudent: true,
                        submittedAt: new Date(session.startAt.getTime() + 60 * 60 * 1000),
                        teacherConfirmationStatus: sIdx % 4 === 0 ? 'present' : 'pending'
                    });
                    totalFeedback++;
                }
                else {
                    // Some students didn't submit; teacher confirmed presence/leave
                    await ClassFeedback_1.default.create({
                        classId: klass._id, sessionId: session._id, studentId: student._id,
                        status: 'teacher_seen', submittedByStudent: false,
                        teacherConfirmationStatus: sIdx % 2 === 0 ? 'present' : 'excused',
                        teacherConfirmationReason: sIdx % 2 === 0 ? 'Có mặt, quên điền feedback' : 'Đã xin nghỉ trước',
                        teacherUpdatedBy: def.teacher._id, teacherUpdatedAt: new Date()
                    });
                    totalFeedback++;
                }
                // Submissions: vocab + exercise for ~60% students
                if (sIdx % 10 < 6) {
                    const vocabTotal = 8, exTotal = 4;
                    const vocabCorrect = Math.max(0, vocabTotal - (sIdx % 4));
                    const exCorrect = Math.max(0, exTotal - (sIdx % 3));
                    await ClassSubmission_1.default.create({
                        classId: klass._id, sessionId: session._id, studentId: student._id,
                        type: 'vocabulary', attemptNo: 1, totalQuestions: vocabTotal, correctCount: vocabCorrect,
                        scorePercent: Math.round((vocabCorrect / vocabTotal) * 100), answers: []
                    });
                    await ClassSubmission_1.default.create({
                        classId: klass._id, sessionId: session._id, studentId: student._id,
                        type: 'exercise', attemptNo: 1, totalQuestions: exTotal, correctCount: exCorrect,
                        scorePercent: Math.round((exCorrect / exTotal) * 100), answers: []
                    });
                    totalSubmissions += 2;
                }
            }
        }
        // A few leave requests on the future session
        const futureSession = createdSessions.find(s => new Date(s.startAt) > new Date());
        if (futureSession) {
            for (let k = 0; k < Math.min(2, classStudents.length); k++) {
                await ClassLeaveRequest_1.default.create({
                    classId: klass._id, sessionId: futureSession._id, studentId: classStudents[k]._id,
                    reason: k === 0 ? 'Em có việc gia đình' : 'Em bị ốm', status: 'pending'
                });
            }
        }
        console.log(`Lớp "${def.name}": ${classStudents.length} HV, ${createdSessions.length + 1} buổi cố định + buổi lặp`);
    }
    console.log('\n========== HOÀN TẤT SEED ==========');
    console.log(`Lớp: ${classDefs.length} | Buổi học: ${totalSessions} | Feedback: ${totalFeedback} | Bài nộp: ${totalSubmissions}`);
    console.log('\n--- TÀI KHOẢN ĐĂNG NHẬP (mật khẩu: ' + PASSWORD + ') ---');
    console.log('Admin   : admin@gmail.com');
    TEACHERS.forEach(t => console.log(`Giáo viên: ${t.email}`));
    console.log(`Học viên : hv.1${DEMO_DOMAIN} ... hv.${STUDENT_NAMES.length}${DEMO_DOMAIN}`);
    await mongoose_1.default.connection.close();
    process.exit(0);
}
run().catch(async (err) => { console.error('Seed error:', err); try {
    await mongoose_1.default.connection.close();
}
catch { } process.exit(1); });
