import mongoose, { Document, Schema } from 'mongoose';

export interface IUserCompetitionResult extends Document {
  competition: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  startedAt: Date;
  completedAt: Date;
  answers: {
    questionIndex: number;
    userAnswer: number | number[];
    isCorrect: boolean;
    timeSpent: number; // in seconds
  }[];
  rank?: number;
  points?: number; // Points earned based on rank and scoring config
}

const UserCompetitionResultSchema: Schema = new Schema({
  competition: {
    type: Schema.Types.ObjectId,
    ref: 'UserCompetition',
    required: [true, 'Competition is required']
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
    max: 100
  },
  correctAnswers: {
    type: Number,
    required: [true, 'Correct answers count is required'],
    min: 0
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions count is required'],
    min: 1
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: 0
  },
  startedAt: {
    type: Date,
    required: [true, 'Start time is required']
  },
  completedAt: {
    type: Date,
    required: [true, 'Completion time is required']
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    userAnswer: {
      type: Schema.Types.Mixed,
      default: null
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  rank: {
    type: Number,
    min: 1
  },
  points: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure one result per user per competition
UserCompetitionResultSchema.index({ competition: 1, user: 1 }, { unique: true });
// For efficient leaderboard queries
UserCompetitionResultSchema.index({ competition: 1, score: -1, timeSpent: 1 });

export default mongoose.model<IUserCompetitionResult>('UserCompetitionResult', UserCompetitionResultSchema);
