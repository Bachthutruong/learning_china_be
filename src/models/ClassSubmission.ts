import mongoose, { Document, Schema } from 'mongoose';

export interface IClassSubmissionAnswer {
  questionId: string;
  answer: any;
  correct: boolean;
}

export interface IClassSubmission extends Document {
  classId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: 'vocabulary' | 'exercise';
  attemptNo: number;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  answers: IClassSubmissionAnswer[];
  submittedAt: Date;
}

const ClassSubmissionAnswerSchema = new Schema<IClassSubmissionAnswer>({
  questionId: {
    type: String,
    required: true
  },
  answer: Schema.Types.Mixed,
  correct: {
    type: Boolean,
    required: true
  }
}, { _id: false });

const ClassSubmissionSchema = new Schema<IClassSubmission>({
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
  type: {
    type: String,
    enum: ['vocabulary', 'exercise'],
    required: true
  },
  attemptNo: {
    type: Number,
    min: 1,
    required: true
  },
  totalQuestions: {
    type: Number,
    min: 0,
    required: true
  },
  correctCount: {
    type: Number,
    min: 0,
    required: true
  },
  scorePercent: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  answers: [ClassSubmissionAnswerSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ClassSubmissionSchema.index({ sessionId: 1, studentId: 1, type: 1, attemptNo: -1 });

export default mongoose.model<IClassSubmission>('ClassSubmission', ClassSubmissionSchema);
