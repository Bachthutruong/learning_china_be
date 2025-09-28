import mongoose, { Document, Schema } from 'mongoose';

export interface ICompetitionPrize {
  first: {
    xp: number;
    coins: number;
  };
  second: {
    xp: number;
    coins: number;
  };
  third: {
    xp: number;
    coins: number;
  };
}

export interface ICompetitionQuestion {
  question: string;
  options: string[];
  correctAnswer: number | number[]; // Single answer or multiple answers
  questionType: 'multiple' | 'fill-blank' | 'reading-comprehension' | 'sentence-order';
  explanation?: string;
}

export interface ICompetitionReward {
  xp: number;
  coins: number;
}

export interface ICompetition extends Document {
  title: string;
  description: string;
  level: string;
  startDate: Date;
  endDate: Date;
  cost: number;
  reward: ICompetitionReward;
  prizes: ICompetitionPrize;
  questions: ICompetitionQuestion[];
  participants: mongoose.Types.ObjectId[];
  isActive: boolean;
  status: 'upcoming' | 'active' | 'ended';
  maxParticipants?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitionPrizeSchema: Schema = new Schema({
  first: {
    xp: { type: Number, required: true, min: 0 },
    coins: { type: Number, required: true, min: 0 }
  },
  second: {
    xp: { type: Number, required: true, min: 0 },
    coins: { type: Number, required: true, min: 0 }
  },
  third: {
    xp: { type: Number, required: true, min: 0 },
    coins: { type: Number, required: true, min: 0 }
  }
}, { _id: false });

const CompetitionQuestionSchema: Schema = new Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Schema.Types.Mixed, required: true }, // Can be number or array
  questionType: { 
    type: String, 
    required: true, 
    enum: ['multiple', 'fill-blank', 'reading-comprehension', 'sentence-order'] 
  },
  explanation: { type: String }
}, { _id: false });

const CompetitionRewardSchema: Schema = new Schema({
  xp: { type: Number, required: true, min: 0 },
  coins: { type: Number, required: true, min: 0 }
}, { _id: false });

const CompetitionSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  level: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  cost: { type: Number, required: true, min: 0 },
  reward: { type: CompetitionRewardSchema, required: true },
  prizes: { type: CompetitionPrizeSchema, required: true },
  questions: { type: [CompetitionQuestionSchema], required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['upcoming', 'active', 'ended'], 
    default: 'upcoming' 
  },
  maxParticipants: { type: Number, min: 1 }
}, { timestamps: true });

export default mongoose.model<ICompetition>('Competition', CompetitionSchema);