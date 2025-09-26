import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestionType extends Document {
  type: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order' | 'matching' | 'true-false';
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

const QuestionTypeSchema = new Schema<IQuestionType>({
  type: {
    type: String,
    required: true,
    unique: true,
    enum: ['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order', 'matching', 'true-false']
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IQuestionType>('QuestionType', QuestionTypeSchema);

