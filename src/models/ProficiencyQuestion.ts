import mongoose, { Document, Schema } from 'mongoose';

export interface IProficiencyQuestion extends Document {
  question: string;
  options: string[];
  correctAnswer: number[];
  explanation?: string;
  level: number;
  questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order';
  createdAt: Date;
  updatedAt: Date;
}

const ProficiencyQuestionSchema: Schema = new Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: [{
    type: Number,
    required: true,
    min: 0
  }],
  explanation: {
    type: String,
    trim: true,
    default: ''
  },
  level: {
    type: Number,
    required: true,
    min: 1
  },
  questionType: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order'],
    default: 'multiple-choice'
  }
}, { timestamps: true });

// Index for efficient queries
ProficiencyQuestionSchema.index({ level: 1 });
ProficiencyQuestionSchema.index({ questionType: 1 });
ProficiencyQuestionSchema.index({ level: 1, questionType: 1 });

export default mongoose.model<IProficiencyQuestion>('ProficiencyQuestion', ProficiencyQuestionSchema);
