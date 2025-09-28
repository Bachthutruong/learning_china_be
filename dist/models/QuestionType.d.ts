import mongoose, { Document } from 'mongoose';
export interface IQuestionType extends Document {
    type: 'multiple-choice' | 'fill-blank' | 'reading-comprehension' | 'sentence-order' | 'matching' | 'true-false';
    name: string;
    description: string;
    icon: string;
    isActive: boolean;
}
declare const _default: mongoose.Model<IQuestionType, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionType, {}, {}> & IQuestionType & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionType.d.ts.map