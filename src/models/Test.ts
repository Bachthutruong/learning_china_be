import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
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
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true
  },
  explanation: String
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
