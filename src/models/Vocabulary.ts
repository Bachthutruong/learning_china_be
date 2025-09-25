import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface IVocabulary extends Document {
  word: string;
  pronunciation: string;
  meaning: string;
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
    type: Number,
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
  pronunciation: {
    type: String,
    required: [true, 'Pronunciation is required'],
    trim: true
  },
  meaning: {
    type: String,
    required: [true, 'Meaning is required'],
    trim: true
  },
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


