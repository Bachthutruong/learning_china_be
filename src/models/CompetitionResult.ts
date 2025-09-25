import mongoose, { Document, Schema } from 'mongoose';

export interface ICompetitionResult extends Document {
  competitionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  score: number;
  timeSpent: number;
  rank?: number;
  rewards: {
    xp: number;
    coins: number;
  };
  answers: {
    questionId: string;
    userAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}

const CompetitionResultSchema = new Schema<ICompetitionResult>({
  competitionId: {
    type: Schema.Types.ObjectId,
    ref: 'Competition',
    required: [true, 'Competition ID is required']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: 0
  },
  rank: {
    type: Number,
    min: 1
  },
  rewards: {
    xp: {
      type: Number,
      required: true,
      min: 0
    },
    coins: {
      type: Number,
      required: true,
      min: 0
    }
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    userAnswer: {
      type: Number,
      required: true
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
  }]
}, {
  timestamps: true
});

// Index for efficient leaderboard queries
CompetitionResultSchema.index({ competitionId: 1, score: -1 });
CompetitionResultSchema.index({ competitionId: 1, userId: 1 }, { unique: true });

export default mongoose.model<ICompetitionResult>('CompetitionResult', CompetitionResultSchema);


