import mongoose, { Document } from 'mongoose';
export interface IReport extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'vocabulary' | 'test' | 'proficiency';
    targetId: string;
    category: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    rewardExperience?: number;
    rewardCoins?: number;
    adminNotes?: string;
}
declare const _default: mongoose.Model<IReport, {}, {}, {}, mongoose.Document<unknown, {}, IReport, {}, {}> & IReport & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Report.d.ts.map