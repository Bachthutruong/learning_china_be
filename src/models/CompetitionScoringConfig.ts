import mongoose, { Document, Schema } from 'mongoose';

export interface IRankPoints {
  rank: number;
  points: number;
}

export interface ICompetitionScoringConfig extends Document {
  name: string;
  description?: string;
  isActive: boolean; // legacy, ignored
  effectiveFrom?: Date;
  effectiveTo?: Date;
  // Scoring rules based on room size
  // key: minimum participants (e.g., "10" means 10 or more participants)
  // value: array of { rank, points }
  scoringRules: {
    minParticipants: number; // Minimum number of participants for this rule
    maxParticipants?: number; // Maximum number of participants for this rule (inclusive)
    rankPoints: IRankPoints[]; // Points for each rank position
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const RankPointsSchema: Schema = new Schema({
  rank: {
    type: Number,
    required: true,
    min: 1
  },
  points: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const ScoringRuleSchema: Schema = new Schema({
  minParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  maxParticipants: {
    type: Number,
    required: false,
    min: 1
  },
  rankPoints: {
    type: [RankPointsSchema],
    required: true
  }
}, { _id: false });

const CompetitionScoringConfigSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Config name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  effectiveFrom: {
    type: Date,
    required: false
  },
  effectiveTo: {
    type: Date,
    required: false
  },
  scoringRules: {
    type: [ScoringRuleSchema],
    required: [true, 'Scoring rules are required']
  }
}, {
  timestamps: true
});

// Ensure only one active config
CompetitionScoringConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.model<ICompetitionScoringConfig>('CompetitionScoringConfig', CompetitionScoringConfigSchema);

