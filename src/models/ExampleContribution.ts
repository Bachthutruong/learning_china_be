import mongoose, { Document, Schema } from 'mongoose';

export interface IExampleContribution extends Document {
  vocabularyId: mongoose.Types.ObjectId;
  contributorId: mongoose.Types.ObjectId;
  content: string;
  isAnonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId?: mongoose.Types.ObjectId;
  editedContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExampleContributionSchema = new Schema<IExampleContribution>({
  vocabularyId: {
    type: Schema.Types.ObjectId,
    ref: 'Vocabulary',
    required: true
  },
  contributorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  editedContent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IExampleContribution>('ExampleContribution', ExampleContributionSchema);
