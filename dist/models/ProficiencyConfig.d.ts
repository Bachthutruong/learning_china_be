import mongoose, { Document } from 'mongoose';
export interface IProficiencyConfig extends Document {
    name: string;
    description: string;
    cost: number;
    initialQuestions: {
        level: number;
        count: number;
    }[];
    branches: {
        name: string;
        condition: {
            correctRange: [number, number];
            fromPhase: 'initial' | 'followup';
        };
        nextQuestions: {
            level: number;
            count: number;
        }[];
        resultLevel?: number;
        nextPhase?: 'followup' | 'final';
    }[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IProficiencyConfig, {}, {}, {}, mongoose.Document<unknown, {}, IProficiencyConfig, {}, {}> & IProficiencyConfig & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ProficiencyConfig.d.ts.map