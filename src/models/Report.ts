import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'vocabulary' | 'test' | 'proficiency';
  targetId: string;
  category: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  rewardExperience?: number;
  rewardCoins?: number;
  adminNotes?: string;
}

const ReportSchema = new Schema<IReport>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['vocabulary', 'test', 'proficiency']
  },
  targetId: {
    type: String,
    required: [true, 'Target ID is required']
  },
  category: {
    type: String,
    required: [true, 'Report category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Report description is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rewardExperience: {
    type: Number,
    min: 0
  },
  rewardCoins: {
    type: Number,
    min: 0
  },
  adminNotes: String
}, {
  timestamps: true
});

export default mongoose.model<IReport>('Report', ReportSchema);
