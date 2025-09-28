import mongoose, { Document } from 'mongoose';
export interface IQuestion {
    question: string;
    options: string[];
    correctAnswer: number | number[];
    questionType?: 'single' | 'multiple';
    explanation?: string;
}
export interface IProficiencyTest extends Document {
    level: 'A' | 'B' | 'C';
    questions: IQuestion[];
    timeLimit: number;
    requiredCoins: number;
    rewardExperience: number;
    rewardCoins: number;
}
declare const _default: mongoose.Model<IProficiencyTest, {}, {}, {}, mongoose.Document<unknown, {}, IProficiencyTest, {}, {}> & IProficiencyTest & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ProficiencyTest.d.ts.map