import mongoose, { Document, Schema } from 'mongoose';

export interface IUserQuestionProgress extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  attempts: number;
  correct: boolean;
  lastAttemptAt: Date;
}

const UserQuestionProgressSchema = new Schema<IUserQuestionProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
  attempts: { type: Number, default: 0 },
  correct: { type: Boolean, default: false },
  lastAttemptAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

UserQuestionProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export default mongoose.model<IUserQuestionProgress>('UserQuestionProgress', UserQuestionProgressSchema);


