import mongoose, { Document, Schema } from 'mongoose';

export interface IUserVocabulary extends Document {
  userId: mongoose.Types.ObjectId;
  vocabularyId: mongoose.Types.ObjectId;
  status: 'learning' | 'known' | 'needs-study' | 'skipped';
  addedAt: Date;
  learnedAt?: Date;
  studyCount: number;
  lastStudied?: Date;
  customTopic?: string;
  isCustom: boolean;
}

const UserVocabularySchema = new Schema<IUserVocabulary>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vocabularyId: {
    type: Schema.Types.ObjectId,
    ref: 'Vocabulary',
    required: true
  },
  status: {
    type: String,
    enum: ['learning', 'known', 'needs-study', 'skipped'],
    default: 'learning'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  learnedAt: Date,
  studyCount: {
    type: Number,
    default: 0
  },
  lastStudied: Date,
  customTopic: String,
  isCustom: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
UserVocabularySchema.index({ userId: 1, status: 1 });
UserVocabularySchema.index({ userId: 1, vocabularyId: 1 }, { unique: true });

export default mongoose.model<IUserVocabulary>('UserVocabulary', UserVocabularySchema);

