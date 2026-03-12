import mongoose, { Document, Schema } from 'mongoose';

export interface IExampleContributionConfig extends Document {
  rewardContributor: number;
  rewardReviewer: number;
  updatedAt: Date;
}

const ExampleContributionConfigSchema = new Schema<IExampleContributionConfig>({
  rewardContributor: {
    type: Number,
    default: 1
  },
  rewardReviewer: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model<IExampleContributionConfig>('ExampleContributionConfig', ExampleContributionConfigSchema);
