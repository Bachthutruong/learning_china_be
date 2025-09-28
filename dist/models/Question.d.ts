import mongoose, { Document } from 'mongoose';
export type QuestionType = 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order';
export interface IQuestionBank extends Document {
    level: number;
    questionType: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: number | string | number[];
    explanation?: string;
    passage?: string;
    blanks?: {
        position: number;
        correctAnswer: string;
    }[];
    sentences?: string[];
    correctOrder?: number[];
    tags?: string[];
}
declare const _default: mongoose.Model<IQuestionBank, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionBank, {}, {}> & IQuestionBank & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Question.d.ts.map