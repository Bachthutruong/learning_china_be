import mongoose, { Schema, Document } from 'mongoose';

export interface ITestHistory extends Document {
  userId: mongoose.Types.ObjectId;
  level: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  rewards: { coins: number; experience: number };
  details: Array<{
    questionId: mongoose.Types.ObjectId;
    question: string;
    userAnswer: any;
    correctAnswer: any;
    correct: boolean;
  }>;
  createdAt: Date;
}

const TestHistorySchema = new Schema<ITestHistory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  level: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  wrongCount: { type: Number, required: true },
  rewards: {
    coins: { type: Number, required: true },
    experience: { type: Number, required: true }
  },
  details: [
    {
      questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
      question: { type: String, required: true },
      userAnswer: { type: Schema.Types.Mixed, required: false },
      correctAnswer: { type: Schema.Types.Mixed, required: true },
      correct: { type: Boolean, required: true }
    }
  ]
}, { timestamps: { createdAt: true, updatedAt: false } });

const TestHistory = mongoose.model<ITestHistory>('TestHistory', TestHistorySchema);
export default TestHistory;


