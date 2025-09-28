import mongoose, { Document, Schema } from 'mongoose'

export interface IPersonalTopic extends Document {
  name: string
  description?: string
  userId: string
  vocabularyCount: number
  createdAt: Date
  updatedAt: Date
}

const PersonalTopicSchema = new Schema<IPersonalTopic>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  vocabularyCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Index for efficient queries
PersonalTopicSchema.index({ userId: 1 })
PersonalTopicSchema.index({ name: 1, userId: 1 }, { unique: true })

export const PersonalTopic = mongoose.model<IPersonalTopic>('PersonalTopic', PersonalTopicSchema)

