import mongoose, { Document, Schema } from 'mongoose';

export interface IUserCompetitionQuestion {
  question: string;
  options: string[];
  correctAnswer: number | number[];
  questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order';
  explanation?: string;
}

export interface IUserCompetition extends Document {
  creator: mongoose.Types.ObjectId;
  title: string;
  numberOfQuestions: number;
  timePerQuestion: number; // in minutes
  totalTime: number; // total time in minutes
  startTime: Date;
  endTime: Date;
  cost: number; // 10000 coins
  level: number; // creator's level
  questions: IUserCompetitionQuestion[];
  participants: mongoose.Types.ObjectId[];
  pendingRequests: mongoose.Types.ObjectId[];
  status: 'pending' | 'active' | 'completed';
  isStarted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserCompetitionQuestionSchema: Schema = new Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  questionType: { 
    type: String, 
    required: true, 
    enum: ['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order'] 
  },
  explanation: { type: String }
}, { _id: false });

const UserCompetitionSchema: Schema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  numberOfQuestions: {
    type: Number,
    required: [true, 'Number of questions is required'],
    min: 1,
    max: 20
  },
  timePerQuestion: {
    type: Number,
    required: [true, 'Time per question is required'],
    min: 0.5,
    max: 3
  },
  totalTime: {
    type: Number,
    required: [true, 'Total time is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  cost: {
    type: Number,
    default: 10000,
    required: true
  },
  level: {
    type: Number,
    required: [true, 'Level is required'],
    min: 1,
    max: 6
  },
  questions: [UserCompetitionQuestionSchema],
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingRequests: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  isStarted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Update status based on time
UserCompetitionSchema.pre<IUserCompetition>('save', function(next) {
  const now = new Date();
  if (now >= this.endTime) {
    this.status = 'completed';
  } else if (now >= this.startTime && this.isStarted) {
    this.status = 'active';
  } else {
    this.status = 'pending';
  }
  next();
});

// Calculate end time based on start time and total time
UserCompetitionSchema.pre<IUserCompetition>('save', function(next) {
  if (this.isModified('startTime') || this.isModified('totalTime')) {
    this.endTime = new Date(this.startTime.getTime() + this.totalTime * 60 * 1000);
  }
  next();
});

// Index for efficient queries
UserCompetitionSchema.index({ creator: 1, status: 1 });
UserCompetitionSchema.index({ startTime: 1, status: 1 });
UserCompetitionSchema.index({ participants: 1 });

export default mongoose.model<IUserCompetition>('UserCompetition', UserCompetitionSchema);
