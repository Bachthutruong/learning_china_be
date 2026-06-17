import mongoose, { Document, Schema } from 'mongoose';

export interface IClassJoinRequest extends Document {
  classId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
}

const ClassJoinRequestSchema = new Schema<IClassJoinRequest>({
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'LearningClass',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

ClassJoinRequestSchema.index({ classId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<IClassJoinRequest>('ClassJoinRequest', ClassJoinRequestSchema);
