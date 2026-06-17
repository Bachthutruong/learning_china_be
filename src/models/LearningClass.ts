import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningClass extends Document {
  name: string;
  description?: string;
  capacity: number;
  tuitionFee: number;
  groupLink?: string;
  teacherIds: mongoose.Types.ObjectId[];
  studentIds: mongoose.Types.ObjectId[];
  status: 'active' | 'archived';
  createdBy: mongoose.Types.ObjectId;
}

const LearningClassSchema = new Schema<ILearningClass>({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 20
  },
  tuitionFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  groupLink: {
    type: String,
    trim: true,
    default: ''
  },
  teacherIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  studentIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

LearningClassSchema.index({ name: 1 });
LearningClassSchema.index({ teacherIds: 1 });
LearningClassSchema.index({ studentIds: 1 });

export default mongoose.model<ILearningClass>('LearningClass', LearningClassSchema);
