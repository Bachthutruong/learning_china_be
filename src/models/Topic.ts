import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  name: string;
  description: string;
  color: string;
}

const TopicSchema = new Schema<ITopic>({
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Topic description is required'],
    trim: true
  },
  color: {
    type: String,
    required: [true, 'Topic color is required'],
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ITopic>('Topic', TopicSchema);


