import mongoose, { Document } from 'mongoose';
export interface IQuestion {
    question: string;
    questionType: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order' | 'matching' | 'true-false';
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
    leftItems?: string[];
    rightItems?: string[];
    correctMatches?: {
        left: number;
        right: number;
    }[];
    isTrue?: boolean;
}
export interface ITest extends Document {
    title: string;
    description: string;
    level: number;
    questions: IQuestion[];
    timeLimit: number;
    requiredCoins: number;
    rewardExperience: number;
    rewardCoins: number;
    completedBy: mongoose.Types.ObjectId[];
}
declare const _default: mongoose.Model<ITest, {}, {}, {}, mongoose.Document<unknown, {}, ITest, {}, {}> & ITest & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Test.d.ts.map