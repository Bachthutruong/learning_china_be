import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceChoice = 'full' | 'partial' | 'absent';
export type FeedbackStatus = 'submitted' | 'teacher_seen' | 'needs_action' | 'resolved';
export type TeacherConfirmationStatus = 'pending' | 'present' | 'absent' | 'excused';

export interface IClassFeedback extends Document {
  classId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  attendanceChoice: AttendanceChoice;
  attendanceReason?: string;
  understandingPercent: number;
  lessonDifficulty: 'too_easy' | 'just_right' | 'a_bit_hard' | 'very_hard';
  vocabularyMemory: 'good' | 'partial' | 'weak' | 'need_review';
  grammarUnderstanding: 'clear' | 'partial' | 'unclear' | 'need_reteach';
  teacherRating: number;
  unansweredQuestions?: string;
  satisfactionRating: number;
  additionalComment?: string;
  status: FeedbackStatus;
  submittedByStudent: boolean;
  submittedAt: Date;
  teacherConfirmationStatus: TeacherConfirmationStatus;
  teacherConfirmationReason?: string;
  teacherNote?: string;
  teacherUpdatedBy?: mongoose.Types.ObjectId;
  teacherUpdatedAt?: Date;
}

const ClassFeedbackSchema = new Schema<IClassFeedback>({
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'LearningClass',
    required: true,
    index: true
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'ClassSession',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  attendanceChoice: {
    type: String,
    enum: ['full', 'partial', 'absent'],
    default: 'full'
  },
  attendanceReason: {
    type: String,
    trim: true,
    default: ''
  },
  understandingPercent: {
    type: Number,
    enum: [100, 80, 60, 40, 20],
    default: 60
  },
  lessonDifficulty: {
    type: String,
    enum: ['too_easy', 'just_right', 'a_bit_hard', 'very_hard'],
    default: 'just_right'
  },
  vocabularyMemory: {
    type: String,
    enum: ['good', 'partial', 'weak', 'need_review'],
    default: 'partial'
  },
  grammarUnderstanding: {
    type: String,
    enum: ['clear', 'partial', 'unclear', 'need_reteach'],
    default: 'partial'
  },
  teacherRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  unansweredQuestions: {
    type: String,
    trim: true,
    default: ''
  },
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  additionalComment: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['submitted', 'teacher_seen', 'needs_action', 'resolved'],
    default: 'submitted'
  },
  submittedByStudent: {
    type: Boolean,
    default: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  teacherConfirmationStatus: {
    type: String,
    enum: ['pending', 'present', 'absent', 'excused'],
    default: 'pending'
  },
  teacherConfirmationReason: {
    type: String,
    trim: true,
    default: ''
  },
  teacherNote: {
    type: String,
    trim: true,
    default: ''
  },
  teacherUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  teacherUpdatedAt: Date
}, {
  timestamps: true
});

ClassFeedbackSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<IClassFeedback>('ClassFeedback', ClassFeedbackSchema);
