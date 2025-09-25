import mongoose, { Document, Schema } from 'mongoose';

export interface ILevel extends Document {
  name: string;
  number: number;
  description: string;
  requiredExperience: number;
  color: string;
}

const LevelSchema = new Schema<ILevel>({
  name: {
    type: String,
    required: [true, 'Level name is required'],
    unique: true,
    trim: true
  },
  number: {
    type: Number,
    required: [true, 'Level number is required'],
    unique: true,
    min: 1,
    max: 6
  },
  description: {
    type: String,
    required: [true, 'Level description is required'],
    trim: true
  },
  requiredExperience: {
    type: Number,
    required: [true, 'Required experience is required'],
    min: 0
  },
  color: {
    type: String,
    required: [true, 'Level color is required'],
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ILevel>('Level', LevelSchema);


