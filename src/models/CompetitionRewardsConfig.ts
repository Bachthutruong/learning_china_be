import mongoose, { Document, Schema } from 'mongoose';

export interface IRankReward {
  rank: number;
  coins: number;
}

export interface ICompetitionRewardsConfig extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  // Rewards for global ranking positions
  rankRewards: IRankReward[]; // Coins reward for each global rank position
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RankRewardSchema: Schema = new Schema({
  rank: {
    type: Number,
    required: true,
    min: 1
  },
  coins: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const CompetitionRewardsConfigSchema: Schema = new Schema({
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
  rankRewards: {
    type: [RankRewardSchema],
    required: [true, 'Rank rewards are required']
  }
}, {
  timestamps: true
});

// Ensure only one active config
CompetitionRewardsConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.model<ICompetitionRewardsConfig>('CompetitionRewardsConfig', CompetitionRewardsConfigSchema);

