import mongoose, { Document } from 'mongoose';
export interface ICompetitionPrize {
    first: {
        xp: number;
        coins: number;
    };
    second: {
        xp: number;
        coins: number;
    };
    third: {
        xp: number;
        coins: number;
    };
}
export interface ICompetitionQuestion {
    question: string;
    options: string[];
    correctAnswer: number | number[];
    questionType: 'multiple' | 'fill-blank' | 'reading-comprehension' | 'sentence-order';
    explanation?: string;
}
export interface ICompetitionReward {
    xp: number;
    coins: number;
}
export interface ICompetition extends Document {
    title: string;
    description: string;
    level: string;
    startDate: Date;
    endDate: Date;
    cost: number;
    reward: ICompetitionReward;
    prizes: ICompetitionPrize;
    questions: ICompetitionQuestion[];
    participants: mongoose.Types.ObjectId[];
    isActive: boolean;
    status: 'upcoming' | 'active' | 'ended';
    maxParticipants?: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICompetition, {}, {}, {}, mongoose.Document<unknown, {}, ICompetition, {}, {}> & ICompetition & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Competition.d.ts.map