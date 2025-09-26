import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order' | 'matching' | 'true-false';
  options?: string[];
  correctAnswer: number | string | number[]; // Support multiple answer types
  explanation?: string;
  // For reading comprehension
  passage?: string;
  // For fill-blank questions
  blanks?: { position: number; correctAnswer: string }[];
  // For sentence ordering
  sentences?: string[];
  correctOrder?: number[];
  // For matching questions
  leftItems?: string[];
  rightItems?: string[];
  correctMatches?: { left: number; right: number }[];
  // For true-false questions
  isTrue?: boolean;
}

export interface ITest extends Document {
  title: string;
  description: string;
  level: number;
  questions: IQuestion[];
  timeLimit: number;
  requiredCoins: number;
  rewardExperience: number;
  rewardCoins: number;
  completedBy: mongoose.Types.ObjectId[];
}

const QuestionSchema = new Schema<IQuestion>({
  question: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order', 'matching', 'true-false']
  },
  options: [String],
  correctAnswer: Schema.Types.Mixed, // Support multiple answer types
  explanation: String,
  // For reading comprehension
  passage: String,
  // For fill-blank questions
  blanks: [{
    position: Number,
    correctAnswer: String
  }],
  // For sentence ordering
  sentences: [String],
  correctOrder: [Number],
  // For matching questions
  leftItems: [String],
  rightItems: [String],
  correctMatches: [{
    left: Number,
    right: Number
  }],
  // For true-false questions
  isTrue: Boolean
});

const TestSchema = new Schema<ITest>({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Test description is required'],
    trim: true
  },
  level: {
    type: Number,
    required: [true, 'Test level is required'],
    min: 1,
    max: 6
  },
  questions: [QuestionSchema],
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required'],
    min: 1
  },
  requiredCoins: {
    type: Number,
    required: [true, 'Required coins is required'],
    min: 0
  },
  rewardExperience: {
    type: Number,
    required: [true, 'Reward experience is required'],
    min: 0
  },
  rewardCoins: {
    type: Number,
    required: [true, 'Reward coins is required'],
    min: 0
  },
  completedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

export default mongoose.model<ITest>('Test', TestSchema);
