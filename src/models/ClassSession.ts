import mongoose, { Document, Schema } from 'mongoose';

// Snapshot of an exercise picked from the Test question bank (/admin/tests).
// Stored embedded so a session keeps the exact question even if the test changes.
export interface IClassExercise {
  questionId: string;          // composite `${testId}:${questionSubdocId}` – stable key
  sourceTestId?: mongoose.Types.ObjectId;
  testTitle?: string;
  level?: number;
  questionType: string;
  question: string;
  options?: string[];
  correctAnswer?: any;
  explanation?: string;
  passage?: string;
  sentences?: string[];
  correctOrder?: number[];
  subQuestions?: Array<{ question: string; options: string[]; correctAnswer: number }>;
}

export interface IClassSession extends Document {
  classId: mongoose.Types.ObjectId;
  title: string;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  googleMeetLink?: string;
  content?: string;
  vocabularyIds: mongoose.Types.ObjectId[];
  exercises: IClassExercise[];
  vocabularyDeadline: Date;
  exerciseDeadline: Date;
  feedbackDeadline: Date;
  recurringDays: number[];
  scheduleLabel?: string;
  createdBy: mongoose.Types.ObjectId;
}

const ClassExerciseSchema = new Schema<IClassExercise>({
  questionId: { type: String, required: true },
  sourceTestId: { type: Schema.Types.ObjectId, ref: 'Test' },
  testTitle: { type: String, default: '' },
  level: { type: Number },
  questionType: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: Schema.Types.Mixed,
  explanation: { type: String, default: '' },
  passage: { type: String, default: '' },
  sentences: [{ type: String }],
  correctOrder: [{ type: Number }],
  subQuestions: [{
    question: String,
    options: [String],
    correctAnswer: Number
  }]
}, { _id: false });

const ClassSessionSchema = new Schema<IClassSession>({
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'LearningClass',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true
  },
  startAt: {
    type: Date,
    required: true
  },
  endAt: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    min: 15,
    default: 90
  },
  googleMeetLink: {
    type: String,
    trim: true,
    default: ''
  },
  content: {
    type: String,
    trim: true,
    default: ''
  },
  vocabularyIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Vocabulary'
  }],
  exercises: [ClassExerciseSchema],
  vocabularyDeadline: {
    type: Date,
    required: true
  },
  exerciseDeadline: {
    type: Date,
    required: true
  },
  feedbackDeadline: {
    type: Date,
    required: true
  },
  recurringDays: [{
    type: Number,
    min: 1,
    max: 7
  }],
  scheduleLabel: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

ClassSessionSchema.index({ classId: 1, startAt: 1 });

export default mongoose.model<IClassSession>('ClassSession', ClassSessionSchema);
