import mongoose, { Document } from 'mongoose';
export interface IUserQuestionProgress extends Document {
    userId: mongoose.Types.ObjectId;
    questionId: mongoose.Types.ObjectId;
    attempts: number;
    correct: boolean;
    lastAttemptAt: Date;
}
declare const _default: mongoose.Model<IUserQuestionProgress, {}, {}, {}, mongoose.Document<unknown, {}, IUserQuestionProgress, {}, {}> & IUserQuestionProgress & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=UserQuestionProgress.d.ts.map