"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitClassWork = exports.reviewLeave = exports.cancelLeave = exports.requestLeave = exports.updateFeedbackStatus = exports.submitSessionFeedback = exports.getSessionRoster = exports.deleteClassSession = exports.updateClassSession = exports.createClassSession = exports.getClassSessions = exports.getClassDetail = exports.deleteClass = exports.updateClass = exports.createClass = exports.listMyClasses = exports.listTeacherClasses = exports.listAdminClasses = exports.getClassContentOptions = exports.getClassOptions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const LearningClass_1 = __importDefault(require("../models/LearningClass"));
const ClassSession_1 = __importDefault(require("../models/ClassSession"));
const ClassFeedback_1 = __importDefault(require("../models/ClassFeedback"));
const ClassLeaveRequest_1 = __importDefault(require("../models/ClassLeaveRequest"));
const ClassSubmission_1 = __importDefault(require("../models/ClassSubmission"));
const User_1 = __importDefault(require("../models/User"));
const Vocabulary_1 = __importDefault(require("../models/Vocabulary"));
const Test_1 = __importDefault(require("../models/Test"));
const DAY_LABELS = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    7: 'Chủ nhật'
};
const toObjectIds = (values = []) => values
    .filter(Boolean)
    .map((value) => new mongoose_1.default.Types.ObjectId(String(value)));
const isSameId = (left, right) => String(left) === String(right);
const isAdmin = (req) => req.user?.role === 'admin';
const isoWeekday = (date) => {
    const day = date.getDay();
    return day === 0 ? 7 : day;
};
const endOfSessionDay = (date) => {
    const deadline = new Date(date);
    deadline.setHours(23, 59, 59, 999);
    return deadline;
};
const buildScheduleLabel = (days, time) => {
    if (!days.length)
        return '';
    return `${days.map((day) => DAY_LABELS[day] || `Thứ ${day}`).join(', ')} lúc ${time}`;
};
const generateSessionStarts = (startAt, recurringDays, repeatUntil) => {
    if (!recurringDays.length)
        return [startAt];
    const uniqueDays = Array.from(new Set(recurringDays.map(Number))).filter((day) => day >= 1 && day <= 7);
    const end = repeatUntil ? new Date(repeatUntil) : new Date(startAt.getTime() + 28 * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);
    const starts = [];
    const cursor = new Date(startAt);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= end && starts.length < 90) {
        if (uniqueDays.includes(isoWeekday(cursor))) {
            const candidate = new Date(cursor);
            candidate.setHours(startAt.getHours(), startAt.getMinutes(), 0, 0);
            if (candidate >= startAt)
                starts.push(candidate);
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return starts.length ? starts : [startAt];
};
const canManageClass = (req, klass) => {
    if (isAdmin(req))
        return true;
    return req.user?.role === 'teacher' && (klass.teacherIds || []).some((teacherId) => isSameId(teacherId, req.user._id));
};
const canViewClass = (req, klass) => {
    if (canManageClass(req, klass))
        return true;
    return (klass.studentIds || []).some((studentId) => isSameId(studentId, req.user._id));
};
const findClassForAccess = async (req, classId, manage = false) => {
    const klass = await LearningClass_1.default.findById(classId);
    if (!klass)
        return null;
    const allowed = manage ? canManageClass(req, klass) : canViewClass(req, klass);
    return allowed ? klass : false;
};
const classPopulate = [
    { path: 'teacherIds', select: 'name email role' },
    { path: 'studentIds', select: 'name email role level' },
    { path: 'createdBy', select: 'name email' }
];
const sessionPopulate = [
    { path: 'vocabularyIds', select: 'word pinyin meaning level questions' },
    { path: 'createdBy', select: 'name email role' }
];
// Flatten the questions embedded in Tests (/admin/tests) into a pickable bank.
const flattenTestExercises = (tests, search = '') => {
    const keyword = String(search || '').trim().toLowerCase();
    const exercises = [];
    tests.forEach((test) => {
        (test.questions || []).forEach((question) => {
            const text = String(question.question || '');
            if (keyword && !text.toLowerCase().includes(keyword))
                return;
            exercises.push({
                _id: `${test._id}:${question._id}`,
                sourceTestId: test._id,
                testTitle: test.title,
                level: test.level,
                questionType: question.questionType,
                question: question.question,
                options: question.options || [],
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || '',
                passage: question.passage || '',
                sentences: question.sentences || [],
                correctOrder: question.correctOrder || [],
                subQuestions: question.subQuestions || []
            });
        });
    });
    return exercises;
};
// Resolve composite exercise ids (`testId:questionId`) into stored snapshots.
const resolveExercises = async (exerciseIds = []) => {
    const ids = (exerciseIds || []).map((value) => String(value)).filter(Boolean);
    if (!ids.length)
        return [];
    const testIds = Array.from(new Set(ids.map((id) => id.split(':')[0]).filter(Boolean)));
    const tests = await Test_1.default.find({ _id: { $in: testIds } }).select('title level questions');
    const exerciseMap = new Map(flattenTestExercises(tests).map((item) => [item._id, item]));
    return ids
        .map((id) => exerciseMap.get(id))
        .filter(Boolean)
        .map((item) => ({
        questionId: item._id,
        sourceTestId: item.sourceTestId,
        testTitle: item.testTitle,
        level: item.level,
        questionType: item.questionType,
        question: item.question,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        passage: item.passage,
        sentences: item.sentences,
        correctOrder: item.correctOrder,
        subQuestions: item.subQuestions
    }));
};
// Expose stored exercise snapshots to clients with a stable `_id` for answering.
const serializeExercises = (session) => (session.exercises || []).map((exercise) => {
    const plain = exercise.toObject ? exercise.toObject() : exercise;
    return { ...plain, _id: plain.questionId };
});
const needsActionFromFeedback = (payload) => {
    return payload.attendanceChoice === 'absent'
        || Number(payload.understandingPercent) <= 40
        || payload.lessonDifficulty === 'very_hard'
        || payload.vocabularyMemory === 'need_review'
        || payload.grammarUnderstanding === 'need_reteach'
        || Number(payload.teacherRating) <= 2
        || Number(payload.satisfactionRating) <= 2;
};
const compareAnswers = (correctAnswer, answer) => {
    if (Array.isArray(correctAnswer)) {
        const left = Array.isArray(answer) ? [...answer].map(Number).sort() : [];
        const right = [...correctAnswer].map(Number).sort();
        return left.length === right.length && left.every((item, index) => item === right[index]);
    }
    return Number(answer) === Number(correctAnswer);
};
const isQuestionAnswerCorrect = (question, answer) => {
    if (question.questionType === 'multiple-choice') {
        return compareAnswers(question.correctAnswer, answer);
    }
    if (question.questionType === 'fill-blank') {
        return String(answer || '').trim().toLowerCase() === String(question.correctAnswer || '').trim().toLowerCase();
    }
    if (question.questionType === 'sentence-order') {
        const left = Array.isArray(answer) ? answer : [];
        const right = Array.isArray(question.correctOrder) ? question.correctOrder : [];
        return left.length === right.length && left.every((item, index) => Number(item) === Number(right[index]));
    }
    if (question.questionType === 'reading-comprehension') {
        if (!Array.isArray(question.subQuestions) || !Array.isArray(answer))
            return false;
        return question.subQuestions.every((subQuestion, index) => Number(subQuestion.correctAnswer) === Number(answer[index]));
    }
    return compareAnswers(question.correctAnswer, answer);
};
const buildVocabularyQuestions = (session) => {
    const questions = [];
    (session.vocabularyIds || []).forEach((vocabulary) => {
        (vocabulary.questions || []).forEach((question, index) => {
            questions.push({
                _id: `${vocabulary._id}:${index}`,
                vocabularyId: vocabulary._id,
                vocabularyWord: vocabulary.word,
                questionType: 'multiple-choice',
                question: question.question,
                options: question.options || [],
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || ''
            });
        });
    });
    return questions;
};
const enrichClassesWithCounts = async (classes) => {
    const now = new Date();
    return Promise.all(classes.map(async (klass) => {
        const [sessionsCount, upcomingCount] = await Promise.all([
            ClassSession_1.default.countDocuments({ classId: klass._id }),
            ClassSession_1.default.countDocuments({ classId: klass._id, startAt: { $gte: now } })
        ]);
        return { ...klass.toObject(), sessionsCount, upcomingCount };
    }));
};
// Shared server-side pagination + name search for class lists.
const respondPaginatedClasses = async (req, res, baseQuery) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 8), 100);
    const search = String(req.query.search || '').trim();
    const query = { ...baseQuery };
    if (search)
        query.name = { $regex: search, $options: 'i' };
    const total = await LearningClass_1.default.countDocuments(query);
    const classes = await LearningClass_1.default.find(query)
        .populate(classPopulate)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    res.json({
        classes: await enrichClassesWithCounts(classes),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit))
    });
};
const latestSubmissionMap = (submissions) => {
    const map = new Map();
    submissions.forEach((submission) => {
        const key = `${submission.sessionId}:${submission.type}`;
        const existing = map.get(key);
        if (!existing || submission.attemptNo > existing.attemptNo) {
            map.set(key, submission);
        }
    });
    return map;
};
const getClassOptions = async (req, res) => {
    try {
        // Admins manage full roster; teachers need the student list to add students to their classes.
        if (!['admin', 'teacher'].includes(req.user?.role))
            return res.status(403).json({ message: 'Not authorized' });
        const [teachers, students] = await Promise.all([
            User_1.default.find({ role: { $in: ['teacher', 'admin'] } }).select('name email role').sort({ name: 1 }),
            User_1.default.find({ role: 'user' }).select('name email role level').sort({ name: 1 })
        ]);
        res.json({ teachers, students });
    }
    catch (error) {
        console.error('getClassOptions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getClassOptions = getClassOptions;
const getClassContentOptions = async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user?.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { q = '', limit = 300 } = req.query;
        const lim = Math.min(Number(limit) || 300, 1000);
        const search = String(q || '').trim();
        const vocabQuery = search
            ? { $or: [{ word: { $regex: search, $options: 'i' } }, { meaning: { $regex: search, $options: 'i' } }] }
            : {};
        const [vocabularies, vocabulariesTotal, tests, testsTotal] = await Promise.all([
            Vocabulary_1.default.find(vocabQuery).select('word pinyin meaning level questions').sort({ word: 1 }).limit(lim),
            Vocabulary_1.default.countDocuments(vocabQuery),
            Test_1.default.find().select('title level questions').sort({ level: 1, createdAt: -1 }),
            Test_1.default.countDocuments()
        ]);
        const exercises = flattenTestExercises(tests, search).slice(0, lim);
        const exercisesTotal = tests.reduce((sum, test) => sum + (test.questions?.length || 0), 0);
        res.json({
            vocabularies,
            vocabulariesTotal,
            exercises,
            exercisesTotal,
            testsTotal
        });
    }
    catch (error) {
        console.error('getClassContentOptions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getClassContentOptions = getClassContentOptions;
const listAdminClasses = async (req, res) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ message: 'Not authorized' });
        await respondPaginatedClasses(req, res, {});
    }
    catch (error) {
        console.error('listAdminClasses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.listAdminClasses = listAdminClasses;
const listTeacherClasses = async (req, res) => {
    try {
        if (!['teacher', 'admin'].includes(req.user?.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const baseQuery = isAdmin(req) ? {} : { teacherIds: req.user._id };
        await respondPaginatedClasses(req, res, baseQuery);
    }
    catch (error) {
        console.error('listTeacherClasses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.listTeacherClasses = listTeacherClasses;
const listMyClasses = async (req, res) => {
    try {
        const classes = await LearningClass_1.default.find({ studentIds: req.user._id, status: 'active' })
            .populate(classPopulate)
            .sort({ createdAt: -1 });
        const now = new Date();
        const data = await Promise.all(classes.map(async (klass) => {
            const sessions = await ClassSession_1.default.find({ classId: klass._id })
                .populate(sessionPopulate)
                .sort({ startAt: 1 });
            const [feedbacks, leaves, submissions] = await Promise.all([
                ClassFeedback_1.default.find({ classId: klass._id, studentId: req.user._id }),
                ClassLeaveRequest_1.default.find({ classId: klass._id, studentId: req.user._id }),
                ClassSubmission_1.default.find({ classId: klass._id, studentId: req.user._id }).sort({ attemptNo: -1 })
            ]);
            const feedbackMap = new Map(feedbacks.map((item) => [String(item.sessionId), item]));
            const leaveMap = new Map(leaves.map((item) => [String(item.sessionId), item]));
            const submissionMap = latestSubmissionMap(submissions);
            const finishedSessions = sessions.filter((session) => new Date(session.endAt) <= now);
            const attendedCount = finishedSessions.filter((session) => {
                const feedback = feedbackMap.get(String(session._id));
                return feedback?.teacherConfirmationStatus === 'present'
                    || (feedback?.submittedByStudent && ['full', 'partial'].includes(feedback.attendanceChoice));
            }).length;
            return {
                ...klass.toObject(),
                stats: {
                    attendedSessions: attendedCount,
                    totalSessions: sessions.length,
                    finishedSessions: finishedSessions.length
                },
                sessions: sessions.map((session) => ({
                    ...session.toObject(),
                    exercises: serializeExercises(session),
                    vocabularyQuizQuestions: buildVocabularyQuestions(session),
                    myFeedback: feedbackMap.get(String(session._id)) || null,
                    myLeaveRequest: leaveMap.get(String(session._id)) || null,
                    latestVocabularySubmission: submissionMap.get(`${session._id}:vocabulary`) || null,
                    latestExerciseSubmission: submissionMap.get(`${session._id}:exercise`) || null
                }))
            };
        }));
        res.json({ classes: data });
    }
    catch (error) {
        console.error('listMyClasses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.listMyClasses = listMyClasses;
const createClass = async (req, res) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ message: 'Not authorized' });
        const { name, description = '', capacity = 20, tuitionFee = 0, groupLink = '', teacherIds = [], studentIds = [] } = req.body;
        if (!name || !String(name).trim())
            return res.status(400).json({ message: 'Vui lòng nhập tên lớp học' });
        const klass = await LearningClass_1.default.create({
            name,
            description,
            capacity: Number(capacity) || 1,
            tuitionFee: Number(tuitionFee) || 0,
            groupLink,
            teacherIds: toObjectIds(teacherIds),
            studentIds: toObjectIds(studentIds),
            createdBy: req.user._id
        });
        const populated = await LearningClass_1.default.findById(klass._id).populate(classPopulate);
        res.status(201).json({ message: 'Class created', class: populated });
    }
    catch (error) {
        console.error('createClass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createClass = createClass;
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await LearningClass_1.default.findById(id);
        if (!existing)
            return res.status(404).json({ message: 'Class not found' });
        const admin = isAdmin(req);
        // Teachers of the class can update the student roster; full edit stays admin-only.
        if (!admin && !canManageClass(req, existing))
            return res.status(403).json({ message: 'Not authorized' });
        const { name, description, capacity, tuitionFee, groupLink, teacherIds, studentIds, status } = req.body;
        const updateData = {};
        if (admin) {
            if (name !== undefined)
                updateData.name = name;
            if (description !== undefined)
                updateData.description = description;
            if (capacity !== undefined)
                updateData.capacity = Number(capacity) || 1;
            if (tuitionFee !== undefined)
                updateData.tuitionFee = Number(tuitionFee) || 0;
            if (groupLink !== undefined)
                updateData.groupLink = groupLink;
            if (teacherIds !== undefined)
                updateData.teacherIds = toObjectIds(teacherIds);
            if (status !== undefined)
                updateData.status = status;
        }
        // Both admins and managing teachers can edit the student list.
        if (studentIds !== undefined)
            updateData.studentIds = toObjectIds(studentIds);
        const klass = await LearningClass_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(classPopulate);
        res.json({ message: 'Class updated', class: klass });
    }
    catch (error) {
        console.error('updateClass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateClass = updateClass;
const deleteClass = async (req, res) => {
    try {
        if (!isAdmin(req))
            return res.status(403).json({ message: 'Not authorized' });
        const { id } = req.params;
        const klass = await LearningClass_1.default.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
        if (!klass)
            return res.status(404).json({ message: 'Class not found' });
        res.json({ message: 'Class archived' });
    }
    catch (error) {
        console.error('deleteClass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteClass = deleteClass;
const getClassDetail = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const klass = await LearningClass_1.default.findById(req.params.id).populate(classPopulate);
        const now = new Date();
        const [sessionsCount, upcomingCount] = await Promise.all([
            ClassSession_1.default.countDocuments({ classId: req.params.id }),
            ClassSession_1.default.countDocuments({ classId: req.params.id, startAt: { $gte: now } })
        ]);
        res.json({ class: { ...klass.toObject(), sessionsCount, upcomingCount } });
    }
    catch (error) {
        console.error('getClassDetail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getClassDetail = getClassDetail;
// Paginated + searchable session list for a class (server-side).
const getClassSessions = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(Math.max(1, Number(req.query.limit) || 5), 100);
        const search = String(req.query.search || '').trim();
        const query = { classId: req.params.id };
        if (search)
            query.title = { $regex: search, $options: 'i' };
        const total = await ClassSession_1.default.countDocuments(query);
        const sessions = await ClassSession_1.default.find(query)
            .populate(sessionPopulate)
            .sort({ startAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit);
        res.json({
            sessions: sessions.map((session) => ({
                ...session.toObject(),
                exercises: serializeExercises(session),
                vocabularyQuizQuestions: buildVocabularyQuestions(session)
            })),
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit))
        });
    }
    catch (error) {
        console.error('getClassSessions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getClassSessions = getClassSessions;
const createClassSession = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id, true);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const { title, startAt, durationMinutes = 90, googleMeetLink = '', content = '', vocabularyIds = [], exerciseIds = [], vocabularyDeadline, exerciseDeadline, feedbackDeadline, recurringDays = [], repeatUntil } = req.body;
        if (!title || !startAt) {
            return res.status(400).json({ message: 'Vui lòng nhập tên buổi học và thời gian bắt đầu' });
        }
        const firstStart = new Date(startAt);
        const duration = Math.max(Number(durationMinutes) || 90, 15);
        const days = Array.isArray(recurringDays) ? recurringDays.map(Number).filter(Boolean) : [];
        const starts = generateSessionStarts(firstStart, days, repeatUntil).sort((a, b) => a.getTime() - b.getTime());
        const timeLabel = firstStart.toTimeString().slice(0, 5);
        const scheduleLabel = buildScheduleLabel(days, timeLabel);
        // Recurring creation only produces the empty time slots. Vocabulary, exercises,
        // content and per-session deadlines are added later for each session individually.
        const isRecurring = starts.length > 1;
        const exercises = isRecurring ? [] : await resolveExercises(exerciseIds);
        const vocabIds = isRecurring ? [] : toObjectIds(vocabularyIds);
        const createdSessions = await Promise.all(starts.map((start, index) => {
            const endAt = new Date(start.getTime() + duration * 60 * 1000);
            const nextStart = starts[index + 1];
            const fallbackExerciseDeadline = nextStart || new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
            return ClassSession_1.default.create({
                classId: access._id,
                title: isRecurring ? `${title} #${index + 1}` : title,
                startAt: start,
                endAt,
                durationMinutes: duration,
                googleMeetLink,
                content: isRecurring ? '' : content,
                vocabularyIds: vocabIds,
                exercises,
                // For recurring slots, deadlines are always computed relative to each session.
                vocabularyDeadline: isRecurring ? start : (vocabularyDeadline ? new Date(vocabularyDeadline) : start),
                exerciseDeadline: isRecurring ? fallbackExerciseDeadline : (exerciseDeadline ? new Date(exerciseDeadline) : fallbackExerciseDeadline),
                feedbackDeadline: isRecurring ? endOfSessionDay(start) : (feedbackDeadline ? new Date(feedbackDeadline) : endOfSessionDay(start)),
                recurringDays: days,
                scheduleLabel,
                createdBy: req.user._id
            });
        }));
        const sessions = await ClassSession_1.default.find({ _id: { $in: createdSessions.map((session) => session._id) } })
            .populate(sessionPopulate)
            .sort({ startAt: 1 });
        res.status(201).json({ message: 'Sessions created', sessions });
    }
    catch (error) {
        console.error('createClassSession error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createClassSession = createClassSession;
const updateClassSession = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id, true);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const updateData = { ...req.body };
        if (updateData.vocabularyIds)
            updateData.vocabularyIds = toObjectIds(updateData.vocabularyIds);
        if (updateData.exerciseIds !== undefined) {
            updateData.exercises = await resolveExercises(updateData.exerciseIds);
            delete updateData.exerciseIds;
        }
        ['startAt', 'endAt', 'vocabularyDeadline', 'exerciseDeadline', 'feedbackDeadline'].forEach((key) => {
            if (updateData[key])
                updateData[key] = new Date(updateData[key]);
        });
        if (updateData.durationMinutes && updateData.startAt && !updateData.endAt) {
            updateData.endAt = new Date(updateData.startAt.getTime() + Number(updateData.durationMinutes) * 60 * 1000);
        }
        const session = await ClassSession_1.default.findOneAndUpdate({ _id: req.params.sessionId, classId: req.params.id }, updateData, { new: true, runValidators: true }).populate(sessionPopulate);
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        res.json({ message: 'Session updated', session });
    }
    catch (error) {
        console.error('updateClassSession error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateClassSession = updateClassSession;
const deleteClassSession = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id, true);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const session = await ClassSession_1.default.findOneAndDelete({ _id: req.params.sessionId, classId: req.params.id });
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        await Promise.all([
            ClassFeedback_1.default.deleteMany({ sessionId: req.params.sessionId }),
            ClassLeaveRequest_1.default.deleteMany({ sessionId: req.params.sessionId }),
            ClassSubmission_1.default.deleteMany({ sessionId: req.params.sessionId })
        ]);
        res.json({ message: 'Session deleted' });
    }
    catch (error) {
        console.error('deleteClassSession error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteClassSession = deleteClassSession;
const getSessionRoster = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id, true);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const session = await ClassSession_1.default.findOne({ _id: req.params.sessionId, classId: req.params.id });
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        const [klass, feedbacks, leaves, submissions] = await Promise.all([
            LearningClass_1.default.findById(req.params.id).populate({ path: 'studentIds', select: 'name email level role' }),
            ClassFeedback_1.default.find({ sessionId: req.params.sessionId }).populate('teacherUpdatedBy', 'name email'),
            ClassLeaveRequest_1.default.find({ sessionId: req.params.sessionId }).populate('reviewedBy', 'name email'),
            ClassSubmission_1.default.find({ sessionId: req.params.sessionId }).sort({ attemptNo: -1 })
        ]);
        const feedbackMap = new Map(feedbacks.map((item) => [String(item.studentId), item]));
        const leaveMap = new Map(leaves.map((item) => [String(item.studentId), item]));
        const roster = (klass?.studentIds || []).map((student) => {
            const studentSubmissions = submissions.filter((item) => isSameId(item.studentId, student._id));
            return {
                student,
                feedback: feedbackMap.get(String(student._id)) || null,
                leaveRequest: leaveMap.get(String(student._id)) || null,
                submissions: studentSubmissions
            };
        });
        res.json({ session, roster });
    }
    catch (error) {
        console.error('getSessionRoster error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getSessionRoster = getSessionRoster;
const submitSessionFeedback = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false || !access.studentIds.some((studentId) => isSameId(studentId, req.user._id))) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const session = await ClassSession_1.default.findOne({ _id: req.params.sessionId, classId: req.params.id });
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        const now = new Date();
        if (now < new Date(session.startAt))
            return res.status(400).json({ message: 'Chỉ gửi feedback sau khi buổi học bắt đầu' });
        if (now > new Date(session.feedbackDeadline))
            return res.status(400).json({ message: 'Đã quá hạn gửi feedback của buổi học' });
        const payload = req.body;
        const feedback = await ClassFeedback_1.default.findOneAndUpdate({ classId: req.params.id, sessionId: req.params.sessionId, studentId: req.user._id }, {
            $set: {
                attendanceChoice: payload.attendanceChoice,
                attendanceReason: payload.attendanceReason || '',
                understandingPercent: Number(payload.understandingPercent),
                lessonDifficulty: payload.lessonDifficulty,
                vocabularyMemory: payload.vocabularyMemory,
                grammarUnderstanding: payload.grammarUnderstanding,
                teacherRating: Number(payload.teacherRating),
                unansweredQuestions: payload.unansweredQuestions || '',
                satisfactionRating: Number(payload.satisfactionRating),
                additionalComment: payload.additionalComment || '',
                status: needsActionFromFeedback(payload) ? 'needs_action' : 'submitted',
                submittedByStudent: true,
                submittedAt: now
            }
        }, { upsert: true, new: true, runValidators: true });
        res.json({ message: 'Feedback submitted', feedback });
    }
    catch (error) {
        console.error('submitSessionFeedback error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.submitSessionFeedback = submitSessionFeedback;
const updateFeedbackStatus = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id, true);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const { studentId } = req.params;
        const { status, teacherConfirmationStatus, teacherConfirmationReason = '', teacherNote = '' } = req.body;
        const feedback = await ClassFeedback_1.default.findOneAndUpdate({ classId: req.params.id, sessionId: req.params.sessionId, studentId }, {
            $set: {
                ...(status ? { status } : {}),
                ...(teacherConfirmationStatus ? { teacherConfirmationStatus } : {}),
                teacherConfirmationReason,
                teacherNote,
                teacherUpdatedBy: req.user._id,
                teacherUpdatedAt: new Date()
            },
            // Only mark as teacher-created when the student has not submitted feedback.
            // Never overwrite an existing student submission flag.
            $setOnInsert: { submittedByStudent: false }
        }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
        res.json({ message: 'Feedback status updated', feedback });
    }
    catch (error) {
        console.error('updateFeedbackStatus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateFeedbackStatus = updateFeedbackStatus;
const requestLeave = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false || !access.studentIds.some((studentId) => isSameId(studentId, req.user._id))) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const session = await ClassSession_1.default.findOne({ _id: req.params.sessionId, classId: req.params.id });
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        if (new Date() >= new Date(session.startAt)) {
            return res.status(400).json({ message: 'Buổi học đã bắt đầu, không thể đổi trạng thái xin nghỉ' });
        }
        if (!req.body.reason || !String(req.body.reason).trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập lý do xin nghỉ' });
        }
        const leaveRequest = await ClassLeaveRequest_1.default.findOneAndUpdate({ classId: req.params.id, sessionId: req.params.sessionId, studentId: req.user._id }, {
            $set: {
                reason: req.body.reason,
                status: 'pending',
                teacherNote: '',
                reviewedBy: undefined,
                reviewedAt: undefined
            }
        }, { upsert: true, new: true, runValidators: true });
        res.json({ message: 'Leave request saved', leaveRequest });
    }
    catch (error) {
        console.error('requestLeave error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.requestLeave = requestLeave;
const cancelLeave = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const session = await ClassSession_1.default.findOne({ _id: req.params.sessionId, classId: req.params.id });
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        if (new Date() >= new Date(session.startAt)) {
            return res.status(400).json({ message: 'Buổi học đã bắt đầu, không thể đổi trạng thái xin nghỉ' });
        }
        const leaveRequest = await ClassLeaveRequest_1.default.findOneAndUpdate({ classId: req.params.id, sessionId: req.params.sessionId, studentId: req.user._id }, { $set: { status: 'cancelled' } }, { new: true });
        res.json({ message: 'Leave request cancelled', leaveRequest });
    }
    catch (error) {
        console.error('cancelLeave error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.cancelLeave = cancelLeave;
const reviewLeave = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id, true);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false)
            return res.status(403).json({ message: 'Not authorized' });
        const { studentId } = req.params;
        const { status, teacherNote = '' } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid leave status' });
        }
        const leaveRequest = await ClassLeaveRequest_1.default.findOneAndUpdate({ classId: req.params.id, sessionId: req.params.sessionId, studentId }, {
            $set: {
                status,
                teacherNote,
                reviewedBy: req.user._id,
                reviewedAt: new Date()
            }
        }, { new: true });
        if (!leaveRequest)
            return res.status(404).json({ message: 'Leave request not found' });
        res.json({ message: 'Leave request reviewed', leaveRequest });
    }
    catch (error) {
        console.error('reviewLeave error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.reviewLeave = reviewLeave;
const submitClassWork = async (req, res) => {
    try {
        const access = await findClassForAccess(req, req.params.id);
        if (access === null)
            return res.status(404).json({ message: 'Class not found' });
        if (access === false || !access.studentIds.some((studentId) => isSameId(studentId, req.user._id))) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { type, answers = [] } = req.body;
        if (!['vocabulary', 'exercise'].includes(type)) {
            return res.status(400).json({ message: 'Invalid submission type' });
        }
        const session = await ClassSession_1.default.findOne({ _id: req.params.sessionId, classId: req.params.id }).populate(sessionPopulate);
        if (!session)
            return res.status(404).json({ message: 'Session not found' });
        const now = new Date();
        const deadline = type === 'vocabulary' ? new Date(session.vocabularyDeadline) : new Date(session.exerciseDeadline);
        if (now > deadline) {
            return res.status(400).json({ message: type === 'vocabulary' ? 'Đã quá hạn khảo từ vựng' : 'Đã quá hạn làm bài tập' });
        }
        const questionList = type === 'vocabulary'
            ? buildVocabularyQuestions(session)
            : serializeExercises(session);
        if (!questionList.length)
            return res.status(400).json({ message: 'Buổi học chưa có câu hỏi để làm bài' });
        const answerMap = new Map((answers || []).map((item) => [String(item.questionId), item.answer]));
        const resultAnswers = questionList.map((question) => {
            const answer = answerMap.get(String(question._id));
            const correct = type === 'vocabulary'
                ? compareAnswers(question.correctAnswer, answer)
                : isQuestionAnswerCorrect(question, answer);
            return {
                questionId: String(question._id),
                answer,
                correct
            };
        });
        const correctCount = resultAnswers.filter((item) => item.correct).length;
        const attemptNo = await ClassSubmission_1.default.countDocuments({
            classId: req.params.id,
            sessionId: req.params.sessionId,
            studentId: req.user._id,
            type
        }) + 1;
        const submission = await ClassSubmission_1.default.create({
            classId: req.params.id,
            sessionId: req.params.sessionId,
            studentId: req.user._id,
            type,
            attemptNo,
            totalQuestions: questionList.length,
            correctCount,
            scorePercent: Math.round((correctCount / questionList.length) * 100),
            answers: resultAnswers,
            submittedAt: now
        });
        res.status(201).json({ message: 'Submission saved', submission });
    }
    catch (error) {
        console.error('submitClassWork error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.submitClassWork = submitClassWork;
