import mongoose, { Document, Schema } from 'mongoose';

export type QuestionType = 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order';

export interface IQuestionBank extends Document {
  level: number;
  questionType: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: number | string | number[];
  explanation?: string;
  passage?: string;
  blanks?: { position: number; correctAnswer: string }[];
  sentences?: string[];
  correctOrder?: number[];
  subQuestions?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  tags?: string[];
}

const QuestionBankSchema = new Schema<IQuestionBank>({
  level: { type: Number, required: true },
  questionType: { 
    type: String, 
    required: true, 
    enum: ['multiple-choice', 'fill-blank', 'reading-comprehension', 'sentence-order'] 
  },
  question: { type: String, required: true, trim: true },
  options: [String],
  correctAnswer: Schema.Types.Mixed,
  explanation: String,
  passage: String,
  blanks: [{ position: Number, correctAnswer: String }],
  sentences: [String],
  correctOrder: [Number],
  subQuestions: [{
    question: { type: String, required: true },
    options: [String],
    correctAnswer: { type: Number, required: true }
  }],
  tags: [String]
}, {
  timestamps: true
});

QuestionBankSchema.index({ level: 1 });

export default mongoose.model<IQuestionBank>('Question', QuestionBankSchema);


