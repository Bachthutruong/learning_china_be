import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IVocabulary, {}, {}, {}, mongoose.Document<unknown, {}, IVocabulary, {}, {}> & IVocabulary & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Vocabulary.d.ts.map