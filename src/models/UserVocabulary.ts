import mongoose, { Document, Schema } from 'mongoose'

export interface IUserVocabulary extends Document {
  userId: string
  vocabularyId: string
  status: 'learned' | 'studying' | 'skipped'
  personalTopicId?: string
  learnedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserVocabularySchema = new Schema<IUserVocabulary>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  vocabularyId: {
    type: String,
    required: true,
    ref: 'Vocabulary'
  },
  status: {
    type: String,
    enum: ['learned', 'studying', 'skipped'],
    required: true
  },
  personalTopicId: {
    type: String,
    ref: 'PersonalTopic'
  },
  learnedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Index for efficient queries
UserVocabularySchema.index({ userId: 1 })
UserVocabularySchema.index({ vocabularyId: 1 })
UserVocabularySchema.index({ status: 1 })
UserVocabularySchema.index({ personalTopicId: 1 })
UserVocabularySchema.index({ userId: 1, vocabularyId: 1 }, { unique: true })

export const UserVocabulary = mongoose.model<IUserVocabulary>('UserVocabulary', UserVocabularySchema)