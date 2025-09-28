import mongoose, { Document } from 'mongoose';
export interface IPersonalTopic extends Document {
    name: string;
    description?: string;
    userId: string;
    vocabularyCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PersonalTopic: mongoose.Model<IPersonalTopic, {}, {}, {}, mongoose.Document<unknown, {}, IPersonalTopic, {}, {}> & IPersonalTopic & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PersonalTopic.d.ts.map