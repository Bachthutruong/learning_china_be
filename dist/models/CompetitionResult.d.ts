import mongoose, { Document } from 'mongoose';
export interface ICompetitionResult extends Document {
    competitionId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    score: number;
    timeSpent: number;
    rank?: number;
    rewards: {
        xp: number;
        coins: number;
    };
    answers: {
        questionId: string;
        userAnswer: number;
        isCorrect: boolean;
        timeSpent: number;
    }[];
}
declare const _default: mongoose.Model<ICompetitionResult, {}, {}, {}, mongoose.Document<unknown, {}, ICompetitionResult, {}, {}> & ICompetitionResult & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=CompetitionResult.d.ts.map