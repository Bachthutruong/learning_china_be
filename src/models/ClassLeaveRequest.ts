import mongoose, { Document, Schema } from 'mongoose';

export interface IClassLeaveRequest extends Document {
  classId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  teacherNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
}

const ClassLeaveRequestSchema = new Schema<IClassLeaveRequest>({
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'LearningClass',
    required: true,
    index: true
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'ClassSession',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  teacherNote: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

ClassLeaveRequestSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<IClassLeaveRequest>('ClassLeaveRequest', ClassLeaveRequestSchema);
