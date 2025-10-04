import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number | number[];
  explanation?: string;
}

export interface IVocabulary extends Document {
  word: string;
  pinyin: string; // Renamed from pronunciation
  zhuyin?: string; // New field
  meaning: string;
  imageUrl?: string; // New field for Cloudinary image
  audioUrl?: string;
  level: number;
  topics: string[];
  partOfSpeech: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  questions: IQuestion[];
}

const QuestionSchema = new Schema<IQuestion>({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Schema.Types.Mixed,
    required: true
  },
  explanation: String
});

const VocabularySchema = new Schema<IVocabulary>({
  word: {
    type: String,
    required: [true, 'Word is required'],
    trim: true
  },
  pinyin: {
    type: String,
    required: [true, 'Pinyin is required'],
    trim: true
  },
  zhuyin: {
    type: String,
    trim: true
  },
  meaning: {
    type: String,
    required: [true, 'Meaning is required'],
    trim: true
  },
  imageUrl: String,
  audioUrl: String,
  level: {
    type: Number,
    required: [true, 'Level is required'],
    min: 1,
    max: 6
  },
  topics: [{
    type: String,
    required: true
  }],
  partOfSpeech: {
    type: String,
    required: [true, 'Part of speech is required'],
    trim: true
  },
  synonyms: [String],
  antonyms: [String],
  examples: [String],
  questions: [QuestionSchema]
}, {
  timestamps: true
});

export default mongoose.model<IVocabulary>('Vocabulary', VocabularySchema);


