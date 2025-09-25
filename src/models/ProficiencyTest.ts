import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface IProficiencyTest extends Document {
  level: 'A' | 'B' | 'C';
  questions: IQuestion[];
  timeLimit: number;
  requiredCoins: number;
  rewardExperience: number;
  rewardCoins: number;
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

const ProficiencyTestSchema = new Schema<IProficiencyTest>({
  level: {
    type: String,
    required: [true, 'Proficiency level is required'],
    enum: ['A', 'B', 'C']
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
  }
}, {
  timestamps: true
});

export default mongoose.model<IProficiencyTest>('ProficiencyTest', ProficiencyTestSchema);


